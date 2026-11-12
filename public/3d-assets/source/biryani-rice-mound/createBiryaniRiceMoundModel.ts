import * as THREE from 'three';
import {
  bakeInstanceTransforms,
  buildBotanicalThickLeaf,
  buildCrispCrinkledOnionStrip,
  buildCurvedBasmatiGrain,
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
  smoothstep,
  subdivideGeometry,
  worley2,
} from '../../../../tools/shared/photoreal3d';

function moundSurfaceRadius(vFrac: number): { r: number; y: number } {
  // Fits neatly inside copper-handi cavity (neck inner 0.107, belly inner 0.135)
  // vFrac: 0 = base inside pot, 1 = high aromatic crown
  const theta = vFrac * Math.PI;
  const y = 0.064 * (1 - Math.cos(theta)) + 0.01 * Math.sin(theta);
  let r = Math.sin(theta) * 0.104;
  if (vFrac < 0.34) r *= 0.8 + 0.2 * (vFrac / 0.34);
  const waist = Math.exp(-Math.pow((vFrac - 0.52) / 0.2, 2));
  r *= 1 - waist * 0.06;
  return { r, y };
}

export function createBiryaniRiceMoundModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'biryani-rice-mound';

  const rng = createSeededRng(90210);
  const texSize = options.textureSize ?? 2048;

  // Sampled palette from Floating Basmati Biryani Rice Mound.png:
  // masala/caramel #bf6302 -> turmeric gold #e5a50c -> saffron #fdc102 -> ivory cooked basmati #f8eed9
  const coreTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const fMacro = fbm2(u * 14, v * 14, 4, 17);
      const fMed = fbm2(u * 38, v * 38, 4, 83);
      // Elongated Worley cells imitating tight packed cooked rice bed under loose surface grains
      const cell = worley2(u * 62 + fMacro * 1.4, v * 52 - fMed * 1.2, 313);
      const grainBump = smoothstep(0.62, 0.12, cell.f1);
      const edgeGroove = smoothstep(0.0, 0.24, cell.f2 - cell.f1);

      const saffronPatch = smoothstep(0.45, 0.72, fMacro);
      const masalaPatch = smoothstep(0.62, 0.84, fMed);

      const ivory: [number, number, number] = [248, 236, 206];
      const saffronGold: [number, number, number] = [246, 178, 22];
      const masalaBrown: [number, number, number] = [148, 62, 12];

      let rgb = mixRgb(ivory, saffronGold, clamp(saffronPatch * 0.9 + cell.cellId * 0.25, 0, 1));
      rgb = mixRgb(rgb, masalaBrown, clamp(masalaPatch * 0.58, 0, 0.72));
      const ao = clamp(0.62 + 0.38 * edgeGroove * (0.7 + 0.3 * grainBump), 0.55, 1.0);
      const rough = clamp(0.24 + (1 - grainBump) * 0.28 + masalaPatch * 0.1, 0.2, 0.62);

      return {
        r: rgb[0] * (0.85 + 0.18 * grainBump),
        g: rgb[1] * (0.85 + 0.18 * grainBump),
        b: rgb[2] * (0.85 + 0.18 * grainBump),
        h: grainBump * 0.7 + fMed * 0.2,
        rough,
        ao,
      };
    },
    { normalStrength: 4.0 }
  );

  // Detailed cooked basmati grain texture (subtle translucent bran striations & moist oil sheen)
  const grainTex = buildPhotorealPbrTextures(
    512,
    (u, v) => {
      const n = fbm2(u * 8, v * 28, 3, 601);
      const fine = fbm2(u * 20, v * 55, 2, 709);
      const tipWhite = smoothstep(0.35, 0.9, Math.abs(v - 0.5) * 2);
      const baseRgb = mixRgb([252, 245, 224], [240, 226, 192], n * 0.55 + tipWhite * 0.25);
      return {
        r: baseRgb[0],
        g: baseRgb[1],
        b: baseRgb[2],
        h: n * 0.35 + fine * 0.25,
        rough: clamp(0.22 + (1 - fine) * 0.18, 0.16, 0.48),
        ao: clamp(0.84 + 0.16 * n, 0.75, 1.0),
      };
    },
    { normalStrength: 1.5 }
  );

  const coreMat = new THREE.MeshPhysicalMaterial({
    name: 'biryani-rice-bed-core',
    map: coreTex.albedoMap,
    normalMap: coreTex.normalMap,
    normalScale: new THREE.Vector2(1.05, 1.05),
    aoMap: coreTex.ormMap,
    aoMapIntensity: 0.85,
    roughnessMap: coreTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.22,
    clearcoatRoughness: 0.32,
    wireframe: options.wireframe ?? false,
  });

  const grainsMat = new THREE.MeshPhysicalMaterial({
    name: 'cooked-basmati-grains',
    map: grainTex.albedoMap,
    normalMap: grainTex.normalMap,
    normalScale: new THREE.Vector2(0.5, 0.5),
    aoMap: grainTex.ormMap,
    aoMapIntensity: 0.4,
    roughnessMap: grainTex.ormMap,
    roughness: 1.0,
    vertexColors: true,
    sheen: 0.18,
    sheenColor: new THREE.Color(0xffeab8),
    clearcoat: 0.28,
    clearcoatRoughness: 0.22,
    wireframe: options.wireframe ?? false,
  });

  // 1. Clumped Sculpted Rice Dome Core (~11,500 tris)
  const coreGeom = subdivideGeometry(new THREE.SphereGeometry(1, 56, 36), options.highPoly === false ? 0 : 1);
  const cPos = coreGeom.attributes.position as THREE.BufferAttribute;
  const tmp = new THREE.Vector3();
  for (let i = 0; i < cPos.count; i++) {
    tmp.fromBufferAttribute(cPos, i);
    const phi = Math.atan2(tmp.z, tmp.x);
    const sy = clamp(tmp.y, -1, 1);
    const vFrac = Math.acos(-sy) / Math.PI;
    const prof = moundSurfaceRadius(vFrac);
    const clump = (fbm3(Math.cos(phi) * 2.2, vFrac * 4.5, Math.sin(phi) * 2.2, 3, 22) - 0.5) * 0.013;
    const rad = Math.max(0.0001, prof.r + clump * Math.sin(vFrac * Math.PI));
    cPos.setXYZ(i, Math.cos(phi) * rad, prof.y + clump * 0.45, Math.sin(phi) * rad);
  }
  cPos.needsUpdate = true;
  displaceLayered3D(coreGeom, { lowFreq: 32, lowAmp: 0.0025, midFreq: 90, midAmp: 0.0014, highFreq: 180, highAmp: 0.0005, seed: 55 });
  enableAoUv(coreGeom);

  const coreMesh = new THREE.Mesh(coreGeom, coreMat);
  coreMesh.name = 'rice-mound-core';
  coreMesh.castShadow = options.castShadow ?? true;
  coreMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(coreMesh);

  // 2. 3,100 Real 3D Curved Tapered Basmati Grains (~99,000 tris total -> inside 40k-120k target!)
  // Oriented organically along dome slope tangents & fluffy mound pockets (NO sea-urchin vertical needle spikes!)
  const grainGeom = buildCurvedBasmatiGrain(0.0112, 0.00118, 0.0021, 4, 4);
  const cIvory = new THREE.Color(0xf8ecd2);
  const cCream = new THREE.Color(0xf6cf74);
  const cTurmeric = new THREE.Color(0xf6a804);
  const cSaffron = new THREE.Color(0xe86404);
  const cMasala = new THREE.Color(0x963206);

  const grainCount = options.highPoly === false ? 1500 : 3000;
  const grainTransforms: { pos: THREE.Vector3; quat: THREE.Quaternion; scale: THREE.Vector3; color: THREE.Color }[] = [];
  const upVec = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < grainCount; i++) {
    // Concentrate dense fluffy layers above rim & upper slopes (vFrac 0.28..0.99)
    const layerRoll = rng();
    const vFrac = layerRoll < 0.72 ? 0.42 + Math.pow(rng(), 0.78) * 0.56 : 0.24 + rng() * 0.24;
    const phi = rng() * Math.PI * 2;
    const prof = moundSurfaceRadius(vFrac);

    const moundNoise = (fbm3(Math.cos(phi) * 2.2, vFrac * 4.5, Math.sin(phi) * 2.2, 3, 22) - 0.5) * 0.013;
    const radialOffset = (rng() - 0.25) * 0.0065 + (i % 7 === 0 ? 0.004 : 0);
    const rad = Math.max(0.002, (prof.r + moundNoise * Math.sin(vFrac * Math.PI) + radialOffset) * (0.94 + 0.08 * rng()));
    const py = prof.y + moundNoise * 0.45 + (rng() - 0.3) * 0.0045;

    const px = Math.cos(phi) * rad;
    const pz = Math.sin(phi) * rad;

    // Omni-directional fluffy steamed basmati grains (balanced X/Y/Z natural angle of repose!)
    const radialDir = new THREE.Vector3(Math.cos(phi), 0.22, Math.sin(phi)).normalize();
    const tangDir = new THREE.Vector3(-Math.sin(phi), 0, Math.cos(phi));
    const slopeVec = new THREE.Vector3()
      .addScaledVector(tangDir, (rng() - 0.5) * 1.1)
      .addScaledVector(radialDir, (rng() - 0.32) * 1.35)
      .addScaledVector(upVec, 0.35 + (rng() - 0.25) * 1.45)
      .normalize();

    const q = new THREE.Quaternion().setFromUnitVectors(upVec, slopeVec);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(upVec, rng() * Math.PI * 2));

    const lenScale = 0.88 + rng() * 0.34;
    const thickScale = 0.9 + rng() * 0.28;

    // Rich colorful saffron & turmeric biryani marbling (55% golden/amber, 45% ivory/cream)
    const patch = fbm3(px * 20, py * 20, pz * 20, 3, 912);
    let col: THREE.Color;
    if (patch > 0.56) col = cSaffron.clone();
    else if (patch > 0.44) col = cTurmeric.clone();
    else if (patch > 0.33) col = cCream.clone();
    else col = cIvory.clone();
    if (rng() > 0.91) col.lerp(cMasala, 0.65);

    grainTransforms.push({
      pos: new THREE.Vector3(px, py, pz),
      quat: q,
      scale: new THREE.Vector3(thickScale, lenScale, thickScale),
      color: col,
    });
  }

  const grainsBaked = bakeInstanceTransforms(grainGeom, grainTransforms);
  grainGeom.dispose();
  enableAoUv(grainsBaked);

  const grainsMesh = new THREE.Mesh(grainsBaked, grainsMat);
  grainsMesh.name = 'individual-basmati-grains';
  grainsMesh.castShadow = options.castShadow ?? true;
  grainsMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(grainsMesh);

  // 3. Embedded Garnishes: Caramelized Birista Threads, Chopped Cilantro & Vivid Saffron Strands
  const onionMat = new THREE.MeshPhysicalMaterial({
    name: 'mound-birista-threads',
    color: new THREE.Color(0x9a3d0a),
    roughness: 0.44,
    clearcoat: 0.28,
    wireframe: options.wireframe ?? false,
  });
  const onionParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 28; i++) {
    const vFrac = 0.58 + rng() * 0.40;
    const phi = rng() * Math.PI * 2;
    const prof = moundSurfaceRadius(vFrac);
    const strip = buildCrispCrinkledOnionStrip({
      radius: 0.015 + rng() * 0.009,
      arcAngle: 1.5 + rng() * 1.1,
      width: 0.0052,
      thickness: 0.00095,
      curlLift: 0.0045,
      seed: 100 + i * 19,
      segLen: 14,
      segWidth: 3,
    });
    strip.translate(-0.01, 0, 0);
    strip.rotateX((rng() - 0.5) * 0.8);
    strip.rotateY(rng() * Math.PI * 2);
    strip.translate(Math.cos(phi) * (prof.r + 0.003), prof.y + 0.0045, Math.sin(phi) * (prof.r + 0.003));
    onionParts.push(strip);
  }
  const mergedOnions = mergeGeomsSafe(onionParts);
  for (const g of onionParts) g.dispose();
  const onionMesh = new THREE.Mesh(mergedOnions, onionMat);
  onionMesh.name = 'mound-birista-garnish';
  root.add(onionMesh);

  const cilantroMat = new THREE.MeshPhysicalMaterial({
    name: 'mound-cilantro-flecks',
    color: new THREE.Color(0x469618),
    roughness: 0.34,
    sheen: 0.4,
    clearcoat: 0.24,
    wireframe: options.wireframe ?? false,
  });
  const herbParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 24; i++) {
    const vFrac = 0.56 + rng() * 0.42;
    const phi = rng() * Math.PI * 2;
    const prof = moundSurfaceRadius(vFrac);
    const lGeom = buildBotanicalThickLeaf({
      length: 0.016 + rng() * 0.006,
      width: 0.013,
      segU: 10,
      segV: 8,
      lobeStyle: 'cilantro',
      arch: 0.0022,
      seed: 50 + i * 11,
    });
    lGeom.rotateX((rng() - 0.5) * 0.9);
    lGeom.rotateY(rng() * Math.PI * 2);
    lGeom.translate(Math.cos(phi) * (prof.r + 0.003), prof.y + 0.0045, Math.sin(phi) * (prof.r + 0.003));
    herbParts.push(lGeom);
  }
  const mergedHerbs = mergeGeomsSafe(herbParts);
  for (const g of herbParts) g.dispose();
  const herbMesh = new THREE.Mesh(mergedHerbs, cilantroMat);
  herbMesh.name = 'mound-cilantro-flecks';
  root.add(herbMesh);

  // Garnish crown socket
  const crownSocket = new THREE.Object3D();
  crownSocket.name = 'crown-top';
  crownSocket.position.set(0, 0.132, 0);
  root.add(crownSocket);

  return root;
}

export default createBiryaniRiceMoundModel;
