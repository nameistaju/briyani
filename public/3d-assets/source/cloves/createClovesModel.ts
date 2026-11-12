import * as THREE from 'three';
import {
  buildPhotorealPbrTextures,
  clamp,
  createSeededRng,
  displaceLayered3D,
  enableAoUv,
  fbm2,
  mergeGeomsSafe,
  mixRgb,
  PhotorealOptions,
  smoothstep,
  subdivideGeometry,
  worley2,
} from '../../../../tools/shared/photoreal3d';

function buildDetailedSingleClove(seedVal: number): { stemAndClaws: THREE.BufferGeometry; budHead: THREE.BufferGeometry } {
  const parts: THREE.BufferGeometry[] = [];

  // 1. 4-fluted tapered woody nail stem (y = -0.012..0.0055)
  const stem = subdivideGeometry(new THREE.CylinderGeometry(0.0023, 0.00105, 0.0175, 24, 16), 0);
  const spos = stem.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < spos.count; i++) {
    const x = spos.getX(i);
    const y = spos.getY(i);
    const z = spos.getZ(i);
    const t = clamp((y + 0.00875) / 0.0175, 0, 1);
    const a = Math.atan2(z, x);
    // Swell subtly into neck collar at t>0.65 & square 4-fluted stem base
    const flute = 1 + 0.09 * Math.cos(a * 4);
    const collar = 1 + 0.25 * smoothstep(0.68, 1.0, t);
    const bowX = Math.sin(t * Math.PI) * 0.0007;
    spos.setXYZ(i, x * flute * collar + bowX, y - 0.0025, z * flute * collar);
  }
  spos.needsUpdate = true;
  displaceLayered3D(stem, { lowFreq: 110, lowAmp: 0.00022, midFreq: 260, midAmp: 0.00012, seed: seedVal });
  parts.push(stem);

  // 2. Four flared pointed calyx sepal prongs gripping the spherical bud head
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const dx = Math.cos(ang);
    const dz = Math.sin(ang);
    const prongCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(dx * 0.0017, 0.0046, dz * 0.0017),
      new THREE.Vector3(dx * 0.0034, 0.0068, dz * 0.0034),
      new THREE.Vector3(dx * 0.0027, 0.0094, dz * 0.0027),
    ]);
    const prong = new THREE.TubeGeometry(prongCurve, 12, 0.00095, 10, false);
    const pp = prong.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < pp.count; k++) {
      const py = pp.getY(k);
      const frac = clamp((py - 0.0046) / 0.0048, 0, 1);
      const center = prongCurve.getPointAt(frac);
      const taper = clamp(1 - frac * 0.72, 0.2, 1);
      pp.setXYZ(k, center.x + (pp.getX(k) - center.x) * taper, py, center.z + (pp.getZ(k) - center.z) * taper);
    }
    pp.needsUpdate = true;
    prong.computeVertexNormals();
    parts.push(prong);
  }

  const stemAndClaws = mergeGeomsSafe(parts);
  for (const g of parts) g.dispose();
  enableAoUv(stemAndClaws);

  // 3. Textured Unopened Spherical Bud Crown nestled inside calyx claws
  const bud = subdivideGeometry(new THREE.SphereGeometry(0.0027, 20, 16), 1);
  bud.scale(1.0, 1.12, 1.0);
  displaceLayered3D(bud, { lowFreq: 180, lowAmp: 0.00025, midFreq: 380, midAmp: 0.00014, seed: seedVal + 71 });
  bud.translate(0, 0.0078, 0);
  enableAoUv(bud);

  return { stemAndClaws, budHead: bud };
}

