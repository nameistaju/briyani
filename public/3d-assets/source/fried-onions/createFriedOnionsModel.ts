import * as THREE from 'three';
import {
  buildCrispCrinkledOnionStrip,
  buildPhotorealPbrTextures,
  clamp,
  createSeededRng,
  enableAoUv,
  fbm2,
  mergeGeomsSafe,
  mixRgb,
  PhotorealOptions,
  smoothstep,
  worley2,
} from '../../../../tools/shared/photoreal3d';

export function createFriedOnionsModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'fried-onions';

  const rng = createSeededRng(77123);
  const texSize = options.textureSize ?? 2048;

  // Sampled palette from Crispy Floating Fried Onions.png:
  // charred edge #442901 -> deep caramelized #cf4d14 -> translucent golden center #f68505 / #e69d44
  const onionTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      // Longitudinal parallel cell veins along slice + hot-oil bubbles
      const veins = Math.sin(v * 95 + fbm2(u * 12, v * 12, 3, 19) * 3.8) * 0.5 + 0.5;
      const bubble = worley2(u * 38, v * 28, 88);
      const blisterDome = smoothstep(0.55, 0.12, bubble.f1);
      const crispChar = smoothstep(0.55, 0.96, Math.abs(v - 0.5) * 2); // dark toasted margins
      const microNoise = fbm2(u * 48, v * 48, 3, 307);

      const goldCenter: [number, number, number] = [232, 118, 12];
      const amberCaramel: [number, number, number] = [176, 54, 8];
      const darkChar: [number, number, number] = [44, 14, 3];

      let rgb = mixRgb(amberCaramel, goldCenter, clamp(0.28 + veins * 0.34 + blisterDome * 0.36, 0, 1));
      rgb = mixRgb(rgb, darkChar, clamp(crispChar * 0.88 + microNoise * 0.22, 0, 0.95));

      const h = blisterDome * 0.58 + veins * 0.24 + microNoise * 0.18;
      const rough = clamp(0.20 + (1 - blisterDome) * 0.24 + crispChar * 0.36, 0.15, 0.72);
      const ao = clamp(0.58 + 0.42 * blisterDome - crispChar * 0.2, 0.4, 1.0);

      return { r: rgb[0], g: rgb[1], b: rgb[2], h, rough, ao };
    },
    { normalStrength: 4.0 }
  );

  const onionMat = new THREE.MeshPhysicalMaterial({
    name: 'crispy-caramelized-birista',
    map: onionTex.albedoMap,
    normalMap: onionTex.normalMap,
    normalScale: new THREE.Vector2(1.15, 1.15),
    aoMap: onionTex.ormMap,
    aoMapIntensity: 0.82,
    roughnessMap: onionTex.ormMap,
    roughness: 1.0,
    metalness: 0.0,
    clearcoat: 0.42,
    clearcoatRoughness: 0.20,
    sheen: 0.12,
    sheenColor: new THREE.Color(0xe67c18),
    envMapIntensity: 1.05,
    wireframe: options.wireframe ?? false,
  });

  // Build filled conical birista mound of 68 overlapping crinkled crescents + outer flying ribbons (~58,000 tris)
  const stripCount = options.highPoly === false ? 34 : 68;
  const geoms: THREE.BufferGeometry[] = [];

  for (let i = 0; i < stripCount; i++) {
    const tier = i / stripCount; // 0 = lower skirt -> 1 = mound peak
    const radius = 0.015 + rng() * 0.022;
    const arcAngle = 1.2 + rng() * 1.55;
    const width = 0.0072 + rng() * 0.0052;
    const thick = width * (0.14 + rng() * 0.07);
    const curlLift = (0.004 + rng() * 0.010) * (rng() > 0.5 ? 1 : -1);

    const g = buildCrispCrinkledOnionStrip({
      radius,
      arcAngle,
      width,
      thickness: thick,
      curlLift,
      seed: 100 + i * 37,
      segLen: options.highPoly === false ? 18 : 26,
      segWidth: options.highPoly === false ? 4 : 6,
    });
    // Shift crescent pivot toward strip center rather than circle origin so mound fills solidly without hollow center!
    g.translate(-radius * 0.65, 0, 0);

    const moundR = Math.pow(rng(), 0.72) * 0.052 * (1 - tier * 0.55);
    const ang = rng() * Math.PI * 2;
    const py = -0.022 + tier * 0.068 + (rng() - 0.5) * 0.014;

    g.rotateX((rng() - 0.5) * 1.3);
    g.rotateY(rng() * Math.PI * 2);
    g.rotateZ((rng() - 0.5) * 1.1);
    g.translate(Math.cos(ang) * moundR, py, Math.sin(ang) * moundR);
    geoms.push(g);
  }

  // Add tiny flaky golden onion crumbs floating at outer perimeter (~20 crumbs)
  for (let k = 0; k < 20; k++) {
    const crumb = buildCrispCrinkledOnionStrip({
      radius: 0.006 + rng() * 0.006,
      arcAngle: 0.9 + rng() * 0.7,
      width: 0.0032,
      thickness: 0.0008,
      curlLift: 0.002,
      seed: 900 + k * 13,
      segLen: 10,
      segWidth: 3,
    });
    const ang = rng() * Math.PI * 2;
    const dist = 0.045 + rng() * 0.036;
    crumb.rotateX(rng() * Math.PI);
    crumb.rotateY(rng() * Math.PI);
    crumb.translate(Math.cos(ang) * dist, (rng() - 0.4) * 0.055, Math.sin(ang) * dist);
    geoms.push(crumb);
  }

  const merged = mergeGeomsSafe(geoms);
  for (const g of geoms) g.dispose();
  enableAoUv(merged);

  const mesh = new THREE.Mesh(merged, onionMat);
  mesh.name = 'crispy-birista-cluster';
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  root.add(mesh);

  return root;
}

export default createFriedOnionsModel;
