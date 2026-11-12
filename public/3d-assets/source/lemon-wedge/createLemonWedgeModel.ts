import * as THREE from 'three';
import {
  buildClearDropletGeometry,
  buildPhotorealPbrTextures,
  clamp,
  createDropletMaterial,
  enableAoUv,
  fbm2,
  mergeGeomsSafe,
  mixRgb,
  PhotorealOptions,
  smoothstep,
  worley2,
} from '../../../../tools/shared/photoreal3d';

export function createLemonWedgeModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'lemon-wedge';

  const texSize = options.textureSize ?? 1024;

  // Sampled palette: rich sunny lemon rind #ebb107 -> bright yellow citrus oil #fac902 -> creamy pith highlight #f8d451
  const peelTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const pores = worley2(u * 48, v * 32, 44);
      const dimple = smoothstep(0.36, 0.04, pores.f1);
      const mottle = fbm2(u * 12, v * 12, 3, 81);
      let rgb = mixRgb([238, 184, 6], [250, 212, 24], clamp(0.45 + mottle * 0.45 - dimple * 0.25, 0, 1));
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: 0.72 - dimple * 0.65 + mottle * 0.18,
        rough: clamp(0.24 + dimple * 0.22, 0.18, 0.55),
        ao: clamp(0.72 + 0.28 * (1 - dimple), 0.55, 1.0),
      };
    },
    { normalStrength: 3.8 }
  );

  // Translucent glistening citrus juice-vesicle cut faces + white spongy pith margin
  const pulpTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      // u = 0..1 from pointed center pith spine outward to rind rim
      // v = 0..1 along lemon arc pole-to-pole
      const radiusFrac = clamp(u, 0, 1);
      const pithCenter = smoothstep(0.14, 0.02, radiusFrac);
      const pithRim = smoothstep(0.76, 0.90, radiusFrac);
      const vesicle = worley2(u * 38, v * 52, 555);
      const vesCell = smoothstep(0.62, 0.14, vesicle.f1);
      // 3 radial segment septum walls across arc
      const septum = smoothstep(0.08, 0.0, Math.abs(Math.sin(v * Math.PI * 3.2))) * smoothstep(0.1, 0.78, radiusFrac);

      const pulpYellow: [number, number, number] = [255, 214, 18];
      const deepJuice: [number, number, number] = [242, 166, 4];
      const whitePith: [number, number, number] = [254, 249, 224];

      let rgb = mixRgb(deepJuice, pulpYellow, clamp(0.35 + vesCell * 0.6, 0, 1));
      rgb = mixRgb(rgb, whitePith, clamp(pithCenter * 0.95 + pithRim * 0.92 + septum * 0.85, 0, 0.98));

      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: vesCell * 0.65 * (1 - pithRim) + pithRim * 0.25 + septum * 0.2,
        rough: clamp(0.05 + (pithRim + pithCenter + septum) * 0.45, 0.04, 0.68),
        ao: clamp(0.68 + 0.32 * vesCell, 0.5, 1.0),
      };
    },
    { normalStrength: 3.4, wrapRepeat: false }
  );

  const peelMat = new THREE.MeshPhysicalMaterial({
    name: 'lemon-zest-rind',
    map: peelTex.albedoMap,
    normalMap: peelTex.normalMap,
    normalScale: new THREE.Vector2(1.15, 1.15),
    aoMap: peelTex.ormMap,
    aoMapIntensity: 0.7,
    roughnessMap: peelTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.58,
    clearcoatRoughness: 0.16,
    wireframe: options.wireframe ?? false,
  });

  const pulpMat = new THREE.MeshPhysicalMaterial({
    name: 'glistening-citrus-pulp',
    map: pulpTex.albedoMap,
    normalMap: pulpTex.normalMap,
    normalScale: new THREE.Vector2(1.15, 1.15),
    aoMap: pulpTex.ormMap,
    aoMapIntensity: 0.78,
    roughnessMap: pulpTex.ormMap,
    roughness: 1.0,
    emissive: new THREE.Color(0x4a2e00),
    emissiveIntensity: 0.28,
    clearcoat: 0.96,
    clearcoatRoughness: 0.05,
    sheen: 0.16,
    sheenColor: new THREE.Color(0xffe966),
    wireframe: options.wireframe ?? false,
  });

  // Closed seam-free 74-degree Lemon Wedge geometry divided into Peel exterior vs Twin Cut Faces (~15,500 tris)
  const halfAngle = (37 * Math.PI) / 180;
  const rx = 0.041; // pole length half
  const ry = 0.030; // equatorial radius
  const uSegs = 68; // along length
  const rSegs = 28; // radial spine -> outer rind on cut faces
  const arcSegs = 40; // around outer peel arc

  const evalMaxR = (u: number) => {
    const t = u * Math.PI;
    const endNip = 1 + 0.14 * Math.exp(-Math.pow((u - 0.06) / 0.08, 2)) + 0.14 * Math.exp(-Math.pow((u - 0.94) / 0.08, 2));
    return Math.sin(t) * ry * 0.96 * endNip;
  };
  const evalY = (u: number) => -Math.cos(u * Math.PI) * rx;

  // 1. Cut faces (front -halfAngle & back +halfAngle) cleanly stitched to spine & rim!
  const cutVerts: number[] = [];
  const cutUvs: number[] = [];
  const cutIdx: number[] = [];
  const rows = uSegs + 1;
  const cols = rSegs + 1;

  for (let side = 0; side < 2; side++) {
    const phi = side === 0 ? -halfAngle : halfAngle;
    const baseOffset = side * rows * cols;
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = iu / uSegs;
      const y = evalY(u);
      const maxR = evalMaxR(u);
      for (let ir = 0; ir <= rSegs; ir++) {
        const rf = ir / rSegs;
        const r = rf * maxR;
        // Slight recessed juicy sac dip on cut face
        const dip = smoothstep(0.14, 0.35, rf) * smoothstep(0.84, 0.65, rf) * 0.0009;
        const pAdj = side === 0 ? phi + dip * 0.3 : phi - dip * 0.3;
        cutVerts.push(Math.cos(pAdj) * r, y, Math.sin(pAdj) * r);
        cutUvs.push(rf, u);
      }
    }
    for (let iu = 0; iu < uSegs; iu++) {
      for (let ir = 0; ir < rSegs; ir++) {
        const a = baseOffset + iu * cols + ir;
        const b = baseOffset + (iu + 1) * cols + ir;
        const c = baseOffset + (iu + 1) * cols + (ir + 1);
        const d = baseOffset + iu * cols + (ir + 1);
        if (side === 0) cutIdx.push(a, b, d, b, c, d);
        else cutIdx.push(a, d, b, b, d, c);
      }
    }
  }
  const pulpGeom = new THREE.BufferGeometry();
  pulpGeom.setAttribute('position', new THREE.Float32BufferAttribute(cutVerts, 3));
  pulpGeom.setAttribute('uv', new THREE.Float32BufferAttribute(cutUvs, 2));
  pulpGeom.setIndex(cutIdx);
  pulpGeom.computeVertexNormals();
  enableAoUv(pulpGeom);

  // 2. Curved Outer Peel Arc spanning strictly from -halfAngle to +halfAngle (meets cut faces with zero gap!)
  const peelVerts: number[] = [];
  const peelUvs: number[] = [];
  const peelIdx: number[] = [];
  const pCols = arcSegs + 1;
  for (let iu = 0; iu <= uSegs; iu++) {
    const u = iu / uSegs;
    const y = evalY(u);
    const maxR = evalMaxR(u);
    for (let ia = 0; ia <= arcSegs; ia++) {
      const af = ia / arcSegs;
      const phi = -halfAngle + af * halfAngle * 2;
      const pore = (worley2(af * 22, u * 28, 44).f1 - 0.3) * 0.00025 * Math.sin(u * Math.PI);
      const r = maxR - pore;
      peelVerts.push(Math.cos(phi) * r, y, Math.sin(phi) * r);
      peelUvs.push(af, u);
    }
  }
  for (let iu = 0; iu < uSegs; iu++) {
    for (let ia = 0; ia < arcSegs; ia++) {
      const a = iu * pCols + ia;
      const b = (iu + 1) * pCols + ia;
      const c = (iu + 1) * pCols + (ia + 1);
      const d = iu * pCols + (ia + 1);
      peelIdx.push(a, b, d, b, c, d);
    }
  }
  const peelGeom = new THREE.BufferGeometry();
  peelGeom.setAttribute('position', new THREE.Float32BufferAttribute(peelVerts, 3));
  peelGeom.setAttribute('uv', new THREE.Float32BufferAttribute(peelUvs, 2));
  peelGeom.setIndex(peelIdx);
  peelGeom.computeVertexNormals();
  enableAoUv(peelGeom);

  const pulpMesh = new THREE.Mesh(pulpGeom, pulpMat);
  pulpMesh.name = 'lemon-pulp-wedges';
  pulpMesh.castShadow = options.castShadow ?? true;
  pulpMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(pulpMesh);

  const peelMesh = new THREE.Mesh(peelGeom, peelMat);
  peelMesh.name = 'lemon-peel-rind';
  peelMesh.castShadow = options.castShadow ?? true;
  peelMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(peelMesh);

  // Embedded cream citrus seeds near central pith + clear glistening juice/dew droplets
  const seedMat = new THREE.MeshPhysicalMaterial({ color: 0xf5e2a4, roughness: 0.22, clearcoat: 0.7 });
  const seedGeoms: THREE.BufferGeometry[] = [];
  for (const [sy, sr, side] of [[0.009, 0.0065, -halfAngle], [-0.011, 0.007, halfAngle]] as const) {
    const sg = new THREE.SphereGeometry(0.0018, 12, 10);
    sg.scale(0.6, 1.35, 0.65);
    sg.translate(Math.cos(side) * sr, sy, Math.sin(side) * sr);
    seedGeoms.push(sg);
  }
  const mergedSeeds = mergeGeomsSafe(seedGeoms);
  for (const g of seedGeoms) g.dispose();
  root.add(new THREE.Mesh(mergedSeeds, seedMat));

  const dropGeoms: THREE.BufferGeometry[] = [];
  for (const [dx, dy, dz, r] of [
    [0.029, 0.006, 0.004, 0.0019],
    [0.025, -0.014, -0.005, 0.0016],
    [0.012, 0.015, 0.012, 0.0015],
    [0.015, -0.005, -0.013, 0.0017],
  ] as const) {
    const dg = buildClearDropletGeometry(r, 16, 12);
    dg.translate(dx, dy, dz);
    dropGeoms.push(dg);
  }
  const dMerged = mergeGeomsSafe(dropGeoms);
  for (const g of dropGeoms) g.dispose();
  root.add(new THREE.Mesh(dMerged, createDropletMaterial()));

  // Sculptural showcase pose matching dynamic crescent angle
  root.rotation.set(0.32, -0.45, -1.08);

  return root;
}

export default createLemonWedgeModel;
