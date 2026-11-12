import * as THREE from 'three';
import {
  buildBotanicalThickLeaf,
  buildClearDropletGeometry,
  buildPhotorealPbrTextures,
  clamp,
  createDropletMaterial,
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

function splitThickLeafGroups(leafGeom: THREE.BufferGeometry): { top: THREE.BufferGeometry; bottom: THREE.BufferGeometry } {
  const nonIdx = leafGeom.index ? leafGeom.toNonIndexed() : leafGeom;
  const posAttr = nonIdx.getAttribute('position');
  const uvAttr = nonIdx.getAttribute('uv');
  const normAttr = nonIdx.getAttribute('normal');
  const g0 = nonIdx.groups[0] ?? { start: 0, count: Math.floor(posAttr.count / 2) };
  const g1 = nonIdx.groups[1] ?? { start: g0.count, count: posAttr.count - g0.count };

  const sliceGeom = (start: number, count: number) => {
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute((posAttr.array as Float32Array).slice(start * 3, (start + count) * 3), 3));
    out.setAttribute('uv', new THREE.BufferAttribute((uvAttr.array as Float32Array).slice(start * 2, (start + count) * 2), 2));
    out.setAttribute('normal', new THREE.BufferAttribute((normAttr.array as Float32Array).slice(start * 3, (start + count) * 3), 3));
    enableAoUv(out);
    return out;
  };
  const res = { top: sliceGeom(g0.start, g0.count), bottom: sliceGeom(g1.start, g1.count) };
  if (nonIdx !== leafGeom) nonIdx.dispose();
  return res;
}

function buildStemWithNode(pts: THREE.Vector3[], baseR: number, tipR: number, segU = 18, segR = 10): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(pts);
  const g = new THREE.TubeGeometry(curve, segU, baseR, segR, false);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i);
    const center = curve.getPointAt(clamp(u, 0, 1));
    const taper = baseR * (1 - u) + tipR * u;
    const scale = taper / Math.max(1e-6, baseR);
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

