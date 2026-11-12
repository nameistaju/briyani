import * as THREE from 'three';
import {
  bakeInstanceTransforms,
  buildBotanicalThickLeaf,
  buildCrispCrinkledOnionStrip,
  buildCurvedBasmatiGrain,
  buildPhotorealPbrTextures,
  clamp,
  createSeededRng,
  enableAoUv,
  fbm2,
  mergeGeomsSafe,
  mixRgb,
  smoothstep,
  worley2,
} from '../../../../tools/shared/photoreal3d';

export interface PhotorealOptions {
  textureSize?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  wireframe?: boolean;
}

/**
 * Self-contained lightweight (~36,000 tris, <400 KB opt GLB) photoreal composite of the
 * DUMBAAZ Steaming Biryani Handi: hammered copper lagan + saffron-stained basmati rice mound +
 * caramelized masala drumstick + birista onions + mint crown + translucent curling steam plumes.
 */
export function createSteamingBiryaniHandiModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'steaming-biryani-handi';

  const rng = createSeededRng(70701);
  const texSize = options.textureSize ?? 512;

  // 1. Hammered Copper Vessel Exterior & Warm Tinned/Brass Inner Lip (~13,500 tris)
  const copperTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const ang = u * Math.PI * 2;
      const hx = Math.cos(ang) * 5.2;
      const hz = Math.sin(ang) * 5.2;
      const w = worley2(u * 26, v * 14, 19).f1;
      const facet = smoothstep(0.62, 0.12, w);
      const patina = fbm2(hx * 0.6, hz * 0.6 + v * 4, 3, 44);
      const soot = smoothstep(0.28, 0.02, v) * 0.55;
      let rgb = mixRgb([128, 40, 8], [228, 108, 42], clamp(0.28 + facet * 0.55 + patina * 0.25, 0, 1));
      rgb = mixRgb(rgb, [54, 16, 4], clamp(soot, 0, 0.85));
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: facet * 0.6 + patina * 0.25,
        rough: clamp(0.18 + (1 - facet) * 0.22 + soot * 0.3, 0.14, 0.66),
        ao: clamp(0.62 + 0.38 * facet, 0.4, 1.0),
        metal: clamp(0.95 - soot * 0.45, 0.4, 1.0),
      };
    },
    { normalStrength: 3.4 }
  );

  const copperMat = new THREE.MeshPhysicalMaterial({
    name: 'steaming-handi-copper',
    map: copperTex.albedoMap,
    normalMap: copperTex.normalMap,
    normalScale: new THREE.Vector2(1.0, 1.0),
    aoMap: copperTex.ormMap,
    roughnessMap: copperTex.ormMap,
    metalnessMap: copperTex.ormMap,
    roughness: 1.0,
    metalness: 1.0,
    clearcoat: 0.22,
    wireframe: options.wireframe ?? false,
  });

  const innerGoldMat = new THREE.MeshStandardMaterial({
    name: 'handi-inner-brass',
    color: new THREE.Color(0xc99c52),
    roughness: 0.34,
    metalness: 0.88,
    wireframe: options.wireframe ?? false,
  });

  // Closed outer & inner vessel lathe profiles with closed solid base floor + true dimpled hammer relief
  const segR = 72;
  const segY = 32;
  const profile: [number, number][] = [
    [0.0, 0.0],
    [0.056, 0.001],
  ];
  for (let iy = 1; iy <= segY - 2; iy++) {
    const f = iy / (segY - 2);
    let r: number;
    let y: number;
    if (f < 0.58) {
      const k = f / 0.58;
      y = k * 0.105;
      r = 0.055 + 0.088 * Math.sin(Math.pow(k, 0.72) * Math.PI * 0.56);
    } else if (f < 0.82) {
      const k = (f - 0.58) / 0.24;
      y = 0.105 + k * 0.040;
      r = 0.143 - k * 0.042;
    } else {
      const k = (f - 0.82) / 0.18;
      y = 0.145 + k * 0.018;
      r = 0.101 + Math.sin(k * Math.PI * 0.72) * 0.022;
    }
    profile.push([r, y]);
  }
  const actualRows = profile.length - 1;

  const outV: number[] = [];
  const outUv: number[] = [];
  const outI: number[] = [];
  const cols = segR + 1;
  for (let iy = 0; iy <= actualRows; iy++) {
    const vf = iy / actualRows;
    const [pr, py] = profile[iy];
    for (let ir = 0; ir <= segR; ir++) {
      const uf = ir / segR;
      const a = uf * Math.PI * 2;
      const hBump = vf < 0.80 && vf > 0.12 ? (worley2(uf * 26, vf * 14, 19).f1 - 0.35) * 0.0026 : 0;
      const rr = pr === 0 ? 0 : Math.max(0.002, pr - hBump);
      outV.push(Math.cos(a) * rr, py, Math.sin(a) * rr);
      outUv.push(uf, vf);
    }
  }
  for (let iy = 0; iy < actualRows; iy++) {
    for (let ir = 0; ir < segR; ir++) {
      const a = iy * cols + ir;
      const b = (iy + 1) * cols + ir;
      const c = (iy + 1) * cols + (ir + 1);
      const d = iy * cols + (ir + 1);
      outI.push(a, b, d, b, c, d);
    }
  }
  const outerGeom = new THREE.BufferGeometry();
  outerGeom.setAttribute('position', new THREE.Float32BufferAttribute(outV, 3));
  outerGeom.setAttribute('uv', new THREE.Float32BufferAttribute(outUv, 2));
  outerGeom.setIndex(outI);
  outerGeom.computeVertexNormals();
  enableAoUv(outerGeom);

  const innerPts = profile.slice(0, -1).map(([r, y]) => new THREE.Vector2(Math.max(0.001, r - 0.004), y + 0.004)).reverse();
  const innerGeom = new THREE.LatheGeometry(innerPts, segR);
  enableAoUv(innerGeom);

  const outerMesh = new THREE.Mesh(outerGeom, copperMat);
  outerMesh.name = 'steaming-handi-vessel';
  outerMesh.castShadow = options.castShadow ?? true;
  outerMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(outerMesh);
  root.add(new THREE.Mesh(innerGeom, innerGoldMat));

  // 2. Sculpted Biryani Rice Mound + 580 Plump Surface Grains (~10,000 tris total)
  const riceTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const patch = fbm2(u * 10, v * 10, 3, 21);
      const rgb = mixRgb([242, 224, 194], [248, 168, 22], smoothstep(0.32, 0.78, patch));
      return { r: rgb[0], g: rgb[1], b: rgb[2], h: patch * 0.4, rough: 0.24 + (1 - patch) * 0.16, ao: 0.78 };
    },
    { normalStrength: 2.2 }
  );
  const moundMat = new THREE.MeshPhysicalMaterial({
    name: 'biryani-rice-bed',
    map: riceTex.albedoMap,
    normalMap: riceTex.normalMap,
    roughnessMap: riceTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.35,
    vertexColors: true,
    wireframe: options.wireframe ?? false,
  });

  const domeGeom = new THREE.SphereGeometry(0.106, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
  domeGeom.scale(1.0, 0.62, 1.0);
  domeGeom.translate(0, 0.132, 0);

  const grainProto = buildCurvedBasmatiGrain(0.0155, 0.00175, 0.0017, 6, 4);
  const grainTransforms: { pos: THREE.Vector3; quat: THREE.Quaternion; scale: THREE.Vector3; color: THREE.Color }[] = [];
  const ivory = new THREE.Color(0xf6efe4);
  const saffron = new THREE.Color(0xf2a30a);
  const turmeric = new THREE.Color(0xdf8204);
  for (let i = 0; i < 720; i++) {
    const phi = rng() * Math.PI * 2;
    const rad = Math.pow(rng(), 0.52) * 0.098;
    const domeY = 0.132 + Math.sqrt(Math.max(0, 1 - (rad / 0.106) * (rad / 0.106))) * 0.106 * 0.62 + 0.001;
    const pos = new THREE.Vector3(Math.cos(phi) * rad, domeY, Math.sin(phi) * rad);
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rng() * 3, rng() * 6, rng() * 3));
    const sc = 0.92 + rng() * 0.32;
    const r = rng();
    const color = r < 0.38 ? ivory : r < 0.72 ? saffron : turmeric;
    grainTransforms.push({ pos, quat, scale: new THREE.Vector3(sc, sc, sc), color });
  }
  const bakedGrains = bakeInstanceTransforms(grainProto, grainTransforms);
  grainProto.dispose();

  // Set white vertex colors on dome so mergeGeomsSafe preserves color attr
  const dCol = new Float32Array(domeGeom.attributes.position.count * 3).fill(1);
  domeGeom.setAttribute('color', new THREE.BufferAttribute(dCol, 3));
  const mergedRice = mergeGeomsSafe([domeGeom, bakedGrains]);
  domeGeom.dispose();
  bakedGrains.dispose();
  enableAoUv(mergedRice);
  const riceMesh = new THREE.Mesh(mergedRice, moundMat);
  riceMesh.name = 'steaming-biryani-rice';
  riceMesh.castShadow = true;
  riceMesh.receiveShadow = true;
  root.add(riceMesh);

  // 3. Crispy Blistered Masala Drumstick Crowned Atop Rice with visible bone condyle (~3,600 tris)
  const legMat = new THREE.MeshPhysicalMaterial({
    name: 'handi-drumstick-glaze',
    color: new THREE.Color(0xc24408),
    roughness: 0.36,
    clearcoat: 0.5,
    clearcoatRoughness: 0.15,
  });
  const boneMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0xe8d0aa), roughness: 0.42 });
  const legGeom = new THREE.SphereGeometry(1, 36, 26);
  const lPos = legGeom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < lPos.count; i++) {
    const ux = lPos.getX(i), uy = lPos.getY(i), uz = lPos.getZ(i);
    const tf = (uy + 1) * 0.5;
    const rr = 0.0075 + 0.024 * Math.pow(Math.sin(tf * Math.PI), 0.72) * (0.48 + 0.8 * Math.pow(tf, 0.65));
    const crisp = 1 + 0.08 * Math.sin(ux * 14 + uy * 18) * Math.cos(uz * 14);
    lPos.setXYZ(i, ux * rr * crisp, (tf - 0.38) * 0.102, uz * rr * crisp);
  }
  legGeom.computeVertexNormals();
  const boneShaft = new THREE.CylinderGeometry(0.0052, 0.0042, 0.036, 12);
  boneShaft.translate(0, -0.048, 0);
  const boneKnob1 = new THREE.SphereGeometry(0.0065, 10, 8);
  boneKnob1.translate(-0.003, -0.066, 0.001);
  const boneKnob2 = new THREE.SphereGeometry(0.0062, 10, 8);
  boneKnob2.translate(0.003, -0.066, -0.001);
  const legGroup = new THREE.Group();
  legGroup.name = 'crowned-drumstick';
  legGroup.add(new THREE.Mesh(legGeom, legMat), new THREE.Mesh(boneShaft, boneMat), new THREE.Mesh(boneKnob1, boneMat), new THREE.Mesh(boneKnob2, boneMat));
  legGroup.position.set(0.014, 0.205, 0.012);
  legGroup.rotation.set(0.42, 0.55, -2.25);
  root.add(legGroup);

  // 4. Crispy Birista Fried Onions & Fresh Mint Leaf Garnish (~4,500 tris)
  const onionMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0xb84a0c), roughness: 0.44, clearcoat: 0.3 });
  const onionParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 16; i++) {
    const st = buildCrispCrinkledOnionStrip({ radius: 0.009 + rng() * 0.007, arcAngle: 1.8, width: 0.0032, thickness: 0.0006, segLen: 14, segWidth: 3, seed: 400 + i });
    const a = (i / 16) * Math.PI * 2;
    const rad = 0.018 + rng() * 0.048;
    st.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * rad, 0.188 + (rng() - 0.5) * 0.012, Math.sin(a) * rad), new THREE.Quaternion().setFromEuler(new THREE.Euler(rng() * 3, rng() * 6, rng() * 3)), new THREE.Vector3(1, 1, 1)));
    onionParts.push(st);
  }
  const oMerged = mergeGeomsSafe(onionParts);
  for (const g of onionParts) g.dispose();
  root.add(new THREE.Mesh(oMerged, onionMat));

  const mintMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0x468e12), roughness: 0.32, sheen: 0.4, sheenColor: new THREE.Color(0x9be236), clearcoat: 0.42 });
  const mintParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const lf = buildBotanicalThickLeaf({ length: 0.026, width: 0.016, thickness: 0.0007, segU: 16, segV: 8, lobeStyle: 'mint', seed: 90 + i });
    const a = (i / 6) * Math.PI * 2 + 0.3;
    lf.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(-0.018 + Math.cos(a) * 0.012, 0.205, 0.012 + Math.sin(a) * 0.012), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.35 + (rng() - 0.5) * 0.4, a, 0.15)), new THREE.Vector3(1, 1, 1)));
    mintParts.push(lf);
  }
  const mMerged = mergeGeomsSafe(mintParts);
  for (const g of mintParts) g.dispose();
  root.add(new THREE.Mesh(mMerged, mintMat));

  // 5. Graceful Rising Translucent 3D Steam Plumes (~2,400 tris)
  const steamParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + 0.4;
    const bx = Math.cos(ang) * 0.026;
    const bz = Math.sin(ang) * 0.026;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(bx, 0.205, bz),
      new THREE.Vector3(bx + 0.014 * Math.sin(i), 0.248, bz + 0.010 * Math.cos(i)),
      new THREE.Vector3(bx - 0.012 * Math.cos(i), 0.292, bz + 0.014 * Math.sin(i)),
      new THREE.Vector3(bx + 0.008 * Math.sin(i * 2), 0.335, bz - 0.008),
    ]);
    const sg = new THREE.TubeGeometry(curve, 22, 0.008, 8, false);
    const sp = sg.attributes.position as THREE.BufferAttribute;
    const suv = sg.attributes.uv as THREE.BufferAttribute;
    for (let k = 0; k < sp.count; k++) {
      const t = clamp(suv.getX(k), 0, 1);
      const c = curve.getPointAt(t);
      const env = Math.sin(t * Math.PI) * (0.45 + t * 0.85);
      sp.setXYZ(k, c.x + (sp.getX(k) - c.x) * env, c.y + (sp.getY(k) - c.y) * env, c.z + (sp.getZ(k) - c.z) * env);
    }
    sp.needsUpdate = true;
    sg.computeVertexNormals();
    steamParts.push(sg);
  }
  const stMerged = mergeGeomsSafe(steamParts);
  for (const g of steamParts) g.dispose();
  const steamMesh = new THREE.Mesh(
    stMerged,
    new THREE.MeshPhysicalMaterial({
      name: 'biryani-aromatic-steam',
      color: new THREE.Color(0xfaf4ea),
      roughness: 0.92,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  steamMesh.name = 'aromatic-steam-wisps';
  root.add(steamMesh);

  return root;
}

export default createSteamingBiryaniHandiModel;
