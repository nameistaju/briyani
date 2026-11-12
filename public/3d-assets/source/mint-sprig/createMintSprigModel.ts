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

export function createMintSprigModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'mint-sprig';

  const texSize = options.textureSize ?? 1024;

  // Sampled palette from Glistening Fresh Mint Sprig.png:
  // deep emerald forest #171f00 / #205204 -> juicy mint green #437b01 -> vibrant chartreuse #7eb001 / #92c001
  const leafTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const distMid = Math.abs(u - 0.5) * 2;
      const midrib = Math.exp(-Math.pow(distMid * 15, 2));
      const latPhase = (v * 8.0 - distMid * 2.1) * Math.PI * 2;
      const latVein = Math.pow(Math.max(0, Math.cos(latPhase)), 8) * (1 - distMid * 0.38) * Math.sin(v * Math.PI);
      const cellQuilt = Math.sin(latPhase) * 0.5 + 0.5;
      const micro = fbm2(u * 34, v * 34, 4, 181);
      const edgeBright = smoothstep(0.68, 0.96, distMid) + smoothstep(0.78, 0.98, v);

      let rgb = mixRgb([12, 48, 2], [58, 122, 8], clamp(0.32 + cellQuilt * 0.42 + micro * 0.25, 0, 1));
      rgb = mixRgb(rgb, [118, 174, 18], clamp((midrib + latVein * 0.65) * 0.62 + edgeBright * 0.32, 0, 0.84));

      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: cellQuilt * 0.48 + micro * 0.22 - midrib * 0.28,
        rough: clamp(0.18 + (midrib + latVein) * 0.16 + (1 - cellQuilt) * 0.14, 0.12, 0.52),
        ao: clamp(0.66 + 0.34 * cellQuilt - (midrib + latVein * 0.5) * 0.12, 0.44, 1.0),
      };
    },
    { normalStrength: 4.0, wrapRepeat: false }
  );

  // Soft sage velvety underside material
  const underTex = buildPhotorealPbrTextures(
    512,
    (u, v) => {
      const distMid = Math.abs(u - 0.5) * 2;
      const midrib = Math.exp(-Math.pow(distMid * 14, 2));
      const fuzz = fbm2(u * 28, v * 28, 3, 245);
      let rgb = mixRgb([68, 114, 26], [126, 166, 56], 0.35 + fuzz * 0.5);
      rgb = mixRgb(rgb, [168, 198, 86], midrib * 0.72);
      return { r: rgb[0], g: rgb[1], b: rgb[2], h: midrib * 0.55 + fuzz * 0.25, rough: 0.48 + fuzz * 0.22, ao: 0.82 };
    },
    { normalStrength: 2.6, wrapRepeat: false }
  );

  const topMat = new THREE.MeshPhysicalMaterial({
    name: 'mint-sprig-top',
    map: leafTex.albedoMap,
    normalMap: leafTex.normalMap,
    normalScale: new THREE.Vector2(1.15, 1.15),
    aoMap: leafTex.ormMap,
    aoMapIntensity: 0.75,
    roughnessMap: leafTex.ormMap,
    roughness: 1.0,
    emissive: new THREE.Color(0x0b2602),
    emissiveIntensity: 0.24,
    clearcoat: 0.55,
    clearcoatRoughness: 0.14,
    sheen: 0.42,
    sheenColor: new THREE.Color(0x88cc26),
    wireframe: options.wireframe ?? false,
  });

  const underMat = new THREE.MeshPhysicalMaterial({
    name: 'mint-sprig-underside',
    map: underTex.albedoMap,
    normalMap: underTex.normalMap,
    roughnessMap: underTex.ormMap,
    roughness: 1.0,
    emissive: new THREE.Color(0x0d2904),
    emissiveIntensity: 0.18,
    sheen: 0.55,
    sheenColor: new THREE.Color(0xb6e062),
    wireframe: options.wireframe ?? false,
  });

  const budMat = new THREE.MeshPhysicalMaterial({
    name: 'mint-apical-bud',
    color: new THREE.Color(0x88b814),
    roughness: 0.34,
    emissive: new THREE.Color(0x163802),
    emissiveIntensity: 0.24,
    sheen: 0.48,
    sheenColor: new THREE.Color(0xcce856),
    clearcoat: 0.45,
    wireframe: options.wireframe ?? false,
  });

  const stemMat = new THREE.MeshPhysicalMaterial({
    name: 'mint-sprig-stem',
    color: new THREE.Color().setStyle('#4b731e', THREE.SRGBColorSpace),
    roughness: 0.38,
    clearcoat: 0.32,
    sheen: 0.2,
    sheenColor: new THREE.Color(0x7ca632),
    wireframe: options.wireframe ?? false,
  });

  // Sweeping horizontal arched square-ish mint stalk with subtle node bulges
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.064, -0.012, -0.004),
    new THREE.Vector3(-0.022, 0.002, 0.003),
    new THREE.Vector3(0.018, 0.008, 0.002),
    new THREE.Vector3(0.056, 0.004, -0.002),
  ]);
  const stemGeom = new THREE.TubeGeometry(stemCurve, 28, 0.0024, 12, false);
  const spAttr = stemGeom.attributes.position as THREE.BufferAttribute;
  const suAttr = stemGeom.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < spAttr.count; i++) {
    const u = suAttr.getX(i);
    const center = stemCurve.getPointAt(clamp(u, 0, 1));
    const nodeBulge =
      1 +
      0.24 * Math.exp(-Math.pow((u - 0.24) / 0.04, 2)) +
      0.22 * Math.exp(-Math.pow((u - 0.50) / 0.04, 2)) +
      0.18 * Math.exp(-Math.pow((u - 0.76) / 0.04, 2));
    const s = (1 - u * 0.56) * nodeBulge;
    spAttr.setXYZ(
      i,
      center.x + (spAttr.getX(i) - center.x) * s,
      center.y + (spAttr.getY(i) - center.y) * s,
      center.z + (spAttr.getZ(i) - center.z) * s
    );
  }
  spAttr.needsUpdate = true;
  stemGeom.computeVertexNormals();
  enableAoUv(stemGeom);

  const leavesConfig = [
    { pos: [-0.036, -0.004, 0.002], rot: [0.35, -0.75, -0.35], len: 0.058, wid: 0.037, bud: false },
    { pos: [-0.034, -0.004, 0.002], rot: [0.28, -2.35, 0.30], len: 0.056, wid: 0.036, bud: false },
    { pos: [-0.005, 0.006, 0.003], rot: [-0.32, 0.35, 0.22], len: 0.054, wid: 0.035, bud: false },
    { pos: [-0.003, 0.005, 0.003], rot: [0.38, 2.75, -0.22], len: 0.052, wid: 0.033, bud: false },
    { pos: [0.026, 0.008, 0.002], rot: [0.25, -0.65, -0.18], len: 0.044, wid: 0.028, bud: false },
    { pos: [0.028, 0.007, 0.002], rot: [0.22, 2.25, 0.18], len: 0.042, wid: 0.027, bud: false },
    { pos: [0.050, 0.005, -0.001], rot: [-0.20, 1.45, 0.08], len: 0.034, wid: 0.022, bud: false },
    { pos: [0.052, 0.005, -0.001], rot: [0.15, 0.75, -0.12], len: 0.030, wid: 0.019, bud: false },
    // Tender young yellow-green apical tip crown leaves (zero black spheres!)
    { pos: [0.056, 0.004, -0.002], rot: [-0.15, 1.55, 0.25], len: 0.019, wid: 0.012, bud: true },
    { pos: [0.056, 0.004, -0.002], rot: [0.20, 1.45, -0.25], len: 0.017, wid: 0.011, bud: true },
  ];

  const topParts: THREE.BufferGeometry[] = [];
  const underParts: THREE.BufferGeometry[] = [];
  const budParts: THREE.BufferGeometry[] = [];
  const dropParts: THREE.BufferGeometry[] = [];

  for (let i = 0; i < leavesConfig.length; i++) {
    const lc = leavesConfig[i];
    const blade = buildBotanicalThickLeaf({
      length: lc.len,
      width: lc.wid,
      thickness: Math.max(0.0008, lc.len * 0.022), // >= 2% thickness
      segU: 32,
      segV: 18,
      serrationCount: 11,
      serrationDepth: 0.12,
      arch: lc.bud ? 0.004 : 0.011,
      cupping: 0.0034,
      twist: (i % 2 === 0 ? 1 : -1) * 0.2,
      veinPairs: 6,
      puckerStrength: lc.wid * 0.055,
      lobeStyle: 'mint',
      seed: 600 + i * 23,
    });
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...lc.rot));
    const m4 = new THREE.Matrix4().compose(new THREE.Vector3(...lc.pos), q, new THREE.Vector3(1, 1, 1));
    blade.applyMatrix4(m4);

    if (lc.bud) {
      budParts.push(blade);
    } else {
      const split = splitThickLeafGroups(blade);
      blade.dispose();
      topParts.push(split.top);
      underParts.push(split.bottom);

      for (let d = 0; d < 3; d++) {
        const wp = new THREE.Vector3((d % 2 === 0 ? 1 : -1) * lc.wid * 0.16, 0.007, lc.len * (0.28 + d * 0.18)).applyMatrix4(m4);
        const dg = buildClearDropletGeometry(0.00105 + d * 0.00025, 14, 10);
        dg.translate(wp.x, wp.y, wp.z);
        dropParts.push(dg);
      }
    }
  }

  const tM = mergeGeomsSafe(topParts);
  const uM = mergeGeomsSafe(underParts);
  const bM = mergeGeomsSafe(budParts);
  const dM = mergeGeomsSafe(dropParts);
  for (const g of [...topParts, ...underParts, ...budParts, ...dropParts]) g.dispose();

  const stemMesh = new THREE.Mesh(stemGeom, stemMat);
  stemMesh.name = 'mint-sprig-stem';
  stemMesh.castShadow = options.castShadow ?? true;
  root.add(stemMesh);

  const topMesh = new THREE.Mesh(tM, topMat);
  topMesh.name = 'mint-sprig-top';
  topMesh.castShadow = options.castShadow ?? true;
  topMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(topMesh);

  const underMesh = new THREE.Mesh(uM, underMat);
  underMesh.name = 'mint-sprig-underside';
  underMesh.castShadow = options.castShadow ?? true;
  root.add(underMesh);

  const budMesh = new THREE.Mesh(bM, budMat);
  budMesh.name = 'mint-apical-bud';
  root.add(budMesh);

  root.add(new THREE.Mesh(dM, createDropletMaterial()));

  root.rotation.set(0.45, 0.12, 0.10);

  return root;
}

export default createMintSprigModel;
