import * as THREE from 'three';
import {
  buildBotanicalThickLeaf,
  buildPhotorealPbrTextures,
  clamp,
  createSeededRng,
  displaceLayered3D,
  enableAoUv,
  fbm3,
  mergeGeomsSafe,
  mixRgb,
  smoothstep,
  worley3,
} from '../../../../tools/shared/photoreal3d';

export interface PhotorealOptions {
  textureSize?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  wireframe?: boolean;
}

export function createCrispyChickenDrumstickModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'crispy-chicken-drumstick';

  const rng = createSeededRng(82401);
  const texSize = options.textureSize ?? 1024;

  // Periodic isotropic 3D batter crisp texture (equatorial cylinder -> zero horizontal compression stripes!)
  const crispyTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const phi = u * Math.PI * 2;
      const th = (v - 0.5) * Math.PI;
      const cosT = Math.cos(th);
      const px = Math.cos(phi) * cosT * 2.0;
      const py = Math.sin(th) * 3.4;
      const pz = Math.sin(phi) * cosT * 2.0;

      // Multi-scale crunchy fried batter relief
      const w1 = worley3(px * 4.5, py * 4.5, pz * 4.5, 19).f1;
      const w2 = worley3(px * 9.5, py * 9.5, pz * 9.5, 53).f1;
      const crunch = smoothstep(0.68, 0.14, w1) * 0.72 + smoothstep(0.65, 0.15, w2) * 0.28;
      const macro = fbm3(px * 1.8, py * 1.8, pz * 1.8, 4, 41);

      // Soft round spice flecks (smoothstep discs, zero square noise)
      const gScale = 14;
      const gx = Math.floor(px * gScale);
      const gy = Math.floor(py * gScale);
      const gz = Math.floor(pz * gScale);
      const ox = (fbm3(gx * 1.1, gy * 1.3, gz * 1.7, 1, 7) - 0.5) * 0.65;
      const oy = (fbm3(gx * 1.9, gy * 1.1, gz * 1.3, 1, 23) - 0.5) * 0.65;
      const oz = (fbm3(gx * 1.3, gy * 1.7, gz * 1.1, 1, 37) - 0.5) * 0.65;
      const d = Math.hypot(px * gScale - (gx + 0.5 + ox), py * gScale - (gy + 0.5 + oy), pz * gScale - (gz + 0.5 + oz));
      const fleck = smoothstep(0.28, 0.08, d) * smoothstep(0.42, 0.85, macro);

      const knuckleDark = smoothstep(0.22, 0.03, v) * 0.45;
      let rgb = mixRgb([158, 56, 10], [244, 146, 16], clamp(0.26 + crunch * 0.52 + macro * 0.28, 0, 1));
      rgb = mixRgb(rgb, [74, 12, 2], clamp(knuckleDark + (1 - crunch) * 0.26, 0, 0.92));
      rgb = mixRgb(rgb, [54, 6, 2], fleck * 0.84);

      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: crunch * 0.68 + macro * 0.25,
        rough: clamp(0.22 + (1 - crunch) * 0.34 + knuckleDark * 0.18, 0.16, 0.72),
        ao: clamp(0.56 + 0.44 * crunch - knuckleDark * 0.2, 0.34, 1.0),
      };
    },
    { normalStrength: 3.4 }
  );

  const skinMat = new THREE.MeshPhysicalMaterial({
    name: 'crispy-spiced-skin',
    map: crispyTex.albedoMap,
    normalMap: crispyTex.normalMap,
    normalScale: new THREE.Vector2(1.05, 1.05),
    aoMap: crispyTex.ormMap,
    aoMapIntensity: 0.78,
    roughnessMap: crispyTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.44,
    clearcoatRoughness: 0.18,
    sheen: 0.14,
    sheenColor: new THREE.Color(0xf48804),
    wireframe: options.wireframe ?? false,
  });

  const boneMat = new THREE.MeshPhysicalMaterial({
    name: 'drumstick-bone-tip',
    color: new THREE.Color().setStyle('#ecd8b6', THREE.SRGBColorSpace),
    roughness: 0.38,
    clearcoat: 0.25,
    wireframe: options.wireframe ?? false,
  });

  const herbMat = new THREE.MeshPhysicalMaterial({
    name: 'crispy-drumstick-herbs',
    color: new THREE.Color().setStyle('#4b9c1a', THREE.SRGBColorSpace),
    roughness: 0.34,
    clearcoat: 0.4,
    sheen: 0.4,
    sheenColor: new THREE.Color(0x98e03c),
    wireframe: options.wireframe ?? false,
  });

  // Sculpted Isotropic Sphere -> Plump rounded meat dome at top (tf=0.75) tapering gracefully to knuckle bone (tf=0)
  const meatGeom = new THREE.SphereGeometry(1.0, 96, 72); // ~13,824 tris
  const pos = meatGeom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const ux = pos.getX(i);
    const uy = pos.getY(i);
    const uz = pos.getZ(i);
    const tf = (uy + 1) * 0.5; // 0 (knuckle neck) .. 1 (top meat dome)
    const radLen = Math.hypot(ux, uz);
    const ang = Math.atan2(uz, ux);

    const yWorld = (tf - 0.38) * 0.132; // -0.050 .. +0.082
    // Sphere radLen provides smooth tangent-continuous rounded caps at tf=0 and tf=1!
    // Envelope scales relative radius to make narrow ankle (tf=0.1..0.35) & fat top bulb (tf=0.65..0.95)
    const pearWeight = 0.32 + 1.15 * Math.pow(smoothstep(0.12, 0.76, tf), 1.35);
    const desiredMaxR = 0.032 * pearWeight;
    const asym = 1 + 0.11 * Math.cos(ang + 0.4) * Math.sin(tf * Math.PI);

    const bendX = Math.sin(tf * Math.PI) * 0.004;
    const bendZ = Math.cos(tf * Math.PI * 0.8) * 0.003;
    const scaleR = desiredMaxR * asym;

    const wx = ux * scaleR + bendX;
    const wz = uz * scaleR + bendZ;

    // Gentle isotropic batter bumps using 3D position coords across entire meat skin
    const skinCover = smoothstep(0.06, 0.22, tf);
    const c1 = (1 - worley3(wx * 125, yWorld * 125, wz * 125, 91).f1) * 0.0022 * skinCover;
    const c2 = (fbm3(wx * 55, yWorld * 55, wz * 55, 3, 17) - 0.5) * 0.0032 * skinCover;
    const radialUnit = radLen > 1e-5 ? 1 : 0;
    const bumpX = radialUnit ? (ux / radLen) * (c1 + c2) : 0;
    const bumpZ = radialUnit ? (uz / radLen) * (c1 + c2) : 0;

    pos.setXYZ(i, ux * scaleR + bendX + bumpX, yWorld + c1 * uy * 0.4, uz * scaleR + bendZ + bumpZ);
  }
  pos.needsUpdate = true;
  meatGeom.computeVertexNormals();
  enableAoUv(meatGeom);

  // Two-lobed bone condyle emerging cleanly from tapered bottom
  const boneCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.001, -0.044, 0.0),
    new THREE.Vector3(-0.003, -0.068, -0.003),
    new THREE.Vector3(-0.005, -0.088, -0.006),
  ]);
  const shaft = new THREE.TubeGeometry(boneCurve, 18, 0.007, 16, false);
  const sp = shaft.attributes.position as THREE.BufferAttribute;
  const suv = shaft.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < sp.count; i++) {
    const t = suv.getX(i);
    const center = boneCurve.getPointAt(clamp(t, 0, 1));
    const s = (0.0064 + 0.0032 * Math.pow(t, 1.7)) / 0.007;
    sp.setXYZ(i, center.x + (sp.getX(i) - center.x) * s, center.y + (sp.getY(i) - center.y) * s, center.z + (sp.getZ(i) - center.z) * s);
  }
  sp.needsUpdate = true;
  shaft.computeVertexNormals();

  const k1 = new THREE.SphereGeometry(0.0075, 14, 12);
  k1.scale(0.95, 0.85, 1.12);
  displaceLayered3D(k1, { lowFreq: 180, lowAmp: 0.0004, seed: 11 });
  k1.translate(-0.0085, -0.089, -0.006);

  const k2 = new THREE.SphereGeometry(0.0070, 14, 12);
  k2.scale(0.95, 0.82, 1.10);
  displaceLayered3D(k2, { lowFreq: 180, lowAmp: 0.0004, seed: 22 });
  k2.translate(-0.0015, -0.090, -0.007);

  const mergedBone = mergeGeomsSafe([shaft, k1, k2]);
  shaft.dispose();
  k1.dispose();
  k2.dispose();
  enableAoUv(mergedBone);

  // Fresh bright cilantro leaf flecks pressed directly onto upper rounded belly skin
  const herbGeoms: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 8; i++) {
    const lf = buildBotanicalThickLeaf({
      length: 0.011,
      width: 0.008,
      thickness: 0.0004,
      segU: 10,
      segV: 6,
      serrationCount: 4,
      lobeStyle: 'cilantro',
      seed: 50 + i,
    });
    const ang = -0.8 + (i / 7) * 2.6 + (rng() - 0.5) * 0.3;
    const tf = 0.46 + (i / 7) * 0.34;
    const h = (tf - 0.38) * 0.132;
    const sphereSin = Math.sqrt(Math.max(0.05, 1 - (2 * tf - 1) * (2 * tf - 1)));
    const pearW = 0.32 + 1.15 * Math.pow(smoothstep(0.12, 0.76, tf), 1.35);
    const asym = 1 + 0.11 * Math.cos(ang + 0.4) * Math.sin(tf * Math.PI);
    const rad = sphereSin * 0.032 * pearW * asym;
    const bendX = Math.sin(tf * Math.PI) * 0.004;
    const bendZ = Math.cos(tf * Math.PI * 0.8) * 0.003;
    lf.applyMatrix4(
      new THREE.Matrix4().compose(
        new THREE.Vector3(Math.cos(ang) * rad * 0.96 + bendX, h, Math.sin(ang) * rad * 0.96 + bendZ),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35, -ang, 0.7)),
        new THREE.Vector3(1, 1, 1)
      )
    );
    herbGeoms.push(lf);
  }
  const mergedHerbs = mergeGeomsSafe(herbGeoms);
  for (const g of herbGeoms) g.dispose();
  enableAoUv(mergedHerbs);

  const meatMesh = new THREE.Mesh(meatGeom, skinMat);
  meatMesh.name = 'crispy-thigh-meat';
  meatMesh.castShadow = options.castShadow ?? true;
  meatMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(meatMesh);

  const boneMesh = new THREE.Mesh(mergedBone, boneMat);
  boneMesh.name = 'bone-condyle';
  boneMesh.castShadow = true;
  root.add(boneMesh);

  const herbMesh = new THREE.Mesh(mergedHerbs, herbMat);
  herbMesh.name = 'crispy-drumstick-herbs';
  root.add(herbMesh);

  // Dynamic diagonal culinary showcase tilt like reference
  root.rotation.set(0.15, -0.25, -0.58);

  return root;
}

export default createCrispyChickenDrumstickModel;
