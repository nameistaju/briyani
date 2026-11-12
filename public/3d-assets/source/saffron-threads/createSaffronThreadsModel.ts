import * as THREE from 'three';
import {
  buildPhotorealPbrTextures,
  clamp,
  createSeededRng,
  enableAoUv,
  fbm2,
  mergeGeomsSafe,
  mixRgb,
  smoothstep,
} from '../../../../tools/shared/photoreal3d';

export interface PhotorealOptions {
  textureSize?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  wireframe?: boolean;
}

/**
 * Builds a single high-detail organic saffron crocus stigma (orange slender tail flaring
 * smoothly into a grooved dark-crimson fluted cup tip).
 */
function buildSaffronStigma(length: number, archH: number, sway: number, seedVal: number): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k < 6; k++) {
    const f = k / 5;
    pts.push(
      new THREE.Vector3(
        (f - 0.5) * length,
        Math.sin(f * Math.PI) * archH + (f - 0.5) * 0.005,
        Math.sin(f * Math.PI * 1.45 + seedVal) * sway * 0.55
      )
    );
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const segU = 36;
  const segR = 14;
  const g = new THREE.TubeGeometry(curve, segU, 0.001, segR, false);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const u = clamp(uv.getX(i), 0, 1);
    const v = uv.getY(i);
    const ang = v * Math.PI * 2;
    const center = curve.getPointAt(u);
    const flute = 1 + 0.18 * Math.cos(ang * 3 + u * 2) * smoothstep(0.35, 0.9, u);
    const tipPinch = smoothstep(1.0, 0.96, u);
    // Slender orange base tail at u=0..0.3 -> flaring striated crimson trumpet at u=0.55..0.95
    const r = (0.00030 + Math.pow(u, 2.0) * 0.00118) * flute * tipPinch;
    const scale = r / 0.001;
    pos.setXYZ(
      i,
      center.x + (pos.getX(i) - center.x) * scale,
      center.y + (pos.getY(i) - center.y) * scale,
      center.z + (pos.getZ(i) - center.z) * scale
    );
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  enableAoUv(g);
  return g;
}

export function createSaffronThreadsModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'saffron-threads';

  const rng = createSeededRng(5512);
  const texSize = options.textureSize ?? 512;

  // Fine dried fibrous striations & crisp stigma granulation
  const saffronTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const flute = Math.sin(v * 34 + fbm2(u * 20, v * 12, 3, 27) * 1.8) * 0.5 + 0.5;
      const cell = fbm2(u * 48, v * 18, 4, 66);
      const rgb = mixRgb([214, 192, 184], [252, 236, 224], 0.35 + cell * 0.5);
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: flute * 0.5 + cell * 0.4,
        rough: clamp(0.46 + (1 - cell) * 0.28, 0.34, 0.82),
        ao: clamp(0.68 + 0.32 * flute, 0.48, 1.0),
      };
    },
    { normalStrength: 3.2 }
  );

  const saffronMat = new THREE.MeshPhysicalMaterial({
    name: 'crimson-saffron-stigma',
    map: saffronTex.albedoMap,
    normalMap: saffronTex.normalMap,
    normalScale: new THREE.Vector2(0.95, 0.95),
    aoMap: saffronTex.ormMap,
    aoMapIntensity: 0.72,
    roughnessMap: saffronTex.ormMap,
    roughness: 1.0,
    sheen: 0.42,
    sheenColor: new THREE.Color(0xff5a1f),
    sheenRoughness: 0.45,
    vertexColors: true,
    wireframe: options.wireframe ?? false,
  });

  // Sampled palette: dark crimson cup #450602 / #821310 -> scarlet red #d93218 -> saffron orange filament #f37a06
  const crimsonCup = new THREE.Color().setStyle('#680804', THREE.SRGBColorSpace);
  const brightScarlet = new THREE.Color().setStyle('#d92c12', THREE.SRGBColorSpace);
  const saffronGold = new THREE.Color().setStyle('#f37a06', THREE.SRGBColorSpace);

  const strands: THREE.BufferGeometry[] = [];

  // 26 Interlaced Sculpted Saffron Stigmas (~26,200 tris)
  for (let i = 0; i < 26; i++) {
    const len = 0.036 + rng() * 0.022;
    const archH = 0.008 + rng() * 0.012;
    const sway = (rng() - 0.5) * 0.018;
    const g = buildSaffronStigma(len, archH, sway, i * 13);

    g.applyMatrix4(
      new THREE.Matrix4().compose(
        new THREE.Vector3((rng() - 0.5) * 0.020, (rng() - 0.5) * 0.016, (rng() - 0.5) * 0.018),
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler((rng() - 0.5) * 1.25, rng() * Math.PI * 2, (rng() - 0.5) * 1.15)
        ),
        new THREE.Vector3(1, 1, 1)
      )
    );

    const uv = g.attributes.uv;
    const vCount = g.attributes.position.count;
    const cols = new Float32Array(vCount * 3);
    for (let v = 0; v < vCount; v++) {
      const t = uv.getX(v);
      const vc =
        t < 0.32
          ? saffronGold.clone().lerp(brightScarlet, t / 0.32)
          : brightScarlet.clone().lerp(crimsonCup, clamp((t - 0.32) / 0.68, 0, 1));
      cols[v * 3] = vc.r;
      cols[v * 3 + 1] = vc.g;
      cols[v * 3 + 2] = vc.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    strands.push(g);
  }

  const merged = mergeGeomsSafe(strands);
  for (const g of strands) g.dispose();
  enableAoUv(merged);

  const mesh = new THREE.Mesh(merged, saffronMat);
  mesh.name = 'saffron-strands';
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  root.add(mesh);

  return root;
}

export default createSaffronThreadsModel;
