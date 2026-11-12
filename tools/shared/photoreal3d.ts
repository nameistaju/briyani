import * as THREE from 'three';
import { mergeVertices, mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type PhotorealOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  textureSize?: number;
  highPoly?: boolean;
};

export type PhotorealTexResult = {
  albedoMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  ormMap: THREE.CanvasTexture;
};

// ---------------- Deterministic Fast Hashing & 2D/3D Noise ----------------

export function hash3(ix: number, iy: number, iz: number, seed = 1337): number {
  let h =
    Math.imul((ix | 0) ^ seed, 374761393) +
    Math.imul((iy | 0) ^ (seed * 3), 668265263) +
    Math.imul((iz | 0) ^ (seed * 7), 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function hash2(ix: number, iy: number, seed = 101): number {
  let h = Math.imul((ix | 0) ^ seed, 374761393) + Math.imul((iy | 0) ^ (seed * 5), 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function createSeededRng(seed = 1337): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smooth(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function valueNoise2(x: number, y: number, seed = 101): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

export function valueNoise3(x: number, y: number, z: number, seed = 101): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const fz = smooth(z - iz);

  const c000 = hash3(ix, iy, iz, seed);
  const c100 = hash3(ix + 1, iy, iz, seed);
  const c010 = hash3(ix, iy + 1, iz, seed);
  const c110 = hash3(ix + 1, iy + 1, iz, seed);
  const c001 = hash3(ix, iy, iz + 1, seed);
  const c101 = hash3(ix + 1, iy, iz + 1, seed);
  const c011 = hash3(ix, iy + 1, iz + 1, seed);
  const c111 = hash3(ix + 1, iy + 1, iz + 1, seed);

  const x00 = c000 + (c100 - c000) * fx;
  const x10 = c010 + (c110 - c010) * fx;
  const x01 = c001 + (c101 - c001) * fx;
  const x11 = c011 + (c111 - c011) * fx;

  const y0 = x00 + (x10 - x00) * fy;
  const y1 = x01 + (x11 - x01) * fy;
  return y0 + (y1 - y0) * fz;
}

export function fbm2(x: number, y: number, octaves = 5, seed = 101): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1.0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2(x * freq, y * freq, seed + i * 97);
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / (norm || 1);
}

export function fbm3(x: number, y: number, z: number, octaves = 4, seed = 101): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1.0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise3(x * freq, y * freq, z * freq, seed + i * 97);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / (norm || 1);
}

export function ridged3(x: number, y: number, z: number, octaves = 3, seed = 211): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1.0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = valueNoise3(x * freq, y * freq, z * freq, seed + i * 131) * 2 - 1;
    const r = 1 - Math.abs(n);
    sum += amp * r * r;
    norm += amp;
    amp *= 0.5;
    freq *= 2.11;
  }
  return sum / (norm || 1);
}

/** Smooth Worley cellular distance in 2D: f1 = distance to nearest cell center, f2-f1 = cell border */
export function worley2(x: number, y: number, seed = 409): { f1: number; f2: number; cellId: number } {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  let d1 = 99;
  let d2 = 99;
  let id = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = ix + dx;
      const cy = iy + dy;
      const px = cx + 0.15 + 0.7 * hash2(cx, cy, seed);
      const py = cy + 0.15 + 0.7 * hash2(cx, cy, seed + 53);
      const dist = Math.hypot(x - px, y - py);
      if (dist < d1) {
        d2 = d1;
        d1 = dist;
        id = hash2(cx, cy, seed + 179);
      } else if (dist < d2) {
        d2 = dist;
      }
    }
  }
  return { f1: d1, f2: d2, cellId: id };
}

export function worley3(x: number, y: number, z: number, seed = 409): { f1: number; edge: number; id: number } {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  let d1 = 99;
  let d2 = 99;
  let id = 0;
  for (let dz = -1; dz <= 1; dz++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = ix + dx;
        const cy = iy + dy;
        const cz = iz + dz;
        const px = cx + 0.12 + 0.76 * hash3(cx, cy, cz, seed);
        const py = cy + 0.12 + 0.76 * hash3(cx, cy, cz, seed + 31);
        const pz = cz + 0.12 + 0.76 * hash3(cx, cy, cz, seed + 79);
        const d = Math.hypot(x - px, y - py, z - pz);
        if (d < d1) {
          d2 = d1;
          d1 = d;
          id = hash3(cx, cy, cz, seed + 193);
        } else if (d < d2) {
          d2 = d;
        }
      }
    }
  }
  return { f1: d1, edge: d2 - d1, id };
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function mixRgb(
  c0: [number, number, number],
  c1: [number, number, number],
  t: number
): [number, number, number] {
  const k = clamp(t, 0, 1);
  return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k];
}

