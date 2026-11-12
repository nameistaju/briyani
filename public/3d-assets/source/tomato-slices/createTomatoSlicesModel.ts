import * as THREE from 'three';
import {
  buildClearDropletGeometry,
  buildPhotorealPbrTextures,
  clamp,
  createDropletMaterial,
  displaceLayered3D,
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
 * Builds a genuine plump sculpted 70-degree Roma/Vine Tomato Wedge cleanly split into:
 * - skinGeom: glossy scarlet tomato skin exterior
 * - cutGeom: juicy exposed interior locule gel cavities + bright scarlet-salmon pericarp & septa
 * - seedGeom: cream teardrop seeds nestled strictly inside the sunken gel chambers
 */
function buildTomatoWedge(
  rx: number,
  ry: number,
  hasCalyx: boolean,
  seedVal: number
): { skin: THREE.BufferGeometry; cut: THREE.BufferGeometry; seeds: THREE.BufferGeometry; calyx: THREE.BufferGeometry | null; drops: THREE.Vector3[] } {
  const halfAngle = (35 * Math.PI) / 180;
  const uSegs = 46; // pole-to-pole
  const rSegs = 22; // central axis -> outer skin
  const arcSegs = 32; // along convex skin curve

  const evalR = (u: number) => {
    const th = u * Math.PI;
    // Slight classic tomato oblate squash near pole/shoulder dimple
    const dimple = 1 - 0.16 * Math.exp(-Math.pow((u - 0.08) / 0.09, 2)) - 0.08 * Math.exp(-Math.pow((u - 0.94) / 0.08, 2));
    return Math.sin(th) * ry * dimple;
  };
  const evalY = (u: number) => -Math.cos(u * Math.PI) * rx;

  // 1. Cut interior faces (-halfAngle & +halfAngle) with anatomically sunken central locule gel pocket
  const cutV: number[] = [];
  const cutUv: number[] = [];
  const cutI: number[] = [];
  const cols = rSegs + 1;
  const rows = uSegs + 1;

  for (let side = 0; side < 2; side++) {
    const phi = side === 0 ? -halfAngle : halfAngle;
    const baseOff = side * rows * cols;
    for (let iu = 0; iu <= uSegs; iu++) {
      const u = iu / uSegs;
      const y = evalY(u);
      const maxR = evalR(u);
      for (let ir = 0; ir <= rSegs; ir++) {
        const rf = ir / rSegs;
        const r = rf * maxR;
        // True recessed juicy seed gel pocket between rf 0.25..0.72 and u 0.22..0.78
        const pocket =
          smoothstep(0.18, 0.34, rf) *
          smoothstep(0.80, 0.62, rf) *
          smoothstep(0.16, 0.32, u) *
          smoothstep(0.84, 0.68, u);
        const angleRecess = (side === 0 ? 1 : -1) * pocket * 0.075;
        const p = phi + angleRecess;
        cutV.push(Math.cos(p) * r, y, Math.sin(p) * r);
        cutUv.push(rf, u);
      }
    }
    for (let iu = 0; iu < uSegs; iu++) {
      for (let ir = 0; ir < rSegs; ir++) {
        const a = baseOff + iu * cols + ir;
        const b = baseOff + (iu + 1) * cols + ir;
        const c = baseOff + (iu + 1) * cols + (ir + 1);
        const d = baseOff + iu * cols + (ir + 1);
        if (side === 0) cutI.push(a, b, d, b, c, d);
        else cutI.push(a, d, b, b, d, c);
      }
    }
  }
  const cut = new THREE.BufferGeometry();
  cut.setAttribute('position', new THREE.Float32BufferAttribute(cutV, 3));
  cut.setAttribute('uv', new THREE.Float32BufferAttribute(cutUv, 2));
  cut.setIndex(cutI);
  cut.computeVertexNormals();
  enableAoUv(cut);

  // 2. Convex Exterior Scarlet Tomato Skin
  const skinV: number[] = [];
  const skinUv: number[] = [];
  const skinI: number[] = [];
  const sCols = arcSegs + 1;
  for (let iu = 0; iu <= uSegs; iu++) {
    const u = iu / uSegs;
    const y = evalY(u);
    const maxR = evalR(u);
    for (let ia = 0; ia <= arcSegs; ia++) {
      const af = ia / arcSegs;
      const phi = -halfAngle + af * halfAngle * 2;
      const organic = 1 + 0.025 * Math.cos(phi * 5 + seedVal) * Math.sin(u * Math.PI);
      const r = maxR * organic;
      skinV.push(Math.cos(phi) * r, y, Math.sin(phi) * r);
      skinUv.push(af, u);
    }
  }
  for (let iu = 0; iu < uSegs; iu++) {
    for (let ia = 0; ia < arcSegs; ia++) {
      const a = iu * sCols + ia;
      const b = (iu + 1) * sCols + ia;
      const c = (iu + 1) * sCols + (ia + 1);
      const d = iu * sCols + (ia + 1);
      skinI.push(a, b, d, b, c, d);
    }
  }
  const skin = new THREE.BufferGeometry();
  skin.setAttribute('position', new THREE.Float32BufferAttribute(skinV, 3));
  skin.setAttribute('uv', new THREE.Float32BufferAttribute(skinUv, 2));
  skin.setIndex(skinI);
  skin.computeVertexNormals();
  enableAoUv(skin);

  // 3. Clustered Tear-Drop Tomato Seeds nestled cleanly inside BOTH sunken gel pockets (never spilling on rims!)
  const seedParts: THREE.BufferGeometry[] = [];
  for (const side of [0, 1]) {
    const phi = side === 0 ? -halfAngle + 0.045 : halfAngle - 0.045;
    for (let k = 0; k < 8; k++) {
      const uf = 0.28 + (k / 7) * 0.44 + ((k % 2) - 0.5) * 0.03;
      const rf = 0.38 + ((k % 3) - 1) * 0.08;
      const maxR = evalR(uf);
      const r = rf * maxR;
      const y = evalY(uf);
      const sg = new THREE.SphereGeometry(0.00135, 10, 8);
      sg.scale(0.55, 1.32, 0.35);
      sg.rotateX(0.35 * (k % 2 === 0 ? 1 : -1));
      sg.rotateY(phi);
      sg.translate(Math.cos(phi) * r, y, Math.sin(phi) * r);
      seedParts.push(sg);
    }
  }
  const seeds = mergeGeomsSafe(seedParts);
  for (const g of seedParts) g.dispose();
  enableAoUv(seeds);

  // 4. Optional crisp 4-petal Green Calyx Star + Stem at top shoulder
  let calyx: THREE.BufferGeometry | null = null;
  if (hasCalyx) {
    const cParts: THREE.BufferGeometry[] = [];
    const stem = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.002, rx * 0.88, 0),
        new THREE.Vector3(0.005, rx * 1.02, 0.002),
        new THREE.Vector3(0.009, rx * 1.12, -0.001),
      ]),
      10,
      0.0016,
      8,
      false
    );
    cParts.push(stem);
    for (let p = 0; p < 4; p++) {
      const a = -0.35 + p * 0.52;
      const leaf = new THREE.ConeGeometry(0.0028, 0.015, 6);
      leaf.scale(1.15, 1.0, 0.22);
      leaf.rotateZ(Math.PI * 0.55);
      leaf.rotateY(a);
      leaf.translate(Math.cos(a) * 0.006 + 0.004, rx * 0.90, Math.sin(a) * 0.006);
      cParts.push(leaf);
    }
    calyx = mergeGeomsSafe(cParts);
    for (const g of cParts) g.dispose();
    displaceLayered3D(calyx, { lowFreq: 120, lowAmp: 0.00025, seed: seedVal + 31 });
    enableAoUv(calyx);
  }

  const drops = [
    new THREE.Vector3(ry * 0.82, rx * 0.22, 0.002),
    new THREE.Vector3(ry * 0.65, -rx * 0.44, -0.003),
    new THREE.Vector3(ry * 0.35, -rx * 0.72, 0.001),
  ];

  return { skin, cut, seeds, calyx, drops };
}

