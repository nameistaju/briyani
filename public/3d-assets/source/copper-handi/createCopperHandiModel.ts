import * as THREE from 'three';
import {
  buildPhotorealPbrTextures,
  clamp,
  enableAoUv,
  fbm2,
  mix,
  mixRgb,
  PhotorealOptions,
  smoothstep,
  valueNoise2,
  worley2,
} from '../../../../tools/shared/photoreal3d';

export type { ProceduralModelOptions, ProceduralModelRuntime } from '../../../../tools/shared/proc3d';

const HANDI_HALF_THICK = 0.0028;

// Exact sculptural handi profile (0.288m width x 0.160m height) matching reference silhouette:
// rounded stable base with subtle foot ring -> bulbous lower belly -> angled shoulder -> neck waist -> beveled rolled rim
const OUTER_PROFILE: [number, number][] = [
  [0.0001, 0.001],
  [0.044, 0.0012],
  [0.056, 0.0028], // subtle resting foot ring
  [0.068, 0.0055],
  [0.098, 0.0155],
  [0.126, 0.035],
  [0.141, 0.058],
  [0.1435, 0.078], // widest belly
  [0.138, 0.098],
  [0.124, 0.116], // inward shoulder
  [0.111, 0.129], // narrow neck waist
  [0.114, 0.138],
  [0.128, 0.148],
  [0.140, 0.155], // outward flare
  [0.1435, 0.1595], // thick rolled outer rim edge
  [0.1405, 0.1628], // rounded lip crest
  [0.132, 0.163],
  [0.1255, 0.1595], // inner folded lip
  [0.115, 0.148],
  [0.107, 0.135],
];

function evalCatmullProfile(pts: [number, number][], samples: number): THREE.Vector2[] {
  const vecs = pts.map(([r, y]) => new THREE.Vector2(r, y));
  const curve = new THREE.SplineCurve(vecs);
  return curve.getPoints(samples);
}

/**
 * Tileable staggered coppersmith planishing Worley field (small oval hammer dimples).
 */
function hammeredCell(u: number, v: number, cols = 42, rows = 20): { dist: number; edge: number; tilt: number; id: number } {
  const gx = u * cols;
  const gy = v * rows;
  const ix = Math.floor(gx);
  const iy = Math.floor(gy);
  const fx = gx - ix;
  const fy = gy - iy;

  let d1 = 99;
  let d2 = 99;
  let id = 0;
  let bestDx = 0;
  let bestDy = 0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = ((ix + dx) % cols + cols) % cols;
      const cy = ((iy + dy) % rows + rows) % rows;
      const stagger = (cy % 2) * 0.5;
      const h1 = valueNoise2(cx * 3.17, cy * 5.41, 107);
      const h2 = valueNoise2(cx * 7.13, cy * 2.89, 313);
      const px = dx + 0.5 + stagger * 0.92 + (h1 - 0.5) * 0.24 - fx;
      const py = dy + 0.5 + (h2 - 0.5) * 0.22 - fy;
      // Slightly wider oval hammer marks horizontally
      const d = Math.hypot(px * 0.92, py * 1.12);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        id = h1;
        bestDx = px;
        bestDy = py;
      } else if (d < d2) {
        d2 = d;
      }
    }
  }
  return {
    dist: clamp(d1, 0, 1),
    edge: smoothstep(0.0, 0.36, d2 - d1),
    tilt: bestDx * 0.6 + bestDy * 0.4,
    id,
  };
}