export function createClovesModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'cloves';

  const rng = createSeededRng(5011);
  const texSize = options.textureSize ?? 1024;

  // Sampled palette: dark mahogany crease #371101 -> woody clove bark #783518 -> amber oil ridge #bd3f05 -> warm tip #ec7720
  const stalkTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const wrinkle = fbm2(u * 20, v * 32, 4, 33);
      const cell = worley2(u * 26, v * 36, 99);
      let rgb = mixRgb([55, 17, 2], [134, 52, 18], clamp(0.32 + wrinkle * 0.45 + smoothstep(0.55, 0.1, cell.f1) * 0.28, 0, 1));
      rgb = mixRgb(rgb, [218, 108, 28], smoothstep(0.68, 0.94, wrinkle) * 0.55);
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: wrinkle * 0.55 + (1 - cell.f1) * 0.35,
        rough: clamp(0.36 + wrinkle * 0.28, 0.26, 0.72),
        ao: clamp(0.64 + 0.36 * cell.f1, 0.44, 1.0),
      };
    },
    { normalStrength: 3.8 }
  );

  const budTex = buildPhotorealPbrTextures(
    512,
    (u, v) => {
      const n = fbm2(u * 18, v * 18, 4, 71);
      const rgb = mixRgb([92, 36, 12], [178, 84, 28], clamp(0.28 + n * 0.6, 0, 1));
      return { r: rgb[0], g: rgb[1], b: rgb[2], h: n * 0.45, rough: clamp(0.45 + n * 0.25, 0.35, 0.78), ao: 0.8 };
    },
    { normalStrength: 2.6 }
  );

  const stalkMat = new THREE.MeshPhysicalMaterial({
    name: 'clove-woody-stalk',
    map: stalkTex.albedoMap,
    normalMap: stalkTex.normalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    aoMap: stalkTex.ormMap,
    aoMapIntensity: 0.75,
    roughnessMap: stalkTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.22,
    clearcoatRoughness: 0.32,
    wireframe: options.wireframe ?? false,
  });

  const budMat = new THREE.MeshPhysicalMaterial({
    name: 'clove-flower-bud',
    map: budTex.albedoMap,
    normalMap: budTex.normalMap,
    normalScale: new THREE.Vector2(0.95, 0.95),
    roughnessMap: budTex.ormMap,
    roughness: 1.0,
    sheen: 0.18,
    sheenColor: new THREE.Color(0xe09648),
    wireframe: options.wireframe ?? false,
  });

  // 5 Tumbling Cloves (~17,000 tris total!)
  const poses = [
    { pos: [0, 0.002, 0], rot: [0.35, 0.2, -0.45], s: 1.05 },
    { pos: [0.016, -0.006, 0.009], rot: [-0.7, 1.1, 0.65], s: 0.96 },
    { pos: [-0.015, 0.008, -0.006], rot: [0.95, -0.6, 1.0], s: 0.98 },
    { pos: [0.007, 0.014, -0.014], rot: [-0.3, 2.2, -0.85], s: 0.9 },
    { pos: [-0.009, -0.013, 0.013], rot: [1.3, 0.4, -0.35], s: 0.92 },
  ];

  const stemParts: THREE.BufferGeometry[] = [];
  const budParts: THREE.BufferGeometry[] = [];

  for (let i = 0; i < poses.length; i++) {
    const p = poses[i];
    const { stemAndClaws, budHead } = buildDetailedSingleClove(100 + i * 29);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...p.pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...p.rot)),
      new THREE.Vector3(p.s, p.s, p.s)
    );
    stemAndClaws.applyMatrix4(m);
    budHead.applyMatrix4(m);
    stemParts.push(stemAndClaws);
    budParts.push(budHead);
  }

  const sMerged = mergeGeomsSafe(stemParts);
  const bMerged = mergeGeomsSafe(budParts);
  for (const g of [...stemParts, ...budParts]) g.dispose();
  enableAoUv(sMerged);
  enableAoUv(bMerged);

  const sMesh = new THREE.Mesh(sMerged, stalkMat);
  sMesh.name = 'clove-stalks';
  sMesh.castShadow = options.castShadow ?? true;
  sMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(sMesh);

  const bMesh = new THREE.Mesh(bMerged, budMat);
  bMesh.name = 'clove-buds';
  bMesh.castShadow = options.castShadow ?? true;
  root.add(bMesh);

  return root;
}

export default createClovesModel;
