import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type ProceduralModelOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  textureSize?: number;
};

export type ProceduralModelRuntime = {
  nodes: Record<string, THREE.Object3D>;
  meshes: Record<string, THREE.Mesh>;
  sockets: Record<string, THREE.Object3D>;
  colliders: Record<string, unknown>;
  destructionGroups: Record<string, THREE.Object3D[]>;
};

export function seededHash(x: number, y: number, seed = 1337): number {
  let h = Math.imul((x | 0) ^ seed, 374761393) + Math.imul((y | 0) ^ (seed * 3), 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function createRng(seed = 1337): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function valueNoise2D(x: number, y: number, seed = 101): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = seededHash(ix, iy, seed);
  const b = seededHash(ix + 1, iy, seed);
  const c = seededHash(ix, iy + 1, seed);
  const d = seededHash(ix + 1, iy + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm2D(x: number, y: number, octaves = 4, seed = 101): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1.0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2D(x * freq, y * freq, seed + i * 71);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / (norm || 1);
}

/**
 * Safely merge an array of BufferGeometries (normalizing attributes so mergeGeometries never returns null).
 */
export function mergeGeomsSafe(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geoms.length === 0) return new THREE.BufferGeometry();
  const prepped = geoms.map((g) => {
    const c = g.index ? g.toNonIndexed() : g.clone();
    if (!c.attributes.normal) c.computeVertexNormals();
    if (!c.attributes.uv) {
      const count = c.attributes.position.count;
      c.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    // Keep position, normal, uv (and color if ALL have color)
    const hasAllColor = geoms.every((x) => Boolean(x.attributes.color));
    if (!hasAllColor && c.attributes.color) c.deleteAttribute('color');
    return c;
  });
  const merged = mergeGeometries(prepped, false);
  for (const p of prepped) p.dispose();
  return merged ?? geoms[0].clone();
}

/**
 * Bake many transformed copies of a base BufferGeometry into one standard Mesh-ready BufferGeometry
 * (much safer for GLTFExporter & Box3 than InstancedMesh across viewers).
 */
export function bakeTransforms(
  baseGeom: THREE.BufferGeometry,
  transforms: { pos: THREE.Vector3; quat?: THREE.Quaternion; scale?: THREE.Vector3; color?: THREE.Color }[]
): THREE.BufferGeometry {
  const nonIdx = baseGeom.index ? baseGeom.toNonIndexed() : baseGeom.clone();
  if (!nonIdx.attributes.normal) nonIdx.computeVertexNormals();
  const vCount = nonIdx.attributes.position.count;
  const totalVerts = vCount * transforms.length;

  const srcPos = nonIdx.attributes.position.array as Float32Array;
  const srcNorm = nonIdx.attributes.normal.array as Float32Array;
  const srcUv = nonIdx.attributes.uv ? (nonIdx.attributes.uv.array as Float32Array) : null;

  const outPos = new Float32Array(totalVerts * 3);
  const outNorm = new Float32Array(totalVerts * 3);
  const outUv = new Float32Array(totalVerts * 2);
  const hasColors = transforms.some((t) => Boolean(t.color));
  const outCol = hasColors ? new Float32Array(totalVerts * 3) : null;

  const mat = new THREE.Matrix4();
  const nMat = new THREE.Matrix3();
  const pVec = new THREE.Vector3();
  const nVec = new THREE.Vector3();
  const defQ = new THREE.Quaternion();
  const defS = new THREE.Vector3(1, 1, 1);

  for (let i = 0; i < transforms.length; i++) {
    const tr = transforms[i];
    mat.compose(tr.pos, tr.quat ?? defQ, tr.scale ?? defS);
    nMat.getNormalMatrix(mat);
    const baseV = i * vCount;
    const cr = tr.color ? tr.color.r : 1;
    const cg = tr.color ? tr.color.g : 1;
    const cb = tr.color ? tr.color.b : 1;

    for (let v = 0; v < vCount; v++) {
      const s3 = v * 3;
      const d3 = (baseV + v) * 3;
      pVec.set(srcPos[s3], srcPos[s3 + 1], srcPos[s3 + 2]).applyMatrix4(mat);
      nVec.set(srcNorm[s3], srcNorm[s3 + 1], srcNorm[s3 + 2]).applyMatrix3(nMat).normalize();

      outPos[d3] = pVec.x;
      outPos[d3 + 1] = pVec.y;
      outPos[d3 + 2] = pVec.z;
      outNorm[d3] = nVec.x;
      outNorm[d3 + 1] = nVec.y;
      outNorm[d3 + 2] = nVec.z;

      if (srcUv) {
        outUv[(baseV + v) * 2] = srcUv[v * 2];
        outUv[(baseV + v) * 2 + 1] = srcUv[v * 2 + 1];
      }
      if (outCol) {
        outCol[d3] = cr;
        outCol[d3 + 1] = cg;
        outCol[d3 + 2] = cb;
      }
    }
  }

  nonIdx.dispose();
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(outPos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(outNorm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(outUv, 2));
  if (outCol) out.setAttribute('color', new THREE.BufferAttribute(outCol, 3));
  return out;
}

/**
 * Create a curved Tube-like swept ribbon/stem with variable radius along a CatmullRomCurve3.
 */
export function buildTaperedTube(
  points: THREE.Vector3[],
  radiusFn: (t: number, angle: number) => number,
  tubularSegments = 32,
  radialSegments = 12,
  capEnds = true
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const P = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const angle = v * Math.PI * 2;
      const r = Math.max(0.00015, radiusFn(t, angle));
      const sin = Math.sin(angle);
      const cos = -Math.cos(angle);
      const nx = cos * N.x + sin * B.x;
      const ny = cos * N.y + sin * B.y;
      const nz = cos * N.z + sin * B.z;
      verts.push(P.x + r * nx, P.y + r * ny, P.z + r * nz);
      uvs.push(t, v);
    }
  }

  const rowStride = radialSegments + 1;
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * rowStride + j;
      const b = (i + 1) * rowStride + j;
      const c = (i + 1) * rowStride + (j + 1);
      const d = i * rowStride + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  if (capEnds) {
    const startCenterIdx = verts.length / 3;
    const P0 = curve.getPointAt(0);
    verts.push(P0.x, P0.y, P0.z);
    uvs.push(0, 0.5);
    for (let j = 0; j < radialSegments; j++) {
      indices.push(startCenterIdx, j, j + 1);
    }
    const endCenterIdx = verts.length / 3;
    const P1 = curve.getPointAt(1);
    verts.push(P1.x, P1.y, P1.z);
    uvs.push(1, 0.5);
    const base = tubularSegments * rowStride;
    for (let j = 0; j < radialSegments; j++) {
      indices.push(endCenterIdx, base + j + 1, base + j);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Create a curved botanical leaf blade in XY/XZ plane with width profile, midrib fold, arch bend & serrated margins.
 */
export function buildBotanicalLeaf(opts: {
  length: number;
  maxWidth: number;
  uSegs?: number;
  vSegs?: number;
  serrationCount?: number;
  serrationDepth?: number;
  archHeight?: number;
  vFoldDepth?: number;
  twist?: number;
  waveAmp?: number;
  seed?: number;
  widthProfile?: (u: number) => number;
}): THREE.BufferGeometry {
  const uSegs = opts.uSegs ?? 20;
  const vSegs = opts.vSegs ?? 10;
  const serCount = opts.serrationCount ?? 10;
  const serDepth = opts.serrationDepth ?? 0.08;
  const archH = opts.archHeight ?? 0.012;
  const vFold = opts.vFoldDepth ?? 0.004;
  const twist = opts.twist ?? 0.15;
  const waveAmp = opts.waveAmp ?? 0.002;
  const seed = opts.seed ?? 77;
  const widthFn =
    opts.widthProfile ??
    ((u: number) => Math.sin(Math.pow(u, 0.72) * Math.PI) * (0.45 + 0.55 * Math.sin(u * Math.PI * 0.9)));

  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iu = 0; iu <= uSegs; iu++) {
    const u = iu / uSegs;
    const baseZ = u * opts.length;
    const wBase = widthFn(u) * opts.maxWidth * 0.5;
    // Serration tooth wave along leaf edge
    const serWave = serCount > 0 ? Math.abs(Math.sin(u * serCount * Math.PI)) * serDepth * Math.sin(u * Math.PI) : 0;
    const halfW = wBase * (1 + serWave);
    const centerY = Math.sin(u * Math.PI * 0.92) * archH - u * u * archH * 0.55;
    const rotT = (u - 0.3) * twist;

    for (let iv = 0; iv <= vSegs; iv++) {
      const vFrac = iv / vSegs;
      const side = (vFrac - 0.5) * 2; // -1..1
      const localX = side * halfW;
      // Midrib V-crease + quilted vein puffiness
      const veinRipple = Math.sin(u * 14 * Math.PI) * (1 - Math.abs(side) * 0.4) * Math.abs(side) * waveAmp;
      const nOffset = (valueNoise2D(u * 5, side * 3, seed) - 0.5) * waveAmp * 1.4;
      const localY = centerY + Math.abs(side) * vFold - side * side * vFold * 0.3 + veinRipple + nOffset;

      const c = Math.cos(rotT);
      const s = Math.sin(rotT);
      const x = localX * c - localY * s;
      const y = localX * s + localY * c;

      verts.push(x, y, baseZ);
      uvs.push(vFrac, u);
    }
  }

  const stride = vSegs + 1;
  for (let iu = 0; iu < uSegs; iu++) {
    for (let iv = 0; iv < vSegs; iv++) {
      const a = iu * stride + iv;
      const b = (iu + 1) * stride + iv;
      const c = (iu + 1) * stride + (iv + 1);
      const d = iu * stride + (iv + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Create a curved teardrop/oval curved Basmati rice grain geometry.
 */
export function buildRiceGrainGeom(length = 0.0115, radius = 0.00145, bend = 0.0012, segU = 10, segR = 7): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    pts.push(new THREE.Vector3(Math.sin(t * Math.PI) * bend, 0, (t - 0.5) * length));
  }
  return buildTaperedTube(
    pts,
    (t) => radius * Math.pow(Math.sin(Math.max(0.01, Math.min(0.99, t)) * Math.PI), 0.65),
    segU,
    segR,
    false
  );
}

/**
 * Generate CanvasTexture triple { albedoMap, normalMap, roughnessMap } from pixel shader callback.
 */
export function buildPbrCanvasTextures(
  size: number,
  pixelFn: (u: number, v: number, x: number, y: number) => { r: number; g: number; b: number; h: number; rough: number; a?: number },
  opts?: { normalStrength?: number; wrapS?: THREE.Wrapping; wrapT?: THREE.Wrapping; alphaTest?: boolean }
): { albedoMap: THREE.CanvasTexture; normalMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const aCanvas = document.createElement('canvas');
  const nCanvas = document.createElement('canvas');
  const rCanvas = document.createElement('canvas');
  aCanvas.width = nCanvas.width = rCanvas.width = size;
  aCanvas.height = nCanvas.height = rCanvas.height = size;

  const aCtx = aCanvas.getContext('2d')!;
  const nCtx = nCanvas.getContext('2d')!;
  const rCtx = rCanvas.getContext('2d')!;
  const aImg = aCtx.createImageData(size, size);
  const nImg = nCtx.createImageData(size, size);
  const rImg = rCtx.createImageData(size, size);
  const hField = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    const v = y / (size - 1 || 1);
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1 || 1);
      const px = pixelFn(u, v, x, y);
      hField[y * size + x] = px.h;
      const idx = (y * size + x) * 4;
      aImg.data[idx] = Math.max(0, Math.min(255, Math.round(px.r)));
      aImg.data[idx + 1] = Math.max(0, Math.min(255, Math.round(px.g)));
      aImg.data[idx + 2] = Math.max(0, Math.min(255, Math.round(px.b)));
      aImg.data[idx + 3] = px.a !== undefined ? Math.max(0, Math.min(255, Math.round(px.a))) : 255;

      const rb = Math.max(0, Math.min(255, Math.round(px.rough * 255)));
      rImg.data[idx] = rb;
      rImg.data[idx + 1] = rb;
      rImg.data[idx + 2] = rb;
      rImg.data[idx + 3] = 255;
    }
  }

  const strength = opts?.normalStrength ?? 4.0;
  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;
      const dx = (hField[y * size + xp] - hField[y * size + xm]) * strength;
      const dy = (hField[yp * size + x] - hField[ym * size + x]) * strength;
      let nx = -dx;
      let ny = -dy;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      const idx = (y * size + x) * 4;
      nImg.data[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      nImg.data[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nImg.data[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      nImg.data[idx + 3] = 255;
    }
  }

  aCtx.putImageData(aImg, 0, 0);
  nCtx.putImageData(nImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const albedoMap = new THREE.CanvasTexture(aCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.wrapS = opts?.wrapS ?? THREE.RepeatWrapping;
  albedoMap.wrapT = opts?.wrapT ?? THREE.RepeatWrapping;

  const normalMap = new THREE.CanvasTexture(nCanvas);
  normalMap.wrapS = albedoMap.wrapS;
  normalMap.wrapT = albedoMap.wrapT;

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = albedoMap.wrapS;
  roughnessMap.wrapT = albedoMap.wrapT;

  return { albedoMap, normalMap, roughnessMap };
}

export function makeWaterDroplets(
  placements: { pos: THREE.Vector3; normal?: THREE.Vector3; radius: number }[],
  wireframe = false
): THREE.Mesh {
  const baseSphere = new THREE.IcosahedronGeometry(1, 1);
  const transforms = placements.map((p) => {
    const q = new THREE.Quaternion();
    if (p.normal) {
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.normal.clone().normalize());
    }
    return {
      pos: p.pos,
      quat: q,
      scale: new THREE.Vector3(p.radius, p.radius * 0.65, p.radius),
    };
  });
  const geom = bakeTransforms(baseSphere, transforms);
  baseSphere.dispose();
  const mat = new THREE.MeshPhysicalMaterial({
    name: 'dew-water-droplets',
    color: new THREE.Color(0xeef9ff),
    roughness: 0.04,
    metalness: 0.0,
    transmission: 0.65,
    ior: 1.333,
    transparent: true,
    opacity: 0.85,
    wireframe,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.name = 'water-droplets';
  return mesh;
}
