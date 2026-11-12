import * as THREE from 'three';
import {
  buildClearDropletGeometry,
  buildPhotorealPbrTextures,
  clamp,
  createDropletMaterial,
  enableAoUv,
  fbm2,
  mergeGeomsSafe,
  mixRgb,
  PhotorealOptions,
  smoothstep,
} from '../../../../tools/shared/photoreal3d';

export function buildPhotorealChiliPod(opts: {
  maxRadius: number;
  curvePts: THREE.Vector3[];
  droplets?: THREE.BufferGeometry[];
  segAlong?: number;
  segRadial?: number;
}): { body: THREE.BufferGeometry; calyx: THREE.BufferGeometry } {
  const segU = opts.segAlong ?? 56;
  const segV = opts.segRadial ?? 32;
  const curve = new THREE.CatmullRomCurve3(opts.curvePts);
  const frames = curve.computeFrenetFrames(segU, false);

  const cols = segV + 1;
  const rows = segU + 1;
  const pos = new Float32Array(rows * cols * 3);
  const uv = new Float32Array(rows * cols * 2);
  const indices: number[] = [];

  for (let iu = 0; iu <= segU; iu++) {
    const t = iu / segU; // 0 = calyx shoulder -> 1 = pointed tip
    const pt = curve.getPointAt(t);
    const N = frames.normals[iu];
    const B = frames.binormals[iu];

    // Anatomical chili profile: cupped rounded shoulder -> plump taper -> acute curved tip
    const shoulder = t < 0.08 ? 0.36 + 0.64 * Math.sin((t / 0.08) * (Math.PI * 0.5)) : 1.0;
    const bodyEnv = t < 0.12 ? 1.0 : Math.pow(Math.max(0.002, 1 - (t - 0.12) / 0.88), 0.72);
    // Subtle pinch indentations along glossy pepper wall
    const crease = 1 + 0.03 * Math.sin(t * Math.PI * 5.0);

    for (let iv = 0; iv <= segV; iv++) {
      const a = (iv / segV) * Math.PI * 2;
      const lobe = 1 + 0.048 * Math.cos(a * 3) * (1 - t);
      const r = Math.max(0.0002, opts.maxRadius * shoulder * bodyEnv * lobe * crease);
      const vx = pt.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * r;
      const vy = pt.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * r;
      const vz = pt.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * r;
      const idx = iu * cols + iv;
      pos[idx * 3] = vx;
      pos[idx * 3 + 1] = vy;
      pos[idx * 3 + 2] = vz;
      uv[idx * 2] = iv / segV;
      uv[idx * 2 + 1] = t;
    }
  }

  for (let iu = 0; iu < segU; iu++) {
    for (let iv = 0; iv < segV; iv++) {
      const a = iu * cols + iv;
      const b = (iu + 1) * cols + iv;
      const c = (iu + 1) * cols + (iv + 1);
      const d = iu * cols + (iv + 1);
      indices.push(a, d, b, b, d, c);
    }
  }

  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  body.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  body.setIndex(indices);
  body.computeVertexNormals();
  enableAoUv(body);

  // Dew droplets sitting directly on glossy cuticle surface
  if (opts.droplets) {
    for (let i = 0; i < 16; i++) {
      const t = 0.14 + (i / 16) * 0.68;
      const pt = curve.getPointAt(t);
      const iu = Math.min(segU, Math.round(t * segU));
      const N = frames.normals[iu];
      const B = frames.binormals[iu];
      const rAt = opts.maxRadius * Math.pow(1 - (t - 0.12) / 0.88, 0.72);
      const ang = (i * 2.15) % (Math.PI * 2);
      const radDir = new THREE.Vector3().addScaledVector(N, Math.cos(ang)).addScaledVector(B, Math.sin(ang)).normalize();
      const surf = pt.clone().addScaledVector(radDir, rAt * 0.94);
      const radius = 0.001 + ((i * 7) % 5) * 0.00024;
      const dg = buildClearDropletGeometry(radius, 12, 8);
      dg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), radDir));
      dg.translate(surf.x, surf.y, surf.z);
      opts.droplets.push(dg);
    }
  }

  // Sculpted 5-sepal star calyx collar + graceful hooked curved woody green pedicel stem
  const p0 = curve.getPointAt(0);
  const tan0 = curve.getTangentAt(0);
  const stemBase = p0.clone().addScaledVector(tan0, -0.002);
  const stemDir = tan0.clone().negate();
  const up = new THREE.Vector3(0, 1, 0);
  const perp = new THREE.Vector3().crossVectors(stemDir, up).normalize();
  if (perp.lengthSq() < 0.01) perp.set(1, 0, 0);
  const perp2 = new THREE.Vector3().crossVectors(stemDir, perp).normalize();

  const calyxParts: THREE.BufferGeometry[] = [];
  const cap = new THREE.CylinderGeometry(opts.maxRadius * 0.68, opts.maxRadius * 0.36, 0.0048, 22, 4);
  cap.translate(stemBase.x, stemBase.y, stemBase.z);
  calyxParts.push(cap);

  for (let s = 0; s < 5; s++) {
    const a = (s / 5) * Math.PI * 2;
    const petal = new THREE.ConeGeometry(opts.maxRadius * 0.25, 0.0075, 8);
    petal.scale(1.2, 1.0, 0.32);
    petal.rotateX(Math.PI * 0.78);
    petal.rotateY(a);
    petal.translate(
      p0.x + (perp.x * Math.cos(a) + perp2.x * Math.sin(a)) * opts.maxRadius * 0.56,
      p0.y + 0.001,
      p0.z + (perp.z * Math.cos(a) + perp2.z * Math.sin(a)) * opts.maxRadius * 0.56
    );
    calyxParts.push(petal);
  }

  const stemCurve = new THREE.CatmullRomCurve3([
    stemBase.clone(),
    stemBase.clone().addScaledVector(stemDir, 0.011).addScaledVector(perp, 0.003),
    stemBase.clone().addScaledVector(stemDir, 0.021).addScaledVector(perp, 0.011).add(new THREE.Vector3(0, 0.005, 0)),
    stemBase.clone().addScaledVector(stemDir, 0.025).addScaledVector(perp, 0.018).add(new THREE.Vector3(0, 0.007, 0)),
  ]);
  const stem = new THREE.TubeGeometry(stemCurve, 22, opts.maxRadius * 0.22, 12, false);
  calyxParts.push(stem);

  const calyx = mergeGeomsSafe(calyxParts);
  for (const g of calyxParts) g.dispose();
  enableAoUv(calyx);

  return { body, calyx };
}

