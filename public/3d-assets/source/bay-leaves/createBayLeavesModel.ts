import * as THREE from 'three';
import {
  buildBotanicalThickLeaf,
  buildPhotorealPbrTextures,
  clamp,
  displaceLayered3D,
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

export function createBayLeavesModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'bay-leaves';

  const texSize = options.textureSize ?? 1024;

  // Sampled palette: dark dried olive #594906 -> spiced khaki #825c02 / #9b700e -> golden vein #c9a03b
  const topTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const distMid = Math.abs(u - 0.5) * 2;
      const midrib = Math.exp(-Math.pow(distMid * 18, 2));
      const latPhase = (v * 9.5 - distMid * 2.2) * Math.PI * 2;
      const latVein = Math.pow(Math.max(0, Math.cos(latPhase)), 12) * smoothstep(0.95, 0.25, distMid) * Math.sin(v * Math.PI);
      const vein = clamp(midrib * 1.1 + latVein * 0.72, 0, 1);

      const mottle = fbm2(u * 14, v * 18, 4, 47);
      const fine = fbm2(u * 48, v * 48, 3, 108);
      const edgeDry = smoothstep(0.65, 0.96, distMid);

      let rgb = mixRgb([86, 72, 10], [154, 114, 16], clamp(0.28 + mottle * 0.55 - fine * 0.14, 0, 1));
      rgb = mixRgb(rgb, [118, 82, 14], edgeDry * 0.45);
      rgb = mixRgb(rgb, [212, 172, 68], vein * 0.85);

      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: vein * 0.45 + mottle * 0.35 + fine * 0.15,
        rough: clamp(0.54 + (1 - vein) * 0.22 + edgeDry * 0.12, 0.44, 0.88),
        ao: clamp(0.68 + 0.32 * vein, 0.5, 1.0),
      };
    },
    { normalStrength: 3.6, wrapRepeat: false }
  );

  // Paler dusty sage underside characteristic of dried bay leaves
  const underTex = buildPhotorealPbrTextures(
    512,
    (u, v) => {
      const distMid = Math.abs(u - 0.5) * 2;
      const midrib = Math.exp(-Math.pow(distMid * 15, 2));
      const n = fbm2(u * 14, v * 16, 3, 61);
      let rgb = mixRgb([124, 112, 46], [176, 152, 72], 0.35 + 0.55 * n);
      rgb = mixRgb(rgb, [216, 184, 92], midrib * 0.78);
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: midrib * 0.55 + n * 0.3,
        rough: clamp(0.62 + n * 0.2, 0.52, 0.88),
        ao: 0.78,
      };
    },
    { normalStrength: 2.8, wrapRepeat: false }
  );

  const topMat = new THREE.MeshPhysicalMaterial({
    name: 'dried-bay-leaf-top',
    map: topTex.albedoMap,
    normalMap: topTex.normalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    aoMap: topTex.ormMap,
    aoMapIntensity: 0.75,
    roughnessMap: topTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.14,
    clearcoatRoughness: 0.48,
    sheen: 0.22,
    sheenColor: new THREE.Color(0xc9a03b),
    wireframe: options.wireframe ?? false,
  });

  const underMat = new THREE.MeshPhysicalMaterial({
    name: 'dried-bay-leaf-underside',
    map: underTex.albedoMap,
    normalMap: underTex.normalMap,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: underTex.ormMap,
    roughness: 1.0,
    sheen: 0.32,
    sheenColor: new THREE.Color(0xdcc26c),
    wireframe: options.wireframe ?? false,
  });

  // 3 Sculpted Crossing Dried Bay Leaves (~13,500 tris, >=2% leaf thickness!)
  const specs = [
    { pos: [-0.036, -0.008, 0.008], rot: [0.30, 1.05, -0.22], len: 0.095, wid: 0.036, arch: 0.012, cup: 0.0045, twist: 0.34, seed: 10 },
    { pos: [0.034, 0.008, -0.008], rot: [-0.32, -1.92, 0.24], len: 0.088, wid: 0.033, arch: -0.010, cup: 0.0040, twist: -0.28, seed: 25 },
    { pos: [0.004, -0.018, -0.024], rot: [0.65, 0.25, 0.15], len: 0.074, wid: 0.027, arch: 0.009, cup: 0.0036, twist: 0.22, seed: 40 },
  ];

  const topParts: THREE.BufferGeometry[] = [];
  const underParts: THREE.BufferGeometry[] = [];

  for (const sp of specs) {
    const blade = buildBotanicalThickLeaf({
      length: sp.len,
      width: sp.wid,
      thickness: sp.len * 0.022, // >=2% true thickness
      segU: 44,
      segV: 22,
      serrationCount: 0,
      serrationDepth: 0,
      arch: sp.arch,
      cupping: sp.cup,
      twist: sp.twist,
      veinPairs: 8,
      puckerStrength: sp.wid * 0.045,
      lobeStyle: 'bay',
      seed: sp.seed,
    });
    const m4 = new THREE.Matrix4().compose(
      new THREE.Vector3(...sp.pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...sp.rot)),
      new THREE.Vector3(1, 1, 1)
    );
    blade.applyMatrix4(m4);
    const split = splitThickLeafGroups(blade);
    blade.dispose();
    topParts.push(split.top);
    underParts.push(split.bottom);

    // Tapered woody petiole stem at base of leaf
    const stem = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, -0.014),
        new THREE.Vector3(0, 0.0006, 0.002),
        new THREE.Vector3(0, 0.0018, sp.len * 0.22),
      ]),
      14,
      0.0013,
      10,
      false
    );
    displaceLayered3D(stem, { lowFreq: 90, lowAmp: 0.00018, seed: sp.seed + 5 });
    stem.applyMatrix4(m4);
    underParts.push(stem);
  }

  const tMerged = mergeGeomsSafe(topParts);
  const uMerged = mergeGeomsSafe(underParts);
  for (const g of [...topParts, ...underParts]) g.dispose();

  const topMesh = new THREE.Mesh(tMerged, topMat);
  topMesh.name = 'bay-leaves-top';
  topMesh.castShadow = options.castShadow ?? true;
  topMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(topMesh);

  const underMesh = new THREE.Mesh(uMerged, underMat);
  underMesh.name = 'bay-leaves-underside';
  underMesh.castShadow = options.castShadow ?? true;
  underMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(underMesh);

  return root;
}

export default createBayLeavesModel;
