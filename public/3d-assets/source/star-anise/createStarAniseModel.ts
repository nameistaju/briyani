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
} from '../../../../tools/shared/photoreal3d';

function buildSingleCarpelAndSeed(len: number, wid: number, hgt: number, openGap: number, seedVal: number): { pod: THREE.BufferGeometry; seedMesh: THREE.BufferGeometry } {
  // High-segment ovoid boat hull (~1,400 tris/pod -> ~24k tris total, crisp + well under 400KB budget)
  const g = new THREE.SphereGeometry(0.5, 32, 22);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const p = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const u = p.z + 0.5; // 0 = center hub, 1 = outer tip
    const ang = Math.atan2(p.y, p.x);

    // Taper width & height into pointed tip at u=1, stout joint at u=0
    const lengthMask = Math.pow(Math.sin(Math.PI * Math.pow(clamp(u, 0.02, 0.99), 0.78)), 0.72);
    const widthScale = wid * (0.42 + 0.85 * lengthMask) * (1 - 0.55 * Math.pow(u, 2.2));
    const heightScale = hgt * (0.65 + 0.65 * Math.sin(u * Math.PI * 0.85));

    let sx = p.x * widthScale * 2;
    let sy = p.y * heightScale * 2;
    const sz = u * len;

    // Dorsal upturned curve near outer beak
    sy += Math.pow(u, 2.1) * hgt * 0.45;

    // Carve natural central longitudinal split + cupped seed cradle on top (+Y)
    if (p.y > 0.05) {
      const topSplit = Math.exp(-Math.pow(p.x * 4.5, 2)) * smoothstep(0.18, 0.82, u);
      sy -= topSplit * hgt * (0.45 + 0.45 * openGap);
      // Flare valve lips slightly outward on split edge
      sx += Math.sign(p.x) * topSplit * wid * (0.22 + 0.25 * openGap);
    }

    pos.setXYZ(i, sx, sy, sz);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  displaceLayered3D(g, { lowFreq: 65, lowAmp: 0.00055, midFreq: 180, midAmp: 0.00028, highFreq: 340, highAmp: 0.0001, seed: seedVal });
  enableAoUv(g);

  // Glossy dark walnut ovate seed sitting cleanly inside split pocket
  const s = new THREE.SphereGeometry(wid * 0.44, 18, 14);
  s.scale(0.82, 0.72, 1.25);
  s.translate(0, hgt * 0.16, len * 0.45);
  enableAoUv(s);

  return { pod: g, seedMesh: s };
}

