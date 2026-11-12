import * as THREE from 'three';
import {
  bakeInstanceTransforms,
  buildCurvedBasmatiGrain,
  buildPhotorealPbrTextures,
  clamp,
  createSeededRng,
  enableAoUv,
  fbm2,
  mixRgb,
  smoothstep,
} from '../../../../tools/shared/photoreal3d';

export interface PhotorealOptions {
  textureSize?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  wireframe?: boolean;
}

export function createBasmatiRiceClusterModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'basmati-rice-cluster';

  const rng = createSeededRng(3301);
  const texSize = options.textureSize ?? 512;

  // Fine cooked basmati starch surface micro-pitting & ventral groove
  const riceTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const groove = Math.exp(-Math.pow((v - 0.5) * 6.5, 2)) * 0.22;
      const micro = fbm2(u * 28, v * 16, 4, 19);
      const sheenPatch = smoothstep(0.35, 0.78, fbm2(u * 12, v * 12, 3, 55));
      const rgb = mixRgb([224, 212, 194], [250, 245, 236], clamp(0.35 + micro * 0.55 - groove * 0.4, 0, 1));
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: micro * 0.32 - groove * 0.55,
        rough: clamp(0.14 + groove * 0.24 + (1 - sheenPatch) * 0.14, 0.10, 0.48),
        ao: clamp(0.76 + 0.24 * (1 - groove), 0.54, 1.0),
      };
    },
    { normalStrength: 2.2 }
  );

  const riceMat = new THREE.MeshPhysicalMaterial({
    name: 'ivory-basmati',
    map: riceTex.albedoMap,
    normalMap: riceTex.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    aoMap: riceTex.ormMap,
    aoMapIntensity: 0.6,
    roughnessMap: riceTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.44,
    clearcoatRoughness: 0.16,
    sheen: 0.14,
    sheenColor: new THREE.Color(0xfff6e0),
    vertexColors: true,
    wireframe: options.wireframe ?? false,
  });

  // 210 Solid-Core Filled + Flying Long Curved Basmati Grains (~22,680 tris, zero center hole)
  const grainProto = buildCurvedBasmatiGrain(0.0155, 0.00172, 0.0018, 9, 6);
  const transforms: { pos: THREE.Vector3; quat: THREE.Quaternion; scale: THREE.Vector3; color: THREE.Color }[] = [];

  const ivoryWhite = new THREE.Color().setStyle('#f5eee3', THREE.SRGBColorSpace);
  const creamWhite = new THREE.Color().setStyle('#e2cba8', THREE.SRGBColorSpace);
  const turmericGold = new THREE.Color().setStyle('#eeaf26', THREE.SRGBColorSpace);
  const saffronAmber = new THREE.Color().setStyle('#cc6c12', THREE.SRGBColorSpace);

  const totalGrains = 210;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < totalGrains; i++) {
    // 80% dense packed ovoid cluster core + 20% tossed flying peripheral grains
    const isOuter = i >= 168;
    const u = rng();
    const v = rng();
    const cosPhi = u * 2 - 1;
    const sinPhi = Math.sqrt(Math.max(0, 1 - cosPhi * cosPhi));
    const theta = i * goldenAngle + (rng() - 0.5) * 0.4;
    const r = isOuter ? 0.025 + Math.pow(v, 0.6) * 0.016 : Math.pow(v, 0.42) * 0.023;

    const pos = new THREE.Vector3(sinPhi * Math.cos(theta) * r * 1.15, cosPhi * r * 0.85, sinPhi * Math.sin(theta) * r * 1.15);

    const baseDir = new THREE.Vector3(
      pos.x * 0.6 + (rng() - 0.5) * 0.8,
      0.55 + (rng() - 0.5) * 0.9,
      pos.z * 0.6 + (rng() - 0.5) * 0.8
    ).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), baseDir);
    quat.multiply(
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler((rng() - 0.5) * 0.8, (rng() - 0.5) * 0.8, (rng() - 0.5) * 0.8)
      )
    );

    const sc = 0.84 + rng() * 0.34;
    const roll = rng();
    const col =
      roll < 0.64
        ? ivoryWhite.clone().lerp(creamWhite, rng())
        : roll < 0.88
        ? creamWhite.clone().lerp(turmericGold, 0.65 + rng() * 0.35)
        : turmericGold.clone().lerp(saffronAmber, rng() * 0.85);

    transforms.push({
      pos,
      quat,
      scale: new THREE.Vector3(sc, sc, sc * (0.94 + rng() * 0.24)),
      color: col,
    });
  }

  const bakedGeom = bakeInstanceTransforms(grainProto, transforms);
  grainProto.dispose();
  enableAoUv(bakedGeom);

  const mesh = new THREE.Mesh(bakedGeom, riceMat);
  mesh.name = 'rice-grain-cloud';
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  root.add(mesh);

  return root;
}

export default createBasmatiRiceClusterModel;
