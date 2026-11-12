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
  mix,
  mixRgb,
  PhotorealOptions,
  smoothstep,
} from '../../../../tools/shared/photoreal3d';

export function createMintLeavesModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'mint-leaves';

  const texSize = options.textureSize ?? 2048;

  // Sampled palette from Dewy Mint Leaves in Motion.png:
  // deep chlorophyl crease #2a6201 -> vivid leaf emerald #549502 -> lime yellow-green rim/vein #87bd03 / #89c819
  const leafTopTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const distMid = Math.abs(u - 0.5) * 2;
      const midrib = Math.exp(-Math.pow(distMid * 15, 2)) * (1 - 0.25 * v);
      // 6 arcuate pinnate lateral veins curving toward apex
      const latPhase = (v * 6.5 - distMid * 0.55) * Math.PI * 2;
      const latVein = Math.pow(Math.max(0, Math.cos(latPhase)), 10) * smoothstep(0.05, 0.16, distMid) * (1 - distMid * 0.25) * Math.sin(v * Math.PI);
      const reticulate = fbm2(u * 48, v * 58, 4, 212);
      const intervein = Math.sin(latPhase) * 0.5 + 0.5;

      const deepGreen: [number, number, number] = [34, 88, 6];
      const emeraldGreen: [number, number, number] = [78, 148, 10];
      const limeHighlight: [number, number, number] = [144, 198, 28];

      let rgb = mixRgb(deepGreen, emeraldGreen, clamp(0.32 + intervein * 0.45 + reticulate * 0.28, 0, 1));
      // Bright fresh yellow-green glow at margins, veins & young tips
      const veinMask = clamp(midrib * 0.72 + latVein * 0.68, 0, 1);
      rgb = mixRgb(rgb, limeHighlight, clamp(veinMask * 0.75 + Math.pow(distMid, 2.2) * 0.32 + v * 0.15, 0, 0.85));

      const h = (1 - midrib) * 0.35 + intervein * 0.42 + reticulate * 0.22 - latVein * 0.24;
      const rough = clamp(0.22 + (1 - intervein) * 0.14 + veinMask * 0.18 + reticulate * 0.08, 0.18, 0.56);
      const ao = clamp(0.72 + 0.28 * intervein - midrib * 0.16, 0.55, 1.0);

      return { r: rgb[0], g: rgb[1], b: rgb[2], h, rough, ao };
    },
    { normalStrength: 3.4, wrapRepeat: false }
  );

  // Paler matte botanical underside + prominent creamy-green veins (no duplicate flat look)
  const leafBackTex = buildPhotorealPbrTextures(
    Math.min(1024, texSize),
    (u, v) => {
      const distMid = Math.abs(u - 0.5) * 2;
      const midrib = Math.exp(-Math.pow(distMid * 13, 2));
      const latPhase = (v * 6.5 - distMid * 0.55) * Math.PI * 2;
      const latVein = Math.pow(Math.max(0, Math.cos(latPhase)), 9) * smoothstep(0.05, 0.18, distMid);
      const cell = fbm2(u * 40, v * 48, 3, 419);

      let rgb = mixRgb([86, 134, 42], [138, 178, 74], clamp(cell * 0.5 + (midrib + latVein * 0.7) * 0.65, 0, 1));
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: (midrib + latVein * 0.7) * 0.6 + cell * 0.2,
        rough: clamp(0.48 + cell * 0.2, 0.4, 0.74),
        ao: clamp(0.82 + 0.18 * cell, 0.65, 1.0),
      };
    },
    { normalStrength: 2.8, wrapRepeat: false }
  );

  const leafTopMat = new THREE.MeshPhysicalMaterial({
    name: 'mint-leaf-top-cuticle',
    map: leafTopTex.albedoMap,
    normalMap: leafTopTex.normalMap,
    normalScale: new THREE.Vector2(1.15, 1.15),
    aoMap: leafTopTex.ormMap,
    aoMapIntensity: 0.72,
    roughnessMap: leafTopTex.ormMap,
    roughness: 1.0,
    metalness: 0.0,
    emissive: new THREE.Color(0x0c2402),
    emissiveIntensity: 0.14,
    sheen: 0.58,
    sheenRoughness: 0.42,
    sheenColor: new THREE.Color(0x9ee240),
    clearcoat: 0.24,
    clearcoatRoughness: 0.22,
    envMapIntensity: 1.1,
    wireframe: options.wireframe ?? false,
  });

  const leafBackMat = new THREE.MeshPhysicalMaterial({
    name: 'mint-leaf-underside',
    map: leafBackTex.albedoMap,
    normalMap: leafBackTex.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    aoMap: leafBackTex.ormMap,
    aoMapIntensity: 0.65,
    roughnessMap: leafBackTex.ormMap,
    roughness: 1.0,
    metalness: 0.0,
    sheen: 0.4,
    sheenColor: new THREE.Color(0xaed86c),
    envMapIntensity: 0.95,
    wireframe: options.wireframe ?? false,
  });

  const stemMat = new THREE.MeshPhysicalMaterial({
    name: 'mint-herb-stem',
    color: new THREE.Color(0x649e26),
    roughness: 0.46,
    sheen: 0.3,
    sheenColor: new THREE.Color(0x9bd654),
    wireframe: options.wireframe ?? false,
  });

  // 1. Sculpted Square-Ribbed Tapered Mint Stem (with swollen opposite-node joints, ZERO black bud!)
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.002, -0.024, -0.004),
    new THREE.Vector3(0.0, -0.006, 0.002),
    new THREE.Vector3(-0.002, 0.011, 0.001),
    new THREE.Vector3(-0.001, 0.025, 0.0),
  ]);
  const stemGeom = new THREE.TubeGeometry(stemCurve, 32, 0.0024, 14, false);
  const sPos = stemGeom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < sPos.count; i++) {
    const x = sPos.getX(i);
    const y = sPos.getY(i);
    const z = sPos.getZ(i);
    const frac = clamp((y + 0.024) / 0.049, 0, 1);
    const pt = stemCurve.getPointAt(frac);
    const dx = x - pt.x;
    const dz = z - pt.z;
    const taper = mix(1.05, 0.48, frac);
    // Node rings at frac 0.25, 0.56, 0.85
    const nodeBulge =
      1 +
      0.32 * Math.exp(-Math.pow((frac - 0.25) / 0.055, 2)) +
      0.28 * Math.exp(-Math.pow((frac - 0.56) / 0.05, 2)) +
      0.22 * Math.exp(-Math.pow((frac - 0.85) / 0.05, 2));
    sPos.setXYZ(i, pt.x + dx * taper * nodeBulge, y, pt.z + dz * taper * nodeBulge);
  }
  sPos.needsUpdate = true;
  stemGeom.computeVertexNormals();
  const stemMesh = new THREE.Mesh(stemGeom, stemMat);
  stemMesh.name = 'mint-stem';
  stemMesh.castShadow = options.castShadow ?? true;
  root.add(stemMesh);

  // 2. Opposite-Paired Phyllotaxy Leaves (3 opposite node pairs + fresh lime-green nested apical leaf bud!)
  const leafTopParts: THREE.BufferGeometry[] = [];
  const leafBackParts: THREE.BufferGeometry[] = [];
  const dropletPlacements: { pos: THREE.Vector3; radius: number }[] = [];

  const segU = options.highPoly === false ? 24 : 38;
  const segV = options.highPoly === false ? 18 : 28;

  type LeafPose = { len: number; wid: number; yaw: number; pitch: number; roll: number; y: number; arch: number; cup: number; twist: number; seed: number };
  const poses: LeafPose[] = [
    // Asymmetric natural botanical mint crown (sweeping outward & gentle arc, zero rigid + cross)
    { len: 0.060, wid: 0.036, yaw: -0.15, pitch: -0.14, roll: 0.22, y: -0.008, arch: 0.012, cup: 0.0045, twist: 0.16, seed: 11 },
    { len: 0.056, wid: 0.034, yaw: 2.82, pitch: -0.18, roll: -0.16, y: -0.007, arch: 0.011, cup: 0.0042, twist: -0.14, seed: 22 },
    { len: 0.050, wid: 0.030, yaw: 1.38, pitch: 0.24, roll: 0.14, y: 0.007, arch: 0.009, cup: 0.0038, twist: 0.12, seed: 33 },
    { len: 0.047, wid: 0.029, yaw: -1.78, pitch: 0.28, roll: -0.14, y: 0.009, arch: 0.009, cup: 0.0036, twist: -0.12, seed: 44 },
    { len: 0.036, wid: 0.022, yaw: 0.58, pitch: 0.56, roll: 0.10, y: 0.018, arch: 0.006, cup: 0.003, twist: 0.08, seed: 55 },
    { len: 0.033, wid: 0.020, yaw: 3.55, pitch: 0.62, roll: -0.09, y: 0.0195, arch: 0.0055, cup: 0.0028, twist: -0.08, seed: 66 },
    { len: 0.022, wid: 0.013, yaw: -0.45, pitch: 0.96, roll: 0.06, y: 0.024, arch: 0.003, cup: 0.0022, twist: 0.05, seed: 77 },
    { len: 0.019, wid: 0.0115, yaw: 1.75, pitch: 1.04, roll: -0.06, y: 0.0245, arch: 0.0028, cup: 0.002, twist: -0.05, seed: 88 },
    { len: 0.014, wid: 0.0085, yaw: 3.45, pitch: 1.22, roll: 0.04, y: 0.0255, arch: 0.0018, cup: 0.0015, twist: 0.04, seed: 99 },
  ];

  const detachedPoses = [
    { len: 0.026, wid: 0.015, pos: new THREE.Vector3(-0.042, 0.026, 0.018), euler: new THREE.Euler(0.4, 0.9, 0.7), seed: 121 },
    { len: 0.023, wid: 0.0135, pos: new THREE.Vector3(0.038, -0.018, -0.022), euler: new THREE.Euler(-0.35, -0.7, -0.5), seed: 131 },
    { len: 0.020, wid: 0.012, pos: new THREE.Vector3(0.012, -0.032, 0.036), euler: new THREE.Euler(0.55, 1.8, 0.3), seed: 141 },
  ];

  for (let i = 0; i < poses.length; i++) {
    const lp = poses[i];
    const g = buildBotanicalThickLeaf({
      length: lp.len,
      width: lp.wid,
      thickness: Math.max(lp.len * 0.028, 0.001),
      segU: segU,
      segV: segV,
      serrationCount: i >= 6 ? 9 : 15,
      serrationDepth: 0.11,
      arch: lp.arch,
      cupping: lp.cup,
      twist: lp.twist,
      veinPairs: i >= 6 ? 4 : 6,
      puckerStrength: lp.wid * 0.038,
      lobeStyle: 'mint',
      seed: lp.seed,
    });

    const euler = new THREE.Euler(-lp.pitch, lp.yaw, lp.roll, 'YXZ');
    const q = new THREE.Quaternion().setFromEuler(euler);
    const mat4 = new THREE.Matrix4().compose(new THREE.Vector3(-0.001, lp.y, 0.0005), q, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(mat4);

    // Split top group (0) & back/rim group (1) into clean separate non-indexed meshes for crisp GLB multi-material export
    const nonIdx = g.toNonIndexed();
    const g0 = g.groups[0];
    const g1 = g.groups[1];
    const sliceGeom = (start: number, count: number) => {
      const sub = new THREE.BufferGeometry();
      for (const k of Object.keys(nonIdx.attributes)) {
        const attr = nonIdx.attributes[k] as THREE.BufferAttribute;
        const item = attr.itemSize;
        sub.setAttribute(k, new THREE.BufferAttribute(attr.array.slice(start * item, (start + count) * item), item));
      }
      return sub;
    };
    leafTopParts.push(sliceGeom(g0.start, g0.count));
    leafBackParts.push(sliceGeom(g1.start, g1.count));

    // Place crystal-clear water droplets sitting flush on leaves 0..5 (resting on +Y leaf cuticle, arching smoothly)
    if (i < 6) {
      const dropSurfY = Math.sin(0.45 * Math.PI * 0.92) * lp.arch + 0.001;
      const dLocal1 = new THREE.Vector3(lp.wid * 0.14, dropSurfY, lp.len * 0.45).applyMatrix4(mat4);
      dropletPlacements.push({ pos: dLocal1, radius: i < 2 ? 0.0024 : 0.0017 });
      if (i % 2 === 0) {
        const dTip = new THREE.Vector3(0, lp.arch * 0.1, lp.len * 0.95).applyMatrix4(mat4);
        dropletPlacements.push({ pos: dTip, radius: 0.0018 });
      }
    }

    nonIdx.dispose();
    g.dispose();
  }

  for (const dp of detachedPoses) {
    const g = buildBotanicalThickLeaf({
      length: dp.len,
      width: dp.wid,
      thickness: Math.max(dp.len * 0.028, 0.0008),
      segU: 22,
      segV: 16,
      serrationCount: 11,
      serrationDepth: 0.1,
      arch: dp.len * 0.18,
      cupping: dp.wid * 0.12,
      twist: 0.12,
      veinPairs: 5,
      puckerStrength: dp.wid * 0.032,
      lobeStyle: 'mint',
      seed: dp.seed,
    });
    const m4 = new THREE.Matrix4().compose(dp.pos, new THREE.Quaternion().setFromEuler(dp.euler), new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m4);
    const nonIdx = g.toNonIndexed();
    const g0 = g.groups[0];
    const g1 = g.groups[1];
    const sliceGeom = (start: number, count: number) => {
      const sub = new THREE.BufferGeometry();
      for (const k of Object.keys(nonIdx.attributes)) {
        const attr = nonIdx.attributes[k] as THREE.BufferAttribute;
        sub.setAttribute(k, new THREE.BufferAttribute(attr.array.slice(start * attr.itemSize, (start + count) * attr.itemSize), attr.itemSize));
      }
      return sub;
    };
    leafTopParts.push(sliceGeom(g0.start, g0.count));
    leafBackParts.push(sliceGeom(g1.start, g1.count));
    nonIdx.dispose();
    g.dispose();
  }
  // Floating dew mist droplets
  dropletPlacements.push(
    { pos: new THREE.Vector3(0.034, 0.036, 0.015), radius: 0.0021 },
    { pos: new THREE.Vector3(-0.028, 0.038, -0.022), radius: 0.0018 },
    { pos: new THREE.Vector3(0.025, -0.024, 0.028), radius: 0.0017 }
  );

  const topMerged = mergeGeomsSafe(leafTopParts);
  const backMerged = mergeGeomsSafe(leafBackParts);
  for (const x of [...leafTopParts, ...leafBackParts]) x.dispose();
  enableAoUv(topMerged);
  enableAoUv(backMerged);

  const topMesh = new THREE.Mesh(topMerged, leafTopMat);
  topMesh.name = 'mint-leaves-cuticle-top';
  topMesh.castShadow = options.castShadow ?? true;
  topMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(topMesh);

  const backMesh = new THREE.Mesh(backMerged, leafBackMat);
  backMesh.name = 'mint-leaves-underside';
  backMesh.castShadow = options.castShadow ?? true;
  backMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(backMesh);

  // 3. Crystal-Clear Physical Refractive Water Droplets (NO opaque grey balls!)
  const dropParts = dropletPlacements.map((d) => {
    const dg = buildClearDropletGeometry(d.radius, 18, 12);
    dg.translate(d.pos.x, d.pos.y, d.pos.z);
    return dg;
  });
  const dropMerged = mergeGeomsSafe(dropParts);
  for (const x of dropParts) x.dispose();
  const dropMesh = new THREE.Mesh(dropMerged, createDropletMaterial());
  dropMesh.name = 'mint-dew-droplets';
  root.add(dropMesh);

  return root;
}

export default createMintLeavesModel;