export function createStarAniseModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'star-anise';

  const rng = createSeededRng(8081);
  const texSize = options.textureSize ?? 1024;

  // Sampled palette: dark woody core #2e0e00 -> spiced sienna #8a2100 -> warm highlight #d26a2f
  const barkTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const fMacro = fbm2(u * 12, v * 8, 4, 41);
      const fiber = Math.sin(u * 36 + fMacro * 4.5) * 0.5 + 0.5;
      const creaseDark = Math.pow(Math.abs(v - 0.5) * 2, 1.9) * 0.4;

      let rgb = mixRgb([44, 12, 3], [136, 44, 11], clamp(0.28 + fMacro * 0.5 + fiber * 0.24 - creaseDark, 0, 1));
      rgb = mixRgb(rgb, [198, 96, 38], clamp(smoothstep(0.6, 0.92, fMacro + fiber * 0.25) * 0.6, 0, 0.75));
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: fMacro * 0.65 + fiber * 0.28,
        rough: clamp(0.42 + (1 - fMacro) * 0.32, 0.32, 0.82),
        ao: clamp(0.62 + 0.38 * fMacro - creaseDark * 0.2, 0.42, 1.0),
      };
    },
    { normalStrength: 4.0 }
  );

  const seedTex = buildPhotorealPbrTextures(
    512,
    (u, v) => {
      const n = fbm2(u * 10, v * 10, 3, 91);
      const rgb = mixRgb([36, 12, 3], [92, 38, 12], 0.35 + 0.5 * n);
      return { r: rgb[0], g: rgb[1], b: rgb[2], h: n * 0.2, rough: clamp(0.14 + n * 0.14, 0.1, 0.32), ao: 0.9 };
    },
    { normalStrength: 1.0 }
  );

  const huskMat = new THREE.MeshPhysicalMaterial({
    name: 'star-anise-woody-husk',
    map: barkTex.albedoMap,
    normalMap: barkTex.normalMap,
    normalScale: new THREE.Vector2(1.15, 1.15),
    aoMap: barkTex.ormMap,
    aoMapIntensity: 0.78,
    roughnessMap: barkTex.ormMap,
    roughness: 1.0,
    metalness: 0.0,
    wireframe: options.wireframe ?? false,
  });

  const seedMat = new THREE.MeshPhysicalMaterial({
    name: 'star-anise-seed-gloss',
    map: seedTex.albedoMap,
    normalMap: seedTex.normalMap,
    roughnessMap: seedTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    wireframe: options.wireframe ?? false,
  });

  // Build main hero star + smaller floating secondary star for dynamic culinary composition (~24,000 tris total)
  const stars = [
    { scale: 1.0, pos: new THREE.Vector3(0, 0, 0), rot: new THREE.Euler(0.32, 0.2, -0.15), armCount: 8 },
    { scale: 0.64, pos: new THREE.Vector3(0.022, -0.016, -0.014), rot: new THREE.Euler(-0.6, 1.1, 0.4), armCount: 8 },
  ];

  const huskParts: THREE.BufferGeometry[] = [];
  const seedParts: THREE.BufferGeometry[] = [];

  for (let si = 0; si < stars.length; si++) {
    const st = stars[si];
    const starMatrix = new THREE.Matrix4().compose(
      st.pos,
      new THREE.Quaternion().setFromEuler(st.rot),
      new THREE.Vector3(st.scale, st.scale, st.scale)
    );

    // Central woody calyx receptacle hub + short curved stem on underside
    const hub = subdivideGeometry(new THREE.CylinderGeometry(0.0042, 0.0036, 0.0048, 18, 6), 0);
    displaceLayered3D(hub, { lowFreq: 80, lowAmp: 0.0004, midFreq: 200, midAmp: 0.0002, highFreq: 350, highAmp: 0.00008, seed: 30 + si });
    hub.applyMatrix4(starMatrix);
    huskParts.push(hub);

    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.0018, 0),
      new THREE.Vector3(0.0012, -0.0055, -0.0006),
      new THREE.Vector3(0.0028, -0.0092, -0.0015),
    ]);
    const stem = new THREE.TubeGeometry(stemCurve, 12, 0.0014, 10, false);
    stem.applyMatrix4(starMatrix);
    huskParts.push(stem);

    for (let i = 0; i < st.armCount; i++) {
      const ang = (i / st.armCount) * Math.PI * 2 + (rng() - 0.5) * 0.12;
      const len = (0.0175 + (rng() - 0.5) * 0.0036) * (i === 5 ? 0.82 : 1.0); // slender pointed carpels
      const wid = 0.0031 + (rng() - 0.5) * 0.0006;
      const hgt = 0.0046 + (rng() - 0.5) * 0.0007;
      const openGap = i % 2 === 0 ? 0.78 + rng() * 0.22 : 0.42 + rng() * 0.28;

      const { pod, seedMesh } = buildSingleCarpelAndSeed(len, wid, hgt, openGap, 200 + si * 40 + i);

      const m = new THREE.Matrix4()
        .makeRotationY(ang)
        .multiply(new THREE.Matrix4().makeRotationX((rng() - 0.5) * 0.14))
        .multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.0018));
      m.premultiply(starMatrix);

      pod.applyMatrix4(m);
      huskParts.push(pod);

      if (openGap > 0.55) {
        seedMesh.applyMatrix4(m);
        seedParts.push(seedMesh);
      } else {
        seedMesh.dispose();
      }
    }
  }

  const huskMerged = mergeGeomsSafe(huskParts);
  const seedMerged = mergeGeomsSafe(seedParts);
  for (const g of [...huskParts, ...seedParts]) g.dispose();
  enableAoUv(huskMerged);
  enableAoUv(seedMerged);

  const huskMesh = new THREE.Mesh(huskMerged, huskMat);
  huskMesh.name = 'star-anise-carpels';
  huskMesh.castShadow = options.castShadow ?? true;
  huskMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(huskMesh);

  if (seedParts.length > 0) {
    const seedsMesh = new THREE.Mesh(seedMerged, seedMat);
    seedsMesh.name = 'star-anise-seeds';
    seedsMesh.castShadow = options.castShadow ?? true;
    root.add(seedsMesh);
  }

  return root;
}

export default createStarAniseModel;
