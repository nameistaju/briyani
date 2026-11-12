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

function buildDetailedCinnamonQuill(length: number, radius: number, thickness: number, bend: number, seed: number): THREE.BufferGeometry {
  // Double-C inward coiled bark cross-section extruded smoothly with thick walls & organic broken bark ends
  const scrollPts: THREE.Vector2[] = [];
  const halfSteps = 32;
  for (let i = 0; i <= halfSteps; i++) {
    const t = i / halfSteps;
    const theta = t * Math.PI * 2.15;
    const rSp = radius * (0.56 - t * 0.34);
    scrollPts.push(new THREE.Vector2(-radius * 0.44 - Math.cos(theta) * rSp, Math.sin(theta) * rSp));
  }
  const leftSide = scrollPts.slice().reverse();
  const rightSide: THREE.Vector2[] = [];
  for (let i = 0; i <= halfSteps; i++) {
    const t = i / halfSteps;
    const theta = t * Math.PI * 2.15;
    const rSp = radius * (0.56 - t * 0.34);
    rightSide.push(new THREE.Vector2(radius * 0.44 + Math.cos(theta) * rSp, Math.sin(theta) * rSp));
  }
  const curvePts = [...leftSide, new THREE.Vector2(0, radius * 0.54), ...rightSide];

  const uSegs = 44; // along length
  const vCount = curvePts.length;
  const sideVerts = (uSegs + 1) * vCount;
  const pos = new Float32Array(sideVerts * 2 * 3);
  const uv = new Float32Array(sideVerts * 2 * 2);

  for (let iu = 0; iu <= uSegs; iu++) {
    const u = iu / uSegs;
    const zBase = (u - 0.5) * length;
    const bowX = Math.sin(u * Math.PI) * bend;
    const bowY = Math.cos(u * Math.PI * 0.7 + seed) * bend * 0.45;
    // Slightly flared & chipped uneven bark ends
    const taper = 0.94 + 0.1 * Math.sin(u * Math.PI);

    for (let iv = 0; iv < vCount; iv++) {
      const p0 = curvePts[iv];
      const pPrev = curvePts[Math.max(0, iv - 1)];
      const pNext = curvePts[Math.min(vCount - 1, iv + 1)];
      const tx = pNext.x - pPrev.x;
      const ty = pNext.y - pPrev.y;
      const tLen = Math.hypot(tx, ty) || 1;
      // In-plane outward normal
      const nx = -ty / tLen;
      const ny = tx / tLen;

      // Uneven snapped bark edge length variation
      const chipZ = (u < 0.04 || u > 0.96) ? (fbm2(iv * 0.38, u * 12, 3, seed) - 0.5) * 0.004 : 0;
      const ridge = (fbm2(u * 26, iv * 0.4, 3, seed + 19) - 0.5) * thickness * 0.28;

      const idxOut = iu * vCount + iv;
      const idxIn = sideVerts + idxOut;

      pos[idxOut * 3] = bowX + (p0.x + nx * (thickness * 0.5 + ridge)) * taper;
      pos[idxOut * 3 + 1] = bowY + (p0.y + ny * (thickness * 0.5 + ridge)) * taper;
      pos[idxOut * 3 + 2] = zBase + chipZ;

      pos[idxIn * 3] = bowX + (p0.x - nx * (thickness * 0.5 - ridge * 0.6)) * taper;
      pos[idxIn * 3 + 1] = bowY + (p0.y - ny * (thickness * 0.5 - ridge * 0.6)) * taper;
      pos[idxIn * 3 + 2] = zBase + chipZ;

      const vCoord = iv / (vCount - 1);
      uv[idxOut * 2] = u;
      uv[idxOut * 2 + 1] = vCoord;
      uv[idxIn * 2] = u;
      uv[idxIn * 2 + 1] = vCoord;
    }
  }

  const idx: number[] = [];
  for (let iu = 0; iu < uSegs; iu++) {
    for (let iv = 0; iv < vCount - 1; iv++) {
      const a = iu * vCount + iv;
      const b = (iu + 1) * vCount + iv;
      const c = (iu + 1) * vCount + (iv + 1);
      const d = iu * vCount + (iv + 1);
      idx.push(a, b, d, b, c, d);

      const ia = sideVerts + a;
      const ib = sideVerts + b;
      const ic = sideVerts + c;
      const id = sideVerts + d;
      idx.push(ia, id, ib, ib, id, ic);
    }
  }
  // Stitch both broken bark cross-section caps (iu=0 and iu=uSegs) & scroll rims (iv=0 and iv=vCount-1)
  for (let iv = 0; iv < vCount - 1; iv++) {
    const a0 = iv, a1 = iv + 1, i0 = sideVerts + iv, i1 = sideVerts + iv + 1;
    idx.push(a0, a1, i0, a1, i1, i0);
    const eOff = uSegs * vCount;
    idx.push(eOff + a0, eOff + i0, eOff + a1, eOff + a1, eOff + i0, eOff + i1);
  }
  for (let iu = 0; iu < uSegs; iu++) {
    const l0 = iu * vCount, l1 = (iu + 1) * vCount;
    idx.push(l0, sideVerts + l0, l1, l1, sideVerts + l0, sideVerts + l1);
    const r0 = l0 + vCount - 1, r1 = l1 + vCount - 1;
    idx.push(r0, r1, sideVerts + r0, r1, sideVerts + r1, sideVerts + r0);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  displaceLayered3D(g, { lowFreq: 55, lowAmp: 0.00035, midFreq: 180, midAmp: 0.00018, highFreq: 380, highAmp: 0.00007, seed });
  enableAoUv(g);
  return g;
}

export function createCinnamonSticksModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'cinnamon-sticks';

  const rng = createSeededRng(7042);
  const texSize = options.textureSize ?? 1024;

  // Sampled palette: deep cleft brown #4b1001 -> cinnamon amber #90450f -> warm woody bark #c74d08 / #f0944e
  const barkTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const nMacro = fbm2(u * 10, v * 14, 4, 29);
      const fiber = Math.sin(v * 68 + nMacro * 5.0) * 0.5 + 0.5;
      const crack = smoothstep(0.68, 0.94, fbm2(u * 28, v * 12, 3, 141));
      const dustyEdge = smoothstep(0.62, 0.95, fbm2(u * 42, v * 42, 3, 271));

      let rgb = mixRgb([76, 20, 4], [164, 72, 18], clamp(0.32 + nMacro * 0.45 + fiber * 0.25, 0, 1));
      rgb = mixRgb(rgb, [224, 134, 64], dustyEdge * 0.42);
      rgb = mixRgb(rgb, [44, 10, 2], crack * 0.72);
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: fiber * 0.52 + nMacro * 0.35 - crack * 0.45,
        rough: clamp(0.48 + (1 - nMacro) * 0.28 + dustyEdge * 0.14, 0.38, 0.88),
        ao: clamp(0.55 + 0.45 * (1 - crack * 0.65), 0.38, 1.0),
      };
    },
    { normalStrength: 4.2 }
  );

  const barkMat = new THREE.MeshPhysicalMaterial({
    name: 'ceylon-cassia-bark',
    map: barkTex.albedoMap,
    normalMap: barkTex.normalMap,
    normalScale: new THREE.Vector2(1.2, 1.2),
    aoMap: barkTex.ormMap,
    aoMapIntensity: 0.8,
    roughnessMap: barkTex.ormMap,
    roughness: 1.0,
    wireframe: options.wireframe ?? false,
  });

  // 3 Intersecting Sculpted Cinnamon Quills (~24,000 tris total!) matching "Cinnamon Sticks in Dramatic Light.png"
  const quills = [
    { len: 0.088, rad: 0.0085, thick: 0.0016, bend: 0.0042, pos: [0, 0.002, 0], rot: [0.42, -0.35, 0.62] },
    { len: 0.078, rad: 0.0078, thick: 0.00145, bend: -0.0038, pos: [0.008, -0.005, 0.011], rot: [-0.28, 0.68, -0.55] },
    { len: 0.068, rad: 0.0072, thick: 0.00135, bend: 0.003, pos: [-0.011, 0.007, -0.009], rot: [0.85, 0.18, -1.05] },
  ];

  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < quills.length; i++) {
    const q = quills[i];
    const g = buildDetailedCinnamonQuill(q.len, q.rad, q.thick, q.bend, 100 + i * 33);
    g.rotateX(q.rot[0]);
    g.rotateY(q.rot[1]);
    g.rotateZ(q.rot[2]);
    g.translate(q.pos[0], q.pos[1], q.pos[2]);
    parts.push(g);
  }

  // Aromatic floating spice bark flakes
  for (let k = 0; k < 10; k++) {
    const chip = subdivideGeometry(new THREE.BoxGeometry(0.0022 + rng() * 0.002, 0.0008, 0.0035 + rng() * 0.003), 1);
    displaceLayered3D(chip, { lowFreq: 160, lowAmp: 0.0004, midFreq: 320, midAmp: 0.0002, seed: 500 + k });
    chip.rotateX(rng() * Math.PI);
    chip.rotateY(rng() * Math.PI);
    const ang = rng() * Math.PI * 2;
    const dist = 0.025 + rng() * 0.024;
    chip.translate(Math.cos(ang) * dist, (rng() - 0.5) * 0.032, Math.sin(ang) * dist);
    parts.push(chip);
  }

  const merged = mergeGeomsSafe(parts);
  for (const g of parts) g.dispose();
  enableAoUv(merged);

  const mesh = new THREE.Mesh(merged, barkMat);
  mesh.name = 'cinnamon-quill-bundle';
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  root.add(mesh);

  return root;
}

export default createCinnamonSticksModel;