export function createTomatoSlicesModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'tomato-slices';

  const texSize = options.textureSize ?? 1024;

  // Glossy crisp scarlet tomato outer skin
  const skinTex = buildPhotorealPbrTextures(
    512,
    (u, v) => {
      const n = fbm2(u * 10, v * 10, 3, 22);
      const rib = Math.sin(u * Math.PI * 4) * 0.5 + 0.5;
      const rgb = mixRgb([196, 16, 4], [240, 42, 12], clamp(0.35 + n * 0.45 + rib * 0.15, 0, 1));
      return { r: rgb[0], g: rgb[1], b: rgb[2], h: n * 0.2, rough: 0.09 + n * 0.08, ao: 0.86 };
    },
    { normalStrength: 1.2, wrapRepeat: false }
  );

  // Juicy cut tomato flesh: bright crimson outer pericarp wall + deep ruby locule gel cavity + fleshy salmon core
  const cutTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      // u = rf (0 spine axis -> 1 outer skin), v = pole to pole
      const cell = worley2(u * 28, v * 36, 177);
      const m = fbm2(u * 16, v * 16, 4, 91);
      const pocket =
        smoothstep(0.18, 0.34, u) *
        smoothstep(0.80, 0.62, u) *
        smoothstep(0.16, 0.32, v) *
        smoothstep(0.84, 0.68, v);
      const centralSpine = smoothstep(0.24, 0.04, u);
      const outerWall = smoothstep(0.72, 0.94, u);

      const brightRed: [number, number, number] = [232, 34, 10];
      const deepGel: [number, number, number] = [132, 6, 3];
      const palePith: [number, number, number] = [248, 124, 86];

      let rgb = mixRgb(brightRed, palePith, clamp(centralSpine * 0.72 + m * 0.25, 0, 0.92));
      rgb = mixRgb(rgb, deepGel, clamp(pocket * 0.88 + cell.f1 * pocket * 0.2, 0, 0.96));
      rgb = mixRgb(rgb, [208, 22, 6], outerWall * 0.55);

      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: (1 - pocket) * 0.5 + cell.f1 * 0.25,
        rough: clamp(0.05 + centralSpine * 0.16 + outerWall * 0.08, 0.04, 0.30),
        ao: clamp(0.65 + (1 - pocket * 0.55) * 0.35, 0.45, 1.0),
      };
    },
    { normalStrength: 2.8, wrapRepeat: false }
  );

  const skinMat = new THREE.MeshPhysicalMaterial({
    name: 'tomato-scarlet-skin',
    map: skinTex.albedoMap,
    normalMap: skinTex.normalMap,
    roughnessMap: skinTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.94,
    clearcoatRoughness: 0.06,
    wireframe: options.wireframe ?? false,
  });

  const cutMat = new THREE.MeshPhysicalMaterial({
    name: 'juicy-tomato-flesh',
    map: cutTex.albedoMap,
    normalMap: cutTex.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    aoMap: cutTex.ormMap,
    aoMapIntensity: 0.72,
    roughnessMap: cutTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.96,
    clearcoatRoughness: 0.05,
    sheen: 0.15,
    sheenColor: new THREE.Color(0xff8464),
    wireframe: options.wireframe ?? false,
  });

  const seedMat = new THREE.MeshPhysicalMaterial({
    name: 'tomato-gel-seeds',
    color: new THREE.Color(0xf6d578),
    roughness: 0.16,
    clearcoat: 0.9,
    clearcoatRoughness: 0.06,
    wireframe: options.wireframe ?? false,
  });

  const calyxMat = new THREE.MeshPhysicalMaterial({
    name: 'tomato-green-calyx',
    color: new THREE.Color(0x4b8f12),
    roughness: 0.42,
    clearcoat: 0.3,
    wireframe: options.wireframe ?? false,
  });

  // 3 Non-Intersecting Sculpted Tomato Wedges arranged dynamically as in reference (~15,500 tris)
  const poses = [
    { rx: 0.036, ry: 0.029, calyx: true, pos: [0.002, 0.006, 0.004], rot: [0.22, -0.55, -0.78] },
    { rx: 0.025, ry: 0.020, calyx: false, pos: [-0.038, 0.030, -0.020], rot: [-0.35, 0.65, 0.85] },
    { rx: 0.026, ry: 0.021, calyx: false, pos: [0.038, -0.028, 0.018], rot: [0.65, -1.1, 0.42] },
  ];

  const skinParts: THREE.BufferGeometry[] = [];
  const cutParts: THREE.BufferGeometry[] = [];
  const seedParts: THREE.BufferGeometry[] = [];
  const calyxParts: THREE.BufferGeometry[] = [];
  const dropParts: THREE.BufferGeometry[] = [];

  for (let i = 0; i < poses.length; i++) {
    const p = poses[i];
    const w = buildTomatoWedge(p.rx, p.ry, p.calyx, 40 + i * 29);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...p.pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...p.rot)),
      new THREE.Vector3(1, 1, 1)
    );
    w.skin.applyMatrix4(m);
    w.cut.applyMatrix4(m);
    w.seeds.applyMatrix4(m);
    skinParts.push(w.skin);
    cutParts.push(w.cut);
    seedParts.push(w.seeds);
    if (w.calyx) {
      w.calyx.applyMatrix4(m);
      calyxParts.push(w.calyx);
    }
    for (const dp of w.drops) {
      const wp = dp.clone().applyMatrix4(m);
      const dg = buildClearDropletGeometry(0.0017, 14, 10);
      dg.translate(wp.x, wp.y, wp.z);
      dropParts.push(dg);
    }
  }

  const sM = mergeGeomsSafe(skinParts);
  const cM = mergeGeomsSafe(cutParts);
  const sdM = mergeGeomsSafe(seedParts);
  const drM = mergeGeomsSafe(dropParts);
  for (const g of [...skinParts, ...cutParts, ...seedParts, ...dropParts]) g.dispose();

  const skinMesh = new THREE.Mesh(sM, skinMat);
  skinMesh.name = 'tomato-wedges-skin';
  skinMesh.castShadow = options.castShadow ?? true;
  skinMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(skinMesh);

  const cutMesh = new THREE.Mesh(cM, cutMat);
  cutMesh.name = 'tomato-wedges-flesh';
  cutMesh.castShadow = options.castShadow ?? true;
  cutMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(cutMesh);

  const seedMesh = new THREE.Mesh(sdM, seedMat);
  seedMesh.name = 'tomato-seeds';
  root.add(seedMesh);

  if (calyxParts.length > 0) {
    const cxM = mergeGeomsSafe(calyxParts);
    for (const g of calyxParts) g.dispose();
    const cxMesh = new THREE.Mesh(cxM, calyxMat);
    cxMesh.name = 'tomato-calyx-stem';
    cxMesh.castShadow = options.castShadow ?? true;
    root.add(cxMesh);
  }

  const dMesh = new THREE.Mesh(drM, createDropletMaterial());
  dMesh.name = 'tomato-juice-droplets';
  root.add(dMesh);

  return root;
}

export default createTomatoSlicesModel;