// ---------------- High-Res PBR Texture Baker (Albedo + Normal + Packed ORM) ----------------

export type PbrPixelSample = {
  r: number;
  g: number;
  b: number;
  h: number;
  rough: number;
  ao?: number;
  metal?: number;
};

/**
 * Generates high-resolution (1K / 2K) Albedo + Tangent Normal (Sobel) + Packed ORM (R=AO, G=Roughness, B=Metalness)
 * CanvasTextures with smooth bilinear / multi-octave synthesis.
 */
export function buildPhotorealPbrTextures(
  size: number,
  sampleFn: (u: number, v: number) => PbrPixelSample,
  opts: { normalStrength?: number; repeatX?: number; repeatY?: number; wrapRepeat?: boolean } = {}
): PhotorealTexResult {
  const normalStrength = opts.normalStrength ?? 3.5;
  const wrap = opts.wrapRepeat ?? true;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d')!;
  const aImg = aCtx.createImageData(size, size);

  const ormCanvas = document.createElement('canvas');
  ormCanvas.width = size;
  ormCanvas.height = size;
  const oCtx = ormCanvas.getContext('2d')!;
  const oImg = oCtx.createImageData(size, size);

  const heights = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    const v = 1 - y / (size - 1 || 1);
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1 || 1);
      const s = sampleFn(u, v);
      const idx = y * size + x;
      const p4 = idx * 4;

      aImg.data[p4] = clamp(Math.round(s.r), 0, 255);
      aImg.data[p4 + 1] = clamp(Math.round(s.g), 0, 255);
      aImg.data[p4 + 2] = clamp(Math.round(s.b), 0, 255);
      aImg.data[p4 + 3] = 255;

      // Packed glTF 2.0 ORM: R = Occlusion, G = Roughness, B = Metalness
      oImg.data[p4] = clamp(Math.round((s.ao ?? 1.0) * 255), 0, 255);
      oImg.data[p4 + 1] = clamp(Math.round(clamp(s.rough, 0.03, 0.99) * 255), 0, 255);
      oImg.data[p4 + 2] = clamp(Math.round(clamp(s.metal ?? 0.0, 0, 1) * 255), 0, 255);
      oImg.data[p4 + 3] = 255;

      heights[idx] = s.h;
    }
  }
  aCtx.putImageData(aImg, 0, 0);
  oCtx.putImageData(oImg, 0, 0);

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const nCtx = normalCanvas.getContext('2d')!;
  const nImg = nCtx.createImageData(size, size);

  const samp = (xx: number, yy: number) => {
    const wx = wrap ? ((xx % size) + size) % size : clamp(xx, 0, size - 1);
    const wy = wrap ? ((yy % size) + size) % size : clamp(yy, 0, size - 1);
    return heights[wy * size + wx];
  };

  // Scale normal derivative slightly by resolution so 2048px stays crisp instead of paper-thin
  const scaleK = normalStrength * (size / 512) * 0.45;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = samp(x - 1, y - 1);
      const t = samp(x, y - 1);
      const tr = samp(x + 1, y - 1);
      const l = samp(x - 1, y);
      const r = samp(x + 1, y);
      const bl = samp(x - 1, y + 1);
      const b = samp(x, y + 1);
      const br = samp(x + 1, y + 1);

      const dX = tr + 2 * r + br - (tl + 2 * l + bl);
      const dY = bl + 2 * b + br - (tl + 2 * t + tr);
      const nx = -dX * scaleK;
      const ny = dY * scaleK;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;

      const p4 = (y * size + x) * 4;
      nImg.data[p4] = clamp(Math.round(((nx / len) * 0.5 + 0.5) * 255), 0, 255);
      nImg.data[p4 + 1] = clamp(Math.round(((ny / len) * 0.5 + 0.5) * 255), 0, 255);
      nImg.data[p4 + 2] = clamp(Math.round(((nz / len) * 0.5 + 0.5) * 255), 0, 255);
      nImg.data[p4 + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);

  const wrapMode = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  const rx = opts.repeatX ?? 1;
  const ry = opts.repeatY ?? 1;

  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.wrapS = albedoMap.wrapT = wrapMode;
  albedoMap.repeat.set(rx, ry);
  albedoMap.anisotropy = 8;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.wrapS = normalMap.wrapT = wrapMode;
  normalMap.repeat.set(rx, ry);
  normalMap.anisotropy = 8;

  const ormMap = new THREE.CanvasTexture(ormCanvas);
  ormMap.colorSpace = THREE.NoColorSpace;
  ormMap.wrapS = ormMap.wrapT = wrapMode;
  ormMap.repeat.set(rx, ry);
  ormMap.anisotropy = 8;

  return { albedoMap, normalMap, ormMap };
}