export function createCilantroSprigModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'cilantro-sprig';

  const texSize = options.textureSize ?? 1024;

  // Sampled palette: rich emerald green #455407 -> crisp cilantro leaf #7fa301 -> bright edge #98b812
  const topTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const distMid = Math.abs(u - 0.5) * 2;
      const veinCenter = Math.exp(-Math.pow(distMid * 15, 2));
      const fanVein1 = Math.exp(-Math.pow((u - 0.5 - v * 0.34) * 18, 2)) * (1 - v * 0.2);
      const fanVein2 = Math.exp(-Math.pow((u - 0.5 + v * 0.34) * 18, 2)) * (1 - v * 0.2);
      const vein = clamp(Math.max(veinCenter, fanVein1, fanVein2) * (1 - v * 0.15), 0, 1);

      const cell = fbm2(u * 26, v * 26, 4, 133);
      const edgeLight = smoothstep(0.65, 0.95, distMid) + smoothstep(0.75, 0.96, v);

      let rgb = mixRgb([22, 80, 6], [78, 146, 12], clamp(0.32 + cell * 0.55, 0, 1));
      rgb = mixRgb(rgb, [132, 184, 26], clamp(vein * 0.5 + edgeLight * 0.28, 0, 0.82));

      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: cell * 0.4 + vein * 0.45,
        rough: clamp(0.24 + vein * 0.15 + (1 - cell) * 0.12, 0.18, 0.52),
        ao: clamp(0.72 + 0.28 * cell - vein * 0.1, 0.52, 1.0),
      };
    },
    { normalStrength: 3.0, wrapRepeat: false }
  );

  const underTex = buildPhotorealPbrTextures(
    512,
    (u, v) => {
      const n = fbm2(u * 20, v * 20, 3, 212);
      const rgb = mixRgb([76, 132, 34], [128, 174, 58], 0.35 + n * 0.5);
      return { r: rgb[0], g: rgb[1], b: rgb[2], h: n * 0.35, rough: 0.42 + n * 0.18, ao: 0.82 };
    },
    { normalStrength: 2.2, wrapRepeat: false }
  );

  const topMat = new THREE.MeshPhysicalMaterial({
    name: 'cilantro-leaf-top',
    map: topTex.albedoMap,
    normalMap: topTex.normalMap,
    normalScale: new THREE.Vector2(1.0, 1.0),
    aoMap: topTex.ormMap,
    aoMapIntensity: 0.72,
    roughnessMap: topTex.ormMap,
    roughness: 1.0,
    emissive: new THREE.Color(0x0a2404),
    emissiveIntensity: 0.24,
    clearcoat: 0.42,
    clearcoatRoughness: 0.18,
    sheen: 0.42,
    sheenColor: new THREE.Color(0x98d840),
    wireframe: options.wireframe ?? false,
  });

  const underMat = new THREE.MeshPhysicalMaterial({
    name: 'cilantro-leaf-underside',
    map: underTex.albedoMap,
    normalMap: underTex.normalMap,
    roughnessMap: underTex.ormMap,
    roughness: 1.0,
    emissive: new THREE.Color(0x0f2b06),
    emissiveIntensity: 0.18,
    sheen: 0.48,
    sheenColor: new THREE.Color(0xb4e468),
    wireframe: options.wireframe ?? false,
  });

  const stemMat = new THREE.MeshPhysicalMaterial({
    name: 'cilantro-stem',
    color: new THREE.Color().setStyle('#58a422', THREE.SRGBColorSpace),
    roughness: 0.32,
    clearcoat: 0.35,
    sheen: 0.2,
    sheenColor: new THREE.Color(0x8cd048),
    wireframe: options.wireframe ?? false,
  });

  // 1. Slender branching stems
  const stemGeoms: THREE.BufferGeometry[] = [];
  stemGeoms.push(
    buildStemWithNode(
      [
        new THREE.Vector3(-0.005, -0.056, 0),
        new THREE.Vector3(-0.002, -0.020, 0.003),
        new THREE.Vector3(0.003, 0.018, 0.002),
        new THREE.Vector3(0.006, 0.044, -0.002),
      ],
      0.00145,
      0.00075,
      20,
      10
    )
  );
  const subBranches = [
    [new THREE.Vector3(-0.002, -0.022, 0.003), new THREE.Vector3(-0.022, -0.008, 0.008), new THREE.Vector3(-0.036, 0.006, 0.010)],
    [new THREE.Vector3(0.0, 0.0, 0.003), new THREE.Vector3(0.022, 0.012, 0.006), new THREE.Vector3(0.036, 0.024, 0.004)],
    [new THREE.Vector3(0.003, 0.022, 0.002), new THREE.Vector3(-0.018, 0.038, 0.005)],
    [new THREE.Vector3(-0.004, -0.044, 0.002), new THREE.Vector3(-0.014, -0.039, 0.008), new THREE.Vector3(-0.022, -0.034, 0.014)],
    [new THREE.Vector3(-0.001, -0.030, 0.003), new THREE.Vector3(0.014, -0.024, 0.008), new THREE.Vector3(0.026, -0.018, 0.012)],
  ];
  for (const pts of subBranches) {
    stemGeoms.push(buildStemWithNode(pts, 0.00105, 0.00062, 12, 8));
  }
  const mergedStems = mergeGeomsSafe(stemGeoms);
  for (const g of stemGeoms) g.dispose();

  // 2. 12 Lush Tri-Leaflet Fan Clusters (~29,000 tris) + Clear Water Drops matching Dewy Cilantro Sprig
  const leafletPlacements = [
    { pos: [-0.036, 0.006, 0.010], rot: [0.3, -1.2, -0.35], len: 0.036, wid: 0.035 },
    { pos: [-0.034, 0.004, 0.011], rot: [0.1, -2.0, -0.2], len: 0.032, wid: 0.030 },
    { pos: [-0.035, 0.005, 0.008], rot: [-0.25, -0.5, -0.2], len: 0.028, wid: 0.026 },
    { pos: [0.036, 0.024, 0.004], rot: [-0.2, 1.15, 0.3], len: 0.036, wid: 0.034 },
    { pos: [0.034, 0.022, 0.005], rot: [0.25, 1.9, 0.2], len: 0.030, wid: 0.028 },
    { pos: [0.035, 0.025, 0.002], rot: [-0.35, 0.5, 0.2], len: 0.028, wid: 0.026 },
    { pos: [-0.018, 0.038, 0.005], rot: [0.2, -0.75, -0.2], len: 0.033, wid: 0.031 },
    { pos: [0.006, 0.044, -0.002], rot: [-0.35, 0.15, 0.1], len: 0.036, wid: 0.034 },
    { pos: [0.004, 0.042, -0.001], rot: [-0.2, 0.95, 0.15], len: 0.030, wid: 0.028 },
    { pos: [-0.022, -0.034, 0.014], rot: [0.5, -1.5, -0.3], len: 0.032, wid: 0.030 },
    { pos: [0.026, -0.018, 0.012], rot: [-0.3, 1.4, 0.35], len: 0.034, wid: 0.032 },
    // Crisp loose floating leaflet
    { pos: [0.018, -0.046, -0.014], rot: [0.65, -0.45, 0.5], len: 0.025, wid: 0.023 },
  ];

  const topParts: THREE.BufferGeometry[] = [];
  const underParts: THREE.BufferGeometry[] = [];
  const dropParts: THREE.BufferGeometry[] = [];

  for (let i = 0; i < leafletPlacements.length; i++) {
    const lp = leafletPlacements[i];
    const blade = buildBotanicalThickLeaf({
      length: lp.len,
      width: lp.wid,
      thickness: lp.len * 0.024, // >= 2%
      segU: 30,
      segV: 18,
      serrationCount: 9,
      serrationDepth: 0.18,
      arch: 0.005,
      cupping: 0.0022,
      twist: (i % 2 === 0 ? 1 : -1) * 0.22,
      veinPairs: 5,
      puckerStrength: lp.wid * 0.042,
      lobeStyle: 'cilantro',
      seed: 400 + i * 17,
    });
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...lp.rot));
    const m4 = new THREE.Matrix4().compose(new THREE.Vector3(...lp.pos), q, new THREE.Vector3(1, 1, 1));
    blade.applyMatrix4(m4);
    const split = splitThickLeafGroups(blade);
    blade.dispose();
    topParts.push(split.top);
    underParts.push(split.bottom);

    for (let d = 0; d < 2; d++) {
      const wp = new THREE.Vector3((d === 0 ? 1 : -1) * lp.wid * 0.16, 0.0045, lp.len * (0.42 + d * 0.2)).applyMatrix4(m4);
      const dg = buildClearDropletGeometry(0.00095 + d * 0.0003, 12, 8);
      dg.translate(wp.x, wp.y, wp.z);
      dropParts.push(dg);
    }
  }

  const tM = mergeGeomsSafe(topParts);
  const uM = mergeGeomsSafe(underParts);
  const dM = mergeGeomsSafe(dropParts);
  for (const g of [...topParts, ...underParts, ...dropParts]) g.dispose();

  const stemMesh = new THREE.Mesh(mergedStems, stemMat);
  stemMesh.name = 'cilantro-stems';
  stemMesh.castShadow = options.castShadow ?? true;
  root.add(stemMesh);

  const topMesh = new THREE.Mesh(tM, topMat);
  topMesh.name = 'cilantro-lobes-top';
  topMesh.castShadow = options.castShadow ?? true;
  topMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(topMesh);

  const underMesh = new THREE.Mesh(uM, underMat);
  underMesh.name = 'cilantro-lobes-underside';
  underMesh.castShadow = options.castShadow ?? true;
  root.add(underMesh);

  root.add(new THREE.Mesh(dM, createDropletMaterial()));

  return root;
}

export default createCilantroSprigModel;
