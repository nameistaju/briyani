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

function buildSculptedCardamomPod(length: number, width: number, isCracked: boolean, seedVal: number): { husk: THREE.BufferGeometry; seeds: THREE.BufferGeometry[] } {
  const g = subdivideGeometry(new THREE.SphereGeometry(0.5, 28, 22), 1);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const p = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const v = p.y + 0.5; // 0..1 bottom stem scar -> apex tip
    const ang = Math.atan2(p.z, p.x);

    // Three rounded triangular lobes + crisp fibrous lengthwise ribs
    const triLobe = 1.0 + 0.16 * Math.cos(ang * 3) + 0.038 * Math.cos(ang * 24);
    const env = Math.pow(Math.sin(Math.PI * clamp(v, 0.01, 0.99)), 0.78);
    // Pinched stem beak & pointed apex tip
    const tipBeak = v > 0.86 ? 0.85 - (v - 0.86) * 2.8 : v < 0.1 ? 0.65 + v * 3.5 : 1.0;

    let r = width * 0.5 * triLobe * Math.max(0.06, tipBeak) * (0.18 + 0.86 * env);
    let sy = (v - 0.5) * length;

    // Subtle organic curvature
    const bowX = Math.sin(v * Math.PI) * length * 0.055;
    let radDirX = Math.cos(ang);
    let radDirZ = Math.sin(ang);

    // If cracked pod, open an anatomical cleft along one face (ang near 0) revealing seed chamber
    if (isCracked) {
      const angDiff = Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang)));
      const crackMask = smoothstep(0.65, 0.08, angDiff) * smoothstep(0.18, 0.45, v) * smoothstep(0.85, 0.55, v);
      r *= 1 - crackMask * 0.68;
      // Flare split husk flaps wider outward on crack perimeter to frame clustered dark seeds
      const flapRim = Math.exp(-Math.pow((angDiff - 0.58) / 0.22, 2)) * smoothstep(0.18, 0.45, v) * smoothstep(0.86, 0.55, v);
      r *= 1 + flapRim * 0.42;
    }

    const radialDist = Math.hypot(p.x, p.z) * 2;
    pos.setXYZ(i, bowX + radDirX * r * Math.min(1, radialDist), sy, radDirZ * r * Math.min(1, radialDist));
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  displaceLayered3D(g, { lowFreq: 95, lowAmp: 0.00035, midFreq: 240, midAmp: 0.00018, highFreq: 420, highAmp: 0.00006, seed: seedVal });
  enableAoUv(g);

  const seedGeoms: THREE.BufferGeometry[] = [];
  if (isCracked) {
    // 7 dark glossy wrinkled aromatic cardamom seeds nestled in open pod chamber
    for (let s = 0; s < 7; s++) {
      const sg = subdivideGeometry(new THREE.IcosahedronGeometry(width * 0.25, 1), 0);
      sg.scale(0.92, 1.18, 0.88);
      displaceLayered3D(sg, { lowFreq: 280, lowAmp: 0.00034, midFreq: 520, midAmp: 0.00018, seed: seedVal + s * 17 });
      const rowY = ((s - 3) / 3) * length * 0.22;
      const colZ = (s % 2 === 0 ? 1 : -1) * width * 0.14;
      sg.translate(width * 0.24 + (s % 3) * 0.0004, rowY, colZ);
      enableAoUv(sg);
      seedGeoms.push(sg);
    }
  }

  return { husk: g, seeds: seedGeoms };
}