// ---------------- High-Poly Geometry Subdivision & Multi-Octave Displacement ----------------

export function mergeGeomsSafe(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geoms.length === 0) return new THREE.BufferGeometry();
  const useColor = geoms.every((g) => Boolean(g.attributes.color));
  const prepped = geoms.map((g) => {
    const c = g.index ? g.toNonIndexed() : g.clone();
    if (!c.attributes.normal) c.computeVertexNormals();
    if (!c.attributes.uv) {
      c.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c.attributes.position.count * 2), 2));
    }
    if (!useColor && c.attributes.color) c.deleteAttribute('color');
    // Remove extra attributes like uv1/tangent if mismatched
    for (const k of Object.keys(c.attributes)) {
      if (k !== 'position' && k !== 'normal' && k !== 'uv' && k !== 'color') {
        c.deleteAttribute(k);
      }
    }
    return c;
  });
  const merged = mergeGeometries(prepped, false);
  for (const p of prepped) p.dispose();
  return merged ?? geoms[0].clone();
}

export function bakeInstanceTransforms(
  baseGeom: THREE.BufferGeometry,
  items: { pos: THREE.Vector3; quat?: THREE.Quaternion; scale?: THREE.Vector3; color?: THREE.Color }[]
): THREE.BufferGeometry {
  const src = baseGeom.index ? baseGeom.toNonIndexed() : baseGeom.clone();
  if (!src.attributes.normal) src.computeVertexNormals();
  const vCount = src.attributes.position.count;
  const totalVerts = vCount * items.length;

  const srcPos = src.attributes.position.array as Float32Array;
  const srcNorm = src.attributes.normal.array as Float32Array;
  const srcUv = src.attributes.uv ? (src.attributes.uv.array as Float32Array) : null;
  const useColor = items.some((x) => Boolean(x.color));

  const outPos = new Float32Array(totalVerts * 3);
  const outNorm = new Float32Array(totalVerts * 3);
  const outUv = new Float32Array(totalVerts * 2);
  const outCol = useColor ? new Float32Array(totalVerts * 3) : null;

  const mat = new THREE.Matrix4();
  const normMat = new THREE.Matrix3();
  const identQ = new THREE.Quaternion();
  const unitS = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    mat.compose(it.pos, it.quat ?? identQ, it.scale ?? unitS);
    normMat.getNormalMatrix(mat);
    const base = idx * vCount;
    for (let i = 0; i < vCount; i++) {
      const i3 = i * 3;
      const o3 = (base + i) * 3;
      p.set(srcPos[i3], srcPos[i3 + 1], srcPos[i3 + 2]).applyMatrix4(mat);
      n.set(srcNorm[i3], srcNorm[i3 + 1], srcNorm[i3 + 2]).applyMatrix3(normMat).normalize();
      outPos[o3] = p.x;
      outPos[o3 + 1] = p.y;
      outPos[o3 + 2] = p.z;
      outNorm[o3] = n.x;
      outNorm[o3 + 1] = n.y;
      outNorm[o3 + 2] = n.z;

      const i2 = i * 2;
      const o2 = (base + i) * 2;
      if (srcUv) {
        outUv[o2] = srcUv[i2];
        outUv[o2 + 1] = srcUv[i2 + 1];
      }
      if (outCol) {
        const c = it.color ?? new THREE.Color(1, 1, 1);
        outCol[o3] = c.r;
        outCol[o3 + 1] = c.g;
        outCol[o3 + 2] = c.b;
      }
    }
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(outPos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(outNorm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(outUv, 2));
  if (outCol) out.setAttribute('color', new THREE.BufferAttribute(outCol, 3));
  src.dispose();
  return out;
}

/**
 * 1-to-4 midpoint subdivision on triangle mesh + seam-safe vertex welding before multi-octave displacement.
 */
export function subdivideGeometry(geom: THREE.BufferGeometry, levels = 1): THREE.BufferGeometry {
  let g = geom.index ? geom.toNonIndexed() : geom.clone();
  for (let lv = 0; lv < levels; lv++) {
    const pos = g.attributes.position.array as Float32Array;
    const uv = g.attributes.uv ? (g.attributes.uv.array as Float32Array) : null;
    const triCount = Math.floor(pos.length / 9);
    const outPos = new Float32Array(triCount * 4 * 9);
    const outUv = uv ? new Float32Array(triCount * 4 * 6) : null;

    for (let t = 0; t < triCount; t++) {
      const pBase = t * 9;
      const ax = pos[pBase], ay = pos[pBase + 1], az = pos[pBase + 2];
      const bx = pos[pBase + 3], by = pos[pBase + 4], bz = pos[pBase + 5];
      const cx = pos[pBase + 6], cy = pos[pBase + 7], cz = pos[pBase + 8];

      const abx = (ax + bx) * 0.5, aby = (ay + by) * 0.5, abz = (az + bz) * 0.5;
      const bcx = (bx + cx) * 0.5, bcy = (by + cy) * 0.5, bcz = (bz + cz) * 0.5;
      const cax = (cx + ax) * 0.5, cay = (cy + ay) * 0.5, caz = (cz + az) * 0.5;

      const dBase = t * 36;
      const tris = [
        ax, ay, az, abx, aby, abz, cax, cay, caz,
        abx, aby, abz, bx, by, bz, bcx, bcy, bcz,
        cax, cay, caz, bcx, bcy, bcz, cx, cy, cz,
        abx, aby, abz, bcx, bcy, bcz, cax, cay, caz,
      ];
      outPos.set(tris, dBase);

      if (outUv && uv) {
        const uBase = t * 6;
        const au = uv[uBase], av = uv[uBase + 1];
        const bu = uv[uBase + 2], bv = uv[uBase + 3];
        const cu = uv[uBase + 4], cv = uv[uBase + 5];
        const abu = (au + bu) * 0.5, abv = (av + bv) * 0.5;
        const bcu = (bu + cu) * 0.5, bcv = (bv + cv) * 0.5;
        const cau = (cu + au) * 0.5, cav = (cv + av) * 0.5;
        outUv.set(
          [
            au, av, abu, abv, cau, cav,
            abu, abv, bu, bv, bcu, bcv,
            cau, cav, bcu, bcv, cu, cv,
            abu, abv, bcu, bcv, cau, cav,
          ],
          t * 24
        );
      }
    }
    const next = new THREE.BufferGeometry();
    next.setAttribute('position', new THREE.BufferAttribute(outPos, 3));
    if (outUv) next.setAttribute('uv', new THREE.BufferAttribute(outUv, 2));
    next.computeVertexNormals();
    g.dispose();
    g = next;
  }
  const indexed = mergeVertices(g, 1e-5);
  indexed.computeVertexNormals();
  g.dispose();
  return indexed;
}

/**
 * Layered multi-octave 3D displacement (low freq shape, mid lumps, high pores).
 */
export function displaceLayered3D(
  geom: THREE.BufferGeometry,
  opts: {
    lowFreq?: number;
    lowAmp?: number;
    midFreq?: number;
    midAmp?: number;
    highFreq?: number;
    highAmp?: number;
    seed?: number;
    maskFn?: (p: THREE.Vector3) => number;
  }
): THREE.BufferGeometry {
  if (!geom.attributes.normal) geom.computeVertexNormals();
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const norm = geom.attributes.normal as THREE.BufferAttribute;
  const seed = opts.seed ?? 303;
  const lowF = opts.lowFreq ?? 24;
  const lowA = opts.lowAmp ?? 0.002;
  const midF = opts.midFreq ?? 72;
  const midA = opts.midAmp ?? 0.001;
  const hiF = opts.highFreq ?? 190;
  const hiA = opts.highAmp ?? 0.0004;

  const p = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(norm, i);
    const m = opts.maskFn ? opts.maskFn(p) : 1.0;
    if (m <= 0) continue;

    const dLow = (fbm3(p.x * lowF, p.y * lowF, p.z * lowF, 3, seed) - 0.5) * 2 * lowA;
    const dMid = (ridged3(p.x * midF, p.y * midF, p.z * midF, 2, seed + 41) - 0.38) * 1.6 * midA;
    const dHi = (valueNoise3(p.x * hiF, p.y * hiF, p.z * hiF, seed + 89) - 0.5) * 2 * hiA;
    p.addScaledVector(n, (dLow + dMid + dHi) * m);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

/**
 * Ensures UV2 / normal correctness & enables glTF aoMap sampling if uv exists.
 */
export function enableAoUv(geom: THREE.BufferGeometry): THREE.BufferGeometry {
  if (geom.attributes.uv && !geom.attributes.uv1) {
    geom.setAttribute('uv1', geom.attributes.uv.clone());
  }
  return geom;
}

// ---------------- Botanical Thick Leaf Builder (>= 2% Thickness + 2-Sided Groups) ----------------

export type BotanicalLeafConfig = {
  length: number;
  width: number;
  thickness?: number;
  segU?: number;
  segV?: number;
  serrationCount?: number;
  serrationDepth?: number;
  arch?: number;
  cupping?: number;
  twist?: number;
  veinPairs?: number;
  puckerStrength?: number;
  lobeStyle?: 'mint' | 'cilantro' | 'bay';
  seed?: number;
};

/**
 * Builds an anatomical 2-material botanical leaf (group 0 = top cuticle, group 1 = matte back & rounded edge wall)
 * with serrated margin, concave midrib + 5-8 curved lateral veins, interveinal puffing, and >= 2% thickness.
 */
export function buildBotanicalThickLeaf(cfg: BotanicalLeafConfig): THREE.BufferGeometry {
  const L = cfg.length;
  const W = cfg.width;
  const T = Math.max(cfg.thickness ?? L * 0.026, L * 0.022);
  const segU = cfg.segU ?? 34; // along length (base -> tip)
  const segV = cfg.segV ?? 26; // across width (-1 -> +1)
  const serrCount = cfg.serrationCount ?? 13;
  const serrDepth = cfg.serrationDepth ?? 0.095;
  const arch = cfg.arch ?? 0.16 * L;
  const cup = cfg.cupping ?? 0.09 * W;
  const twist = cfg.twist ?? 0.08;
  const veinPairs = cfg.veinPairs ?? 6;
  const pucker = cfg.puckerStrength ?? 0.032 * W;
  const style = cfg.lobeStyle ?? 'mint';
  const seed = cfg.seed ?? 901;

  const evalHalfWidth = (u: number): number => {
    if (style === 'bay') {
      return Math.pow(Math.sin(Math.PI * Math.pow(u, 0.85)), 0.78) * W * 0.5;
    }
    if (style === 'cilantro') {
      // Fan-shaped 3-lobed deeply notched leaflet
      const baseEnv = Math.sin(Math.PI * Math.pow(u, 0.7)) * Math.pow(u, 0.35) * 1.15;
      const notch1 = 1 - 0.38 * Math.exp(-Math.pow((u - 0.42) / 0.09, 2));
      const notch2 = 1 - 0.3 * Math.exp(-Math.pow((u - 0.74) / 0.08, 2));
      const tooth = 1 + 0.13 * Math.sin(u * Math.PI * 18);
      return Math.max(0.0006, baseEnv * notch1 * notch2 * tooth * W * 0.5);
    }
    // Mint: ovate blade tapering nicely to acute apex with sharp sawtooth serrations
    const env = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.72)), 0.82) * (1 - 0.12 * u);
    const toothPhase = u * serrCount;
    const saw = toothPhase - Math.floor(toothPhase);
    // Asymmetric forward-pointing serration
    const serration = u > 0.12 && u < 0.96 ? (saw < 0.75 ? saw / 0.75 : 1 - (saw - 0.75) / 0.25) : 0;
    return Math.max(0.0005, env * W * 0.5 * (1 - serrDepth * (1 - serration)));
  };

  const cols = segV + 1;
  const rows = segU + 1;
  const perSideVerts = rows * cols;
  const positions = new Float32Array(perSideVerts * 2 * 3);
  const uvs = new Float32Array(perSideVerts * 2 * 2);

  for (let iu = 0; iu <= segU; iu++) {
    const u = iu / segU;
    const halfW = evalHalfWidth(u);
    const zBase = u * L;
    const yArch = Math.sin(u * Math.PI * 0.92) * arch - Math.pow(u, 2.3) * arch * 0.55;

    for (let iv = 0; iv <= segV; iv++) {
      const s = (iv / segV) * 2 - 1; // -1..+1 across leaf
      const absS = Math.abs(s);
      const xBase = s * halfW;

      // Midrib furrow + lateral arched vein grooves
      const midribGroove = -0.022 * W * Math.exp(-Math.pow(absS / 0.085, 2)) * (1 - 0.45 * u);
      const veinArg = (u - absS * 0.28) * veinPairs * Math.PI * 2;
      const veinWave = Math.sin(veinArg);
      const interveinalPuff =
        pucker * Math.max(0, 1 - Math.abs(veinWave)) * Math.sin(Math.PI * u) * smoothstep(0.06, 0.35, absS) * (1 - 0.3 * absS * absS);
      const finePucker = (fbm2(u * 14 + seed * 0.1, s * 10, 3, seed) - 0.5) * pucker * 0.45 * smoothstep(0.1, 0.4, absS);

      // Edge curl & cupped V-profile
      const yCup = cup * Math.pow(absS, 1.35) - cup * 0.32 * Math.pow(absS, 4.0);
      const edgeRipple = Math.sin(u * 26 + s * 2) * (0.0008 + T * 0.12) * Math.pow(absS, 2.2);

      // Twist along length
      const rotAng = twist * u * s;
      const yCenter = yArch + midribGroove + yCup + interveinalPuff + finePucker + edgeRipple + rotAng * 0.006;

      // Thickness tapers at sharp margin to a rounded bevel edge while staying >= T*0.55 on body
      const profileT = T * (0.35 + 0.65 * Math.sqrt(Math.max(0, 1 - Math.pow(absS, 2.4)))) * (1 - 0.35 * Math.pow(u, 2));
      const midribBumpUnderside = -midribGroove * 1.45; // protruding pale vein ridge underneath

      const topIdx = iu * cols + iv;
      const botIdx = perSideVerts + topIdx;

      positions[topIdx * 3] = xBase;
      positions[topIdx * 3 + 1] = yCenter + profileT * 0.5;
      positions[topIdx * 3 + 2] = zBase;

      positions[botIdx * 3] = xBase;
      positions[botIdx * 3 + 1] = yCenter - profileT * 0.5 - midribBumpUnderside;
      positions[botIdx * 3 + 2] = zBase;

      uvs[topIdx * 2] = s * 0.5 + 0.5;
      uvs[topIdx * 2 + 1] = u;
      uvs[botIdx * 2] = s * 0.5 + 0.5;
      uvs[botIdx * 2 + 1] = u;
    }
  }

  const topIndices: number[] = [];
  const botAndRimIndices: number[] = [];

  for (let iu = 0; iu < segU; iu++) {
    for (let iv = 0; iv < segV; iv++) {
      const a = iu * cols + iv;
      const b = (iu + 1) * cols + iv;
      const c = (iu + 1) * cols + (iv + 1);
      const d = iu * cols + (iv + 1);
      // Top winding (+Y up: (b-a)=+Z x (d-a)=+X -> +Y!)
      topIndices.push(a, b, d, b, c, d);
      // Bottom winding (-Y down)
      const ba = perSideVerts + a;
      const bb = perSideVerts + b;
      const bc = perSideVerts + c;
      const bd = perSideVerts + d;
      botAndRimIndices.push(ba, bd, bb, bb, bd, bc);
    }
  }

  // Stitch perimeter edges so leaf is solid closed manifold with visible thickness
  for (let iu = 0; iu < segU; iu++) {
    // Left rim (iv = 0, outward -X)
    const t0 = iu * cols;
    const t1 = (iu + 1) * cols;
    const b0 = perSideVerts + t0;
    const b1 = perSideVerts + t1;
    botAndRimIndices.push(t0, b0, t1, t1, b0, b1);

    // Right rim (iv = segV, outward +X)
    const rt0 = iu * cols + segV;
    const rt1 = (iu + 1) * cols + segV;
    const rb0 = perSideVerts + rt0;
    const rb1 = perSideVerts + rt1;
    botAndRimIndices.push(rt0, rt1, rb0, rt1, rb1, rb0);
  }

  const allIndices = [...topIndices, ...botAndRimIndices];
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geom.setIndex(allIndices);
  geom.clearGroups();
  geom.addGroup(0, topIndices.length, 0);
  geom.addGroup(topIndices.length, botAndRimIndices.length, 1);
  geom.computeVertexNormals();
  enableAoUv(geom);
  return geom;
}

