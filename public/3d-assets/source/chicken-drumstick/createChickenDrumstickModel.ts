import * as THREE from 'three';
import {
  buildBotanicalThickLeaf,
  buildCrispCrinkledOnionStrip,
  buildPhotorealPbrTextures,
  clamp,
  createSeededRng,
  displaceLayered3D,
  enableAoUv,
  fbm2,
  fbm3,
  mergeGeomsSafe,
  mixRgb,
  PhotorealOptions,
  ridged3,
  smoothstep,
  subdivideGeometry,
  valueNoise2,
  worley2,
} from '../../../../tools/shared/photoreal3d';

/**
 * Radial spice fleck SDF so spice granules & char bubbles are smooth soft organic particles — zero grid squares.
 */
function smoothSpiceBlotches(u: number, v: number, density: number, seed: number): { intensity: number; dark: number; bright: number } {
  const gx = u * density;
  const gy = v * density * 0.75;
  const ix = Math.floor(gx);
  const iy = Math.floor(gy);
  const fx = gx - ix;
  const fy = gy - iy;
  let intensity = 0;
  let dark = 0;
  let bright = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = ix + dx;
      const cy = iy + dy;
      const h1 = valueNoise2(cx * 3.7, cy * 5.3, seed);
      if (h1 < 0.42) continue;
      const px = dx + 0.15 + 0.7 * valueNoise2(cx * 2.1, cy * 4.9, seed + 19) - fx;
      const py = dy + 0.15 + 0.7 * valueNoise2(cx * 6.3, cy * 1.7, seed + 37) - fy;
      const rad = 0.08 + 0.22 * valueNoise2(cx * 1.9, cy * 7.1, seed + 61);
      const dist = Math.hypot(px, py * 1.15);
      const blob = smoothstep(rad, rad * 0.15, dist);
      intensity = Math.max(intensity, blob);
      if (h1 > 0.84) dark = Math.max(dark, blob);
      else if (h1 > 0.64) bright = Math.max(bright, blob);
    }
  }
  return { intensity, dark, bright };
}