export function createCardamomPodsModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'cardamom-pods';

  const rng = createSeededRng(9931);
  const texSize = options.textureSize ?? 1024;

  // Sampled palette: pale chartreuse #d4c231 -> vivid sage pod #5f5604 / #c09604 -> brown apex #381900
  const huskTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const fibers = Math.sin(u * 130 + fbm2(u * 14, v * 10, 3, 19) * 3.5) * 0.5 + 0.5;
      const mottle = fbm2(u * 16, v * 16, 4, 44);
      const endChar = smoothstep(0.36, 0.5, Math.abs(v - 0.5));

      let rgb = mixRgb([124, 134, 42], [198, 184, 72], clamp(0.25 + mottle * 0.55 + fibers * 0.25, 0, 1));
      rgb = mixRgb(rgb, [74, 54, 16], clamp(endChar * 0.85, 0, 0.92));

      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: fibers * 0.58 + mottle * 0.32,
        rough: clamp(0.46 + (1 - fibers) * 0.24 + endChar * 0.2, 0.35, 0.84),
        ao: clamp(0.68 + 0.32 * fibers - endChar * 0.18, 0.45, 1.0),
      };
    },
    { normalStrength: 3.4 }
  );

  const seedTex = buildPhotorealPbrTextures(
    512,
    (u, v) => {
      const w = worley2(u * 22, v * 22, 606);
      const rgb = mixRgb([24, 10, 4], [68, 32, 14], smoothstep(0.55, 0.1, w.f1));
      return { r: rgb[0], g: rgb[1], b: rgb[2], h: w.f1 * 0.5, rough: 0.32 + w.f1 * 0.25, ao: 0.78 };
    },
    { normalStrength: 3.2 }
  );

  const huskMat = new THREE.MeshPhysicalMaterial({
    name: 'cardamom-fibrous-husk',
    map: huskTex.albedoMap,
    normalMap: huskTex.normalMap,
    normalScale: new THREE.Vector2(1.15, 1.15),
    aoMap: huskTex.ormMap,
    aoMapIntensity: 0.75,
    roughnessMap: huskTex.ormMap,
    roughness: 1.0,
    sheen: 0.22,
    sheenColor: new THREE.Color(0xc8c46a),
    wireframe: options.wireframe ?? false,
  });

  const seedMat = new THREE.MeshPhysicalMaterial({
    name: 'cardamom-aromatic-seeds',
    map: seedTex.albedoMap,
    normalMap: seedTex.normalMap,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughnessMap: seedTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.38,
    clearcoatRoughness: 0.28,
    wireframe: options.wireframe ?? false,
  });

  // 4 Sleek Elongated Cardamom pods (1 gently split open + 3 intact ribs + loose scattered dark seeds) -> ~20,000 tris
  const specs = [
    { len: 0.028, wid: 0.0102, cracked: true, pos: [0, 0.002, 0.002], rot: [0.35, -0.25, 0.85] },
    { len: 0.025, wid: 0.0095, cracked: false, pos: [0.018, -0.004, -0.011], rot: [-0.45, 0.9, -0.6] },
    { len: 0.023, wid: 0.009, cracked: false, pos: [-0.017, 0.007, -0.008], rot: [0.8, 0.4, -1.1] },
    { len: 0.022, wid: 0.0086, cracked: false, pos: [-0.006, -0.012, 0.015], rot: [-0.2, 1.4, 0.5] },
  ];

  const huskParts: THREE.BufferGeometry[] = [];
  const seedParts: THREE.BufferGeometry[] = [];

  for (let i = 0; i < specs.length; i++) {
    const sp = specs[i];
    const { husk, seeds } = buildSculptedCardamomPod(sp.len, sp.wid, sp.cracked, 300 + i * 41);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...sp.pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...sp.rot)),
      new THREE.Vector3(1, 1, 1)
    );
    husk.applyMatrix4(m);
    huskParts.push(husk);
    for (const s of seeds) {
      s.applyMatrix4(m);
      seedParts.push(s);
    }
  }

  // Plus 6 tumbling dark seeds floating nearby as in reference image
  for (let k = 0; k < 6; k++) {
    const sg = subdivideGeometry(new THREE.IcosahedronGeometry(0.0021 + rng() * 0.0005, 1), 0);
    sg.scale(0.92, 1.15, 0.85);
    displaceLayered3D(sg, { lowFreq: 260, lowAmp: 0.0003, midFreq: 480, midAmp: 0.00015, seed: 700 + k });
    const ang = (k / 6) * Math.PI * 2 + 0.4;
    const dist = 0.016 + rng() * 0.012;
    sg.translate(Math.cos(ang) * dist, -0.008 + (rng() - 0.5) * 0.018, Math.sin(ang) * dist);
    seedParts.push(sg);
  }

  const hMerged = mergeGeomsSafe(huskParts);
  const sMerged = mergeGeomsSafe(seedParts);
  for (const g of [...huskParts, ...seedParts]) g.dispose();
  enableAoUv(hMerged);
  enableAoUv(sMerged);

  const huskMesh = new THREE.Mesh(hMerged, huskMat);
  huskMesh.name = 'cardamom-pods-husk';
  huskMesh.castShadow = options.castShadow ?? true;
  huskMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(huskMesh);

  const seedMesh = new THREE.Mesh(sMerged, seedMat);
  seedMesh.name = 'cardamom-seeds';
  seedMesh.castShadow = options.castShadow ?? true;
  root.add(seedMesh);

  return root;
}

export default createCardamomPodsModel;