function buildHammeredExteriorGeometry(radialSegs: number, heightSegs: number): THREE.BufferGeometry {
  const profile = evalCatmullProfile(OUTER_PROFILE, heightSegs);
  const cols = radialSegs + 1;
  const rows = profile.length;
  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const indices: number[] = [];

  // Tighter coppersmith hammered scale (cols=56, rows=28) across full belly & base shoulder
  for (let iy = 0; iy < rows; iy++) {
    const v = iy / (rows - 1);
    const pt = profile[iy];
    const rBase = pt.x;
    const yBase = pt.y;

    // Hammered band covers mid-base to below smooth rolled rim (y = 0.012..0.132)
    const hMask = smoothstep(0.01, 0.026, yBase) * (1 - smoothstep(0.126, 0.138, yBase));

    for (let ix = 0; ix < cols; ix++) {
      const u = ix / radialSegs;
      const theta = u * Math.PI * 2;
      const periodicU = u % 1;

      const cell = hammeredCell(periodicU, v, 56, 28);
      // Concave scooped hammer bowl: deep in center, crisp ridge at Voronoi boundary
      const concaveDepth = (1 - Math.pow(clamp(cell.dist * 1.65, 0, 1), 2)) * -0.00135;
      const ridgeCrest = (1 - cell.edge) * 0.00042;
      // Subtle artisan lathe wobble
      const artisanWobble = (fbm2(Math.cos(theta) * 2.2 + 4, Math.sin(theta) * 2.2 + v * 6, 3, 55) - 0.5) * 0.0007;
      const dr = (concaveDepth + ridgeCrest) * hMask + artisanWobble * (0.3 + 0.7 * hMask);

      const r = Math.max(0.0001, rBase + dr);
      const idx = iy * cols + ix;
      positions[idx * 3] = Math.cos(theta) * r;
      positions[idx * 3 + 1] = yBase;
      positions[idx * 3 + 2] = Math.sin(theta) * r;
      uvs[idx * 2] = u;
      uvs[idx * 2 + 1] = v;
    }
  }

  for (let iy = 0; iy < rows - 1; iy++) {
    for (let ix = 0; ix < radialSegs; ix++) {
      const a = iy * cols + ix;
      const b = (iy + 1) * cols + ix;
      const c = (iy + 1) * cols + (ix + 1);
      const d = iy * cols + (ix + 1);
      // CCW winding when facing radially outward (+Y up, +theta clockwise around +Y looking down)
      indices.push(a, b, d, b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  enableAoUv(geom);
  return geom;
}

export function createHammeredCopperBiryaniHandiModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'copper-handi';

  const texSize = options.textureSize ?? 2048;

  // Sampled palette from Hammered Copper Biryani Handi Pot.png:
  // crevice patina #4e1d02 -> burnished mid copper #9e4d02 -> specular bright copper #d7844f
  const copperTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const cell = hammeredCell(u, v, 56, 28);
      const metalGrain = valueNoise2(u * 320, v * 140, 71);
      const firePatina = fbm2(u * 14, v * 12, 4, 309);

      // Base heat darkening at very bottom base + neck waist
      const bottomHeat = 1 - smoothstep(0.04, 0.22, v);
      const sootNeck = Math.exp(-Math.pow((v - 0.68) / 0.09, 2)) * (0.28 + 0.52 * firePatina);
      const rimSmooth = smoothstep(0.73, 0.85, v);

      const ridgeHighlight = 1 - cell.edge;
      const dimplePocket = smoothstep(0.18, 0.68, cell.dist) * (1 - rimSmooth);

      const cCrevice: [number, number, number] = [68, 24, 6];
      const cMid: [number, number, number] = [164, 70, 16];
      const cBright: [number, number, number] = [228, 128, 62];

      let rgb = mixRgb(cCrevice, cMid, clamp(0.28 + 0.45 * cell.id + 0.35 * ridgeHighlight, 0, 1));
      rgb = mixRgb(rgb, cBright, clamp(ridgeHighlight * 0.52 + rimSmooth * 0.52 + cell.tilt * 0.14, 0, 1));
      // Warm reddish fire patina & dark base oxidation
      rgb = mixRgb(rgb, [52, 18, 6], clamp(bottomHeat * 0.64 + sootNeck * 0.48 + dimplePocket * 0.22, 0, 0.85));

      // Subtle micro-polish streaking
      const streak = (metalGrain - 0.5) * 14;
      const ao = clamp(0.66 + 0.34 * ridgeHighlight - bottomHeat * 0.18 + rimSmooth * 0.2, 0.48, 1.0);
      const rough = clamp(
        0.16 + dimplePocket * 0.16 + firePatina * 0.12 + bottomHeat * 0.18 - ridgeHighlight * 0.08 - rimSmooth * 0.06,
        0.10,
        0.55
      );
      const h = (1 - cell.dist * 0.8) * 0.6 * (1 - rimSmooth) + ridgeHighlight * 0.25 + metalGrain * 0.08;

      return {
        r: rgb[0] + streak,
        g: rgb[1] + streak * 0.65,
        b: rgb[2] + streak * 0.4,
        h,
        rough,
        ao,
        metal: 1.0,
      };
    },
    { normalStrength: 3.4 }
  );

  // Satin warm golden-brass spun interior matching reference inner bowl tone
  const brassTex = buildPhotorealPbrTextures(
    Math.min(1024, texSize),
    (u, v) => {
      const radialBrush = fbm2(u * 4, v * 190, 3, 88);
      const stain = fbm2(u * 12, v * 12, 4, 412);
      let rgb = mixRgb([148, 108, 42], [202, 154, 68], 0.42 + 0.42 * radialBrush);
      rgb = mixRgb(rgb, [74, 42, 16], clamp(stain * 0.34 + (1 - v) * 0.16, 0, 0.7));
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: radialBrush * 0.35 + stain * 0.15,
        rough: clamp(0.28 + radialBrush * 0.14 + stain * 0.18, 0.22, 0.62),
        ao: clamp(0.72 + 0.28 * (1 - v), 0.55, 1.0),
        metal: 0.92,
      };
    },
    { normalStrength: 1.6 }
  );

  const copperMat = new THREE.MeshPhysicalMaterial({
    name: 'hammered-copper',
    map: copperTex.albedoMap,
    normalMap: copperTex.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    aoMap: copperTex.ormMap,
    aoMapIntensity: 0.85,
    roughnessMap: copperTex.ormMap,
    metalnessMap: copperTex.ormMap,
    roughness: 1.0, // modulated directly by ORM roughness channel (0.10..0.48)
    metalness: 1.0,
    anisotropy: 0.35,
    clearcoat: 0.08,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.35,
    wireframe: options.wireframe ?? false,
  });

  const interiorMat = new THREE.MeshPhysicalMaterial({
    name: 'tinned-brass-interior',
    map: brassTex.albedoMap,
    normalMap: brassTex.normalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    aoMap: brassTex.ormMap,
    aoMapIntensity: 0.75,
    roughnessMap: brassTex.ormMap,
    metalnessMap: brassTex.ormMap,
    roughness: 1.0,
    metalness: 0.96,
    anisotropy: 0.45,
    envMapIntensity: 1.15,
    wireframe: options.wireframe ?? false,
  });

  // High-poly exterior belly + rolled rim: 256 x 128 = ~65,536 tris true hammered surface
  const radialSegs = options.highPoly === false ? 128 : 256;
  const heightSegs = options.highPoly === false ? 64 : 128;

  const bellyGeom = buildHammeredExteriorGeometry(radialSegs, heightSegs);
  const bellyMesh = new THREE.Mesh(bellyGeom, copperMat);
  bellyMesh.name = 'hammered-copper-vessel';
  bellyMesh.castShadow = options.castShadow ?? true;
  bellyMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(bellyMesh);

  // Inner bowl liner connecting seamlessly to folded lip edge (top->bottom winding = normals inside bowl)
  const interiorPts: [number, number][] = [
    [0.107, 0.135],
    [0.114, 0.118],
    [0.131, 0.094],
    [0.136, 0.070],
    [0.124, 0.042],
    [0.095, 0.020],
    [0.056, 0.009],
    [0.0001, 0.0065],
  ];
  const interiorCurve = evalCatmullProfile(interiorPts, 48);
  const interiorGeom = new THREE.LatheGeometry(interiorCurve, radialSegs);
  interiorGeom.computeVertexNormals();
  enableAoUv(interiorGeom);
  const interiorMesh = new THREE.Mesh(interiorGeom, interiorMat);
  interiorMesh.name = 'interior-bowl-liner';
  interiorMesh.castShadow = false;
  interiorMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(interiorMesh);

  // Preserved assembly sockets
  const riceSocket = new THREE.Object3D();
  riceSocket.name = 'rice-cavity';
  riceSocket.position.set(0, 0.075, 0);
  riceSocket.userData.socket = { id: 'rice-cavity', innerBellyRadius: 0.134, neckInnerRadius: 0.106, floorY: 0.012, rimY: 0.16 };
  root.add(riceSocket);

  const rimSocket = new THREE.Object3D();
  rimSocket.name = 'rim-top';
  rimSocket.position.set(0, 0.16, 0);
  rimSocket.userData.socket = { id: 'rim-top', outerRadius: 0.1435, innerRadius: 0.1255 };
  root.add(rimSocket);

  return root;
}

export const createCopperHandiModel = createHammeredCopperBiryaniHandiModel;
export default createHammeredCopperBiryaniHandiModel;