export function createChickenDrumstickModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'chicken-drumstick';

  const rng = createSeededRng(40421);
  const texSize = options.textureSize ?? 2048;

  // Sampled palette from Spicy Masala Chicken Drumstick.png:
  // Periodic circular mapping (cx, cy, pv) completely eliminates longitudinal UV/Worley seam stripes
  const masalaTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const ang = u * Math.PI * 2;
      const cx = Math.cos(ang) * 1.4 + 2.5;
      const cz = Math.sin(ang) * 1.4 + 2.5;
      const pv = clamp(v, 0.02, 0.98);
      // Isotropic frequencies across circumference vs length so Worley skin blisters look round/bubbly, never banded stripes
      const nMacro = fbm2(cx * 2.1 + cz * 0.8, pv * 3.8 + cz * 0.8, 4, 17);
      const wBlister = worley2(cx * 3.4 + nMacro * 0.6, pv * 6.8 + cz * 1.6, 79);
      const blisterDome = smoothstep(0.68, 0.14, wBlister.f1);
      const skinPore = fbm2(cx * 8.5, pv * 10.5 + cz * 2.2, 3, 211);

      const flecksCoarse = smoothSpiceBlotches(cx * 0.32, pv + cz * 0.12, 18, 501);
      const flecksFine = smoothSpiceBlotches(cx * 0.32, pv + cz * 0.12, 48, 907);

      const goldenOil: [number, number, number] = [234, 118, 12];
      const fieryRed: [number, number, number] = [154, 42, 12];
      const deepChar: [number, number, number] = [56, 16, 5];

      const blisterT = clamp(0.24 + nMacro * 0.48 + blisterDome * 0.42 - flecksCoarse.dark * 0.34, 0, 1);
      let rgb = mixRgb(fieryRed, goldenOil, blisterT);
      rgb = mixRgb(rgb, deepChar, clamp(flecksCoarse.dark * 0.88 + (1 - blisterDome) * 0.24 + skinPore * 0.14, 0, 0.94));
      rgb = mixRgb(rgb, [242, 98, 14], flecksFine.bright * 0.55);
      rgb = mixRgb(rgb, [46, 12, 4], flecksFine.dark * 0.68);

      const h = blisterDome * 0.54 + nMacro * 0.25 + skinPore * 0.12 + flecksCoarse.intensity * 0.15;
      const rough = clamp(0.18 + (1 - blisterDome) * 0.22 + flecksCoarse.dark * 0.36 + flecksFine.intensity * 0.1, 0.14, 0.68);
      const ao = clamp(0.62 + 0.38 * blisterDome - flecksCoarse.dark * 0.14, 0.45, 1.0);

      return { r: rgb[0], g: rgb[1], b: rgb[2], h, rough, ao, metal: 0.0 };
    },
    { normalStrength: 3.4, wrapRepeat: true }
  );

  // Roasted glaze-coated knuckle bone (golden-amber roasted cartilage & crispy spice crust collar, never stark white)
  const boneTex = buildPhotorealPbrTextures(
    Math.min(1024, texSize),
    (u, v) => {
      const f = fbm2(u * 12, v * 18, 4, 505);
      const pore = worley2(u * 30, v * 36, 777);
      const roast = smoothstep(0.12, 0.85, f) * 0.52;
      let rgb = mixRgb([204, 146, 86], [122, 52, 16], roast + smoothstep(0.45, 0.08, pore.f1) * 0.24);
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: f * 0.42 + pore.f1 * 0.2,
        rough: clamp(0.24 + f * 0.26 + (1 - pore.f1) * 0.14, 0.18, 0.62),
        ao: clamp(0.65 + 0.35 * pore.f1, 0.48, 1.0),
      };
    },
    { normalStrength: 2.2 }
  );

  const masalaMat = new THREE.MeshPhysicalMaterial({
    name: 'tandoori-masala-skin',
    map: masalaTex.albedoMap,
    normalMap: masalaTex.normalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    aoMap: masalaTex.ormMap,
    aoMapIntensity: 0.75,
    roughnessMap: masalaTex.ormMap,
    roughness: 1.0,
    metalness: 0.0,
    clearcoat: 0.48,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.25,
    wireframe: options.wireframe ?? false,
  });

  const boneMat = new THREE.MeshPhysicalMaterial({
    name: 'roasted-knuckle-bone',
    map: boneTex.albedoMap,
    normalMap: boneTex.normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    aoMap: boneTex.ormMap,
    aoMapIntensity: 0.7,
    roughnessMap: boneTex.ormMap,
    roughness: 1.0,
    metalness: 0.0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.34,
    wireframe: options.wireframe ?? false,
  });

  // 1. High-poly Anatomical Drumstick Meat Body (~54,000 tris) along X-axis
  // Base sphere subdivided cleanly and warped along exact anatomical drumstick cross-sections:
  const baseMeat = subdivideGeometry(new THREE.SphereGeometry(0.045, 96, 68), options.highPoly === false ? 0 : 1);
  const pos = baseMeat.attributes.position as THREE.BufferAttribute;
  const uvAttr = baseMeat.attributes.uv as THREE.BufferAttribute;
  const p = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const nx = clamp(p.x / 0.045, -1, 1);
    const u = (nx + 1) * 0.5;
    const theta = Math.atan2(p.z, p.y);
    const radUnit = Math.hypot(p.y, p.z) / 0.045;

    const lengthX = -0.056 + u * 0.132;
    const bellEnv =
      Math.pow(Math.sin(Math.PI * Math.pow(u, 0.72)), 0.58) *
      (1.08 - 0.60 * smoothstep(0.45, 1.0, u)) *
      (0.92 + 0.14 * Math.sin(u * Math.PI * 1.4));
    const collarR = 0.011 * smoothstep(0.85, 1.0, u);
    const rScale = Math.max(0.002, bellEnv * 0.043 + collarR);

    const asymLobe = 1 + 0.14 * Math.cos(theta - 0.5) + 0.07 * Math.sin(theta * 2 + 0.8);
    const yBow = Math.sin(u * Math.PI) * 0.0055;
    const zBow = Math.sin(u * Math.PI * 0.85) * 0.003;

    const ry = Math.cos(theta) * radUnit * rScale * asymLobe + yBow;
    const rz = Math.sin(theta) * radUnit * rScale * 0.94 * asymLobe + zBow;

    pos.setXYZ(i, lengthX, ry, rz);
    // Remap UV cleanly along cylindrical drumstick axis so texture never pinches or seams at sphere poles
    if (uvAttr) {
      uvAttr.setXY(i, (theta + Math.PI) / (Math.PI * 2), u);
    }
  }
  pos.needsUpdate = true;
  if (uvAttr) uvAttr.needsUpdate = true;
  baseMeat.computeVertexNormals();

  // Smooth multi-octave displacement matching crispy bubbled tandoori skin without pole pinches
  displaceLayered3D(baseMeat, {
    lowFreq: 20,
    lowAmp: 0.0022,
    midFreq: 68,
    midAmp: 0.0012,
    highFreq: 165,
    highAmp: 0.00028,
    seed: 441,
  });
  enableAoUv(baseMeat);

  const meatMesh = new THREE.Mesh(baseMeat, masalaMat);
  meatMesh.name = 'drumstick-meat-body';
  meatMesh.castShadow = options.castShadow ?? true;
  meatMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(meatMesh);

  // 2. Shorter Tapered Anatomical Bone Shaft + Crisp Masala-Glazed Two-Lobed Condyle Knuckle
  const boneParts: THREE.BufferGeometry[] = [];
  const shaft = subdivideGeometry(new THREE.CylinderGeometry(0.0092, 0.0112, 0.028, 36, 18), 0);
  shaft.rotateZ(Math.PI / 2);
  shaft.translate(0.080, 0.002, 0.0);
  const spos = shaft.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < spos.count; i++) {
    const sx = spos.getX(i);
    const flare = 1 + smoothstep(0.078, 0.094, sx) * 0.56;
    spos.setY(i, spos.getY(i) * flare);
    spos.setZ(i, spos.getZ(i) * (flare * 1.15));
  }
  spos.needsUpdate = true;
  displaceLayered3D(shaft, { lowFreq: 45, lowAmp: 0.0009, midFreq: 130, midAmp: 0.0004, highFreq: 240, highAmp: 0.00014, seed: 801 });
  boneParts.push(shaft);

  // Distinct two-lobed anatomical condyle knuckle (medial & lateral rounded condyles + groove)
  for (const sideSign of [-1, 1]) {
    const condyle = subdivideGeometry(new THREE.SphereGeometry(0.0118, 28, 22), 0);
    condyle.scale(1.05, 0.88, 0.92);
    condyle.translate(0.096, sideSign * 0.0058 + 0.001, sideSign * 0.0052);
    displaceLayered3D(condyle, { lowFreq: 60, lowAmp: 0.001, midFreq: 160, midAmp: 0.00045, highFreq: 300, highAmp: 0.00018, seed: 820 + sideSign });
    boneParts.push(condyle);
  }
  // Crispy masala glaze collar clinging onto knuckle base
  const mergedBone = mergeGeomsSafe(boneParts);
  for (const g of boneParts) g.dispose();
  enableAoUv(mergedBone);

  const boneMesh = new THREE.Mesh(mergedBone, boneMat);
  boneMesh.name = 'exposed-knuckle-bone';
  boneMesh.castShadow = options.castShadow ?? true;
  boneMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(boneMesh);

  // 3. Vivid Fresh Coriander & Crispy Onion Threads Clinging Across Meat Belly
  const herbMat = new THREE.MeshPhysicalMaterial({
    name: 'clinging-herb-garnish',
    color: new THREE.Color(0x469818),
    roughness: 0.32,
    sheen: 0.4,
    sheenColor: new THREE.Color(0x98de48),
    clearcoat: 0.25,
    wireframe: options.wireframe ?? false,
  });
  const herbBackMat = new THREE.MeshStandardMaterial({ color: 0x62a436, roughness: 0.54 });

  const herbGroup = new THREE.Group();
  herbGroup.name = 'garnish-flecks';
  const herbSlots: [number, number, number, number][] = [
    [-0.016, 0.042, 0.014, 0.7],
    [0.008, 0.035, -0.020, -0.5],
    [-0.022, 0.022, 0.035, 1.1],
    [0.016, 0.018, 0.032, -0.8],
    [-0.008, -0.040, 0.016, 1.3],
    [0.022, 0.026, -0.019, 0.3],
  ];
  for (let i = 0; i < herbSlots.length; i++) {
    const [hx, hy, hz, yaw] = herbSlots[i];
    const leafG = buildBotanicalThickLeaf({
      length: 0.021,
      width: 0.016,
      segU: 12,
      segV: 10,
      lobeStyle: 'cilantro',
      arch: 0.0025,
      seed: 10 + i * 7,
    });
    const m = new THREE.Mesh(leafG, [herbMat, herbBackMat]);
    m.position.set(hx, hy, hz);
    m.lookAt(hx * 2, hy * 2.5, hz * 2.5);
    m.rotateX(Math.PI * 0.45);
    m.rotateZ(yaw);
    herbGroup.add(m);
  }

  // Two thin golden birista threads wrapped nicely onto drumstick belly
  const biristaMat = new THREE.MeshPhysicalMaterial({
    name: 'wrapped-birista',
    color: new THREE.Color(0x9a3d0a),
    roughness: 0.42,
    clearcoat: 0.3,
    wireframe: options.wireframe ?? false,
  });
  for (let i = 0; i < 3; i++) {
    const strip = buildCrispCrinkledOnionStrip({
      radius: 0.039,
      arcAngle: 1.55,
      width: 0.0042,
      thickness: 0.001,
      curlLift: 0.004,
      seed: 310 + i * 29,
      segLen: 22,
      segWidth: 4,
    });
    strip.rotateZ(Math.PI / 2);
    strip.rotateY((i - 1) * 1.1);
    strip.translate(-0.012 + i * 0.014, 0, 0);
    const sm = new THREE.Mesh(strip, biristaMat);
    herbGroup.add(sm);
  }
  root.add(herbGroup);

  // Align diagonally in sculptural showcase rest so top/front framing is iconic
  const holder = new THREE.Group();
  holder.name = 'drumstick-showcase-root';
  root.position.set(-0.02, 0, 0);
  holder.add(root);

  const attachSocket = new THREE.Object3D();
  attachSocket.name = 'mound-rest';
  attachSocket.position.set(0, -0.025, 0);
  holder.add(attachSocket);

  return holder;
}

export default createChickenDrumstickModel;