export function createGreenChiliModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'green-chili';

  const texSize = options.textureSize ?? 1024;

  // Sampled palette: rich emerald green #264b01 / #4e7801 -> crisp highlight #729b00 / #a2ba42
  const skinTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const m = fbm2(u * 14, v * 12, 4, 51);
      const stria = Math.sin(v * 34 + m * 2.5) * 0.5 + 0.5;
      let rgb = mixRgb([34, 86, 4], [108, 152, 8], clamp(0.32 + m * 0.45 + stria * 0.22, 0, 1));
      rgb = mixRgb(rgb, [162, 192, 54], smoothstep(0.65, 0.94, m) * 0.45);
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: m * 0.45 + stria * 0.18,
        rough: clamp(0.08 + (1 - m) * 0.14, 0.06, 0.26),
        ao: clamp(0.84 + 0.16 * m, 0.72, 1.0),
      };
    },
    { normalStrength: 1.8 }
  );

  const chiliMat = new THREE.MeshPhysicalMaterial({
    name: 'glossy-green-chili-skin',
    map: skinTex.albedoMap,
    normalMap: skinTex.normalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    aoMap: skinTex.ormMap,
    roughnessMap: skinTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.94,
    clearcoatRoughness: 0.06,
    wireframe: options.wireframe ?? false,
  });

  const calyxMat = new THREE.MeshPhysicalMaterial({
    name: 'chili-calyx-stem',
    color: new THREE.Color(0x3e6e0e),
    roughness: 0.48,
    sheen: 0.2,
    wireframe: options.wireframe ?? false,
  });

  const dropParts: THREE.BufferGeometry[] = [];
  const pod = buildPhotorealChiliPod({
    maxRadius: 0.0086,
    curvePts: [
      new THREE.Vector3(-0.028, 0.015, 0.0),
      new THREE.Vector3(-0.011, 0.002, 0.002),
      new THREE.Vector3(0.012, -0.005, 0.001),
      new THREE.Vector3(0.036, -0.002, -0.002),
    ],
    droplets: dropParts,
    segAlong: 96,
    segRadial: 44,
  });

  const bMesh = new THREE.Mesh(pod.body, chiliMat);
  bMesh.name = 'green-chili-pod';
  bMesh.castShadow = options.castShadow ?? true;
  bMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(bMesh);

  const cMesh = new THREE.Mesh(pod.calyx, calyxMat);
  cMesh.name = 'green-chili-calyx';
  cMesh.castShadow = options.castShadow ?? true;
  root.add(cMesh);

  if (dropParts.length > 0) {
    const dMerged = mergeGeomsSafe(dropParts);
    for (const g of dropParts) g.dispose();
    root.add(new THREE.Mesh(dMerged, createDropletMaterial()));
  }

  return root;
}

export default createGreenChiliModel;