// ---------------- Dew Droplets, Curved Basmati Grains & Onion Spirals ----------------

export function buildClearDropletGeometry(radius: number, segW = 20, segH = 14): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(radius, segW, segH);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    let y = pos.getY(i);
    const z = pos.getZ(i);
    // Contact-flattened lens sitting flush on leaf surface
    if (y < 0) {
      y *= 0.36;
    } else {
      y *= 0.82;
    }
    const radialStretch = 1 + Math.max(0, -y / (radius || 1)) * 0.14;
    pos.setXYZ(i, x * radialStretch, y + radius * 0.36, z * radialStretch);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

export function createDropletMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    name: 'dew-water-droplet',
    color: new THREE.Color(0xffffff),
    roughness: 0.025,
    metalness: 0.0,
    transmission: 0.94,
    ior: 1.333,
    thickness: 0.015,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.75,
  });
}

/**
 * Slender, organically bowed cooked basmati grain (~10mm x 1.9mm at 1m scale) with soft rounded tips.
 */
export function buildCurvedBasmatiGrain(
  length = 0.011,
  radius = 0.00115,
  bend = 0.0022,
  segLen = 12,
  segRad = 8
): THREE.BufferGeometry {
  const rings = segLen + 1;
  const cols = segRad + 1;
  const positions = new Float32Array(rings * cols * 3);
  const uvs = new Float32Array(rings * cols * 2);
  const indices: number[] = [];

  for (let i = 0; i <= segLen; i++) {
    const t = i / segLen; // 0..1
    const y = (t - 0.5) * length;
    const archX = Math.sin(t * Math.PI) * bend;
    // Soft organic grain profile (smooth sine taper, slightly plumper near bottom-middle)
    const rProfile = Math.pow(Math.sin(t * Math.PI), 0.52) * (1 + 0.12 * Math.sin((t - 0.25) * Math.PI));
    const r = Math.max(radius * 0.05, radius * rProfile);

    for (let j = 0; j <= segRad; j++) {
      const a = (j / segRad) * Math.PI * 2;
      // Subtle ventral longitudinal crease typical of basmati
      const crease = 1 - 0.11 * Math.pow(Math.max(0, Math.cos(a)), 6);
      const vx = archX + Math.cos(a) * r * crease;
      const vz = Math.sin(a) * r * 0.92;
      const idx = i * cols + j;
      positions[idx * 3] = vx;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = vz;
      uvs[idx * 2] = j / segRad;
      uvs[idx * 2 + 1] = t;
    }
  }

  for (let i = 0; i < segLen; i++) {
    for (let j = 0; j < segRad; j++) {
      const a = i * cols + j;
      const b = (i + 1) * cols + j;
      const c = (i + 1) * cols + (j + 1);
      const d = i * cols + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/**
 * Crispy curled fried onion slice: thin (~2.5% thickness) undulating ribbon along a spiral/crescent path
 * with blistered surface and pinched pointed ends.
 */
export function buildCrispCrinkledOnionStrip(opts: {
  radius: number;
  arcAngle: number;
  width: number;
  thickness?: number;
  curlLift?: number;
  seed?: number;
  segLen?: number;
  segWidth?: number;
}): THREE.BufferGeometry {
  const segL = opts.segLen ?? 34;
  const segW = opts.segWidth ?? 6;
  const thick = Math.max(opts.thickness ?? opts.width * 0.2, 0.00055);
  const lift = opts.curlLift ?? 0.006;
  const seed = opts.seed ?? 441;

  const cols = segW + 1;
  const rows = segL + 1;
  const perSide = rows * cols;
  const pos = new Float32Array(perSide * 2 * 3);
  const uv = new Float32Array(perSide * 2 * 2);

  for (let i = 0; i <= segL; i++) {
    const u = i / segL;
    const taper = Math.pow(Math.sin(u * Math.PI), 0.58);
    const theta = (u - 0.5) * opts.arcAngle;
    const crinkleR = (fbm2(u * 9, seed * 0.3, 3, seed) - 0.5) * opts.width * 1.1;
    const rad = opts.radius * (1 - 0.14 * u) + crinkleR;
    const cx = Math.cos(theta) * rad;
    const cz = Math.sin(theta) * rad;
    const cy = Math.sin(u * Math.PI * 1.6 + seed) * lift + (fbm2(u * 11, 2.2, 3, seed + 17) - 0.5) * lift * 0.7;

    // Ribbon normal radially outward + slight tilt twist
    const tilt = Math.sin(u * Math.PI * 2.5 + seed) * 0.45;
    const rx = Math.cos(theta) * Math.cos(tilt);
    const ry = Math.sin(tilt);
    const rz = Math.sin(theta) * Math.cos(tilt);
    // Width tangent roughly perpendicular
    const wx = -rx * 0.35;
    const wy = Math.cos(tilt);
    const wz = -rz * 0.35;

    for (let j = 0; j <= segW; j++) {
      const s = j / segW - 0.5;
      const wOff = s * opts.width * taper;
      const waveEdge = Math.sin(u * 26 + s * 4) * thick * 0.85 * Math.abs(s * 2);
      const tHalf = thick * 0.5 * (0.4 + 0.6 * Math.cos(s * Math.PI)) * taper;

      const xBase = cx + wx * wOff + rx * waveEdge;
      const yBase = cy + wy * wOff;
      const zBase = cz + wz * wOff + rz * waveEdge;

      const idxT = i * cols + j;
      const idxB = perSide + idxT;

      pos[idxT * 3] = xBase + rx * tHalf;
      pos[idxT * 3 + 1] = yBase + ry * tHalf;
      pos[idxT * 3 + 2] = zBase + rz * tHalf;

      pos[idxB * 3] = xBase - rx * tHalf;
      pos[idxB * 3 + 1] = yBase - ry * tHalf;
      pos[idxB * 3 + 2] = zBase - rz * tHalf;

      uv[idxT * 2] = u;
      uv[idxT * 2 + 1] = s + 0.5;
      uv[idxB * 2] = u;
      uv[idxB * 2 + 1] = s + 0.5;
    }
  }

  const idx: number[] = [];
  for (let i = 0; i < segL; i++) {
    for (let j = 0; j < segW; j++) {
      const a = i * cols + j;
      const b = (i + 1) * cols + j;
      const c = (i + 1) * cols + (j + 1);
      const d = i * cols + (j + 1);
      idx.push(a, d, b, b, d, c);
      const ba = perSide + a;
      const bb = perSide + b;
      const bc = perSide + c;
      const bd = perSide + d;
      idx.push(ba, bb, bd, bb, bc, bd);
    }
  }
  for (let i = 0; i < segL; i++) {
    const t0 = i * cols;
    const t1 = (i + 1) * cols;
    idx.push(t0, t1, perSide + t0, t1, perSide + t1, perSide + t0);
    const rt0 = i * cols + segW;
    const rt1 = (i + 1) * cols + segW;
    idx.push(rt0, perSide + rt0, rt1, rt1, perSide + rt0, perSide + rt1);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  enableAoUv(g);
  return g;
}
