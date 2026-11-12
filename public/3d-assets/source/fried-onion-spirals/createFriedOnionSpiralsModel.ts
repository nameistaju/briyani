import * as THREE from 'three';
import {
  buildCrispCrinkledOnionStrip,
  buildPhotorealPbrTextures,
  clamp,
  createSeededRng,
  displaceLayered3D,
  enableAoUv,
  fbm2,
  mergeGeomsSafe,
  mixRgb,
  smoothstep,
  worley2,
} from '../../../../tools/shared/photoreal3d';

export interface PhotorealOptions {
  textureSize?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  wireframe?: boolean;
}

export function createFriedOnionSpiralsModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'fried-onion-spirals';

  const rng = createSeededRng(65432);
  const texSize = options.textureSize ?? 1024;

  // Sampled palette: crisp burnt edge #2b0d00 -> spiced caramel #b22c03 -> golden birista #fa8a03 -> cream rim #d5896b
  const spiralTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const fibers = Math.sin(u * 115 + fbm2(u * 10, v * 10, 3, 21) * 3.2) * 0.5 + 0.5;
      const blister = worley2(u * 26, v * 26, 71).f1;
      const macro = fbm2(u * 12, v * 12, 4, 41);
      const edgeChar = smoothstep(0.24, 0.48, Math.abs(v - 0.5));

      let rgb = mixRgb([196, 86, 12], [244, 152, 46], clamp(0.32 + macro * 0.45 + fibers * 0.25, 0, 1));
      rgb = mixRgb(rgb, [54, 14, 2], clamp(edgeChar * 0.78 + smoothstep(0.68, 0.25, blister) * 0.28, 0, 0.94));
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: macro * 0.55 + fibers * 0.3 + blister * 0.2,
        rough: clamp(0.28 + (1 - macro) * 0.28 + edgeChar * 0.22, 0.2, 0.78),
        ao: clamp(0.62 + 0.38 * fibers - edgeChar * 0.2, 0.4, 1.0),
      };
    },
    { normalStrength: 3.6 }
  );

  const spiralMat = new THREE.MeshPhysicalMaterial({
    name: 'onion-spiral-gold',
    map: spiralTex.albedoMap,
    normalMap: spiralTex.normalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    aoMap: spiralTex.ormMap,
    aoMapIntensity: 0.75,
    roughnessMap: spiralTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.36,
    clearcoatRoughness: 0.24,
    sheen: 0.16,
    sheenColor: new THREE.Color(0xf59d38),
    vertexColors: true,
    wireframe: options.wireframe ?? false,
  });

  const gold = new THREE.Color().setStyle('#f29c2b', THREE.SRGBColorSpace);
  const amber = new THREE.Color().setStyle('#9e3406', THREE.SRGBColorSpace);
  const darkTip = new THREE.Color().setStyle('#3b1001', THREE.SRGBColorSpace);

  const parts: THREE.BufferGeometry[] = [];

  // 26 Sculpted Helical/Arching Crispy Caramelized Onion Spirals with >=2% thickness (~16,500 tris)
  for (let i = 0; i < 26; i++) {
    const strip = buildCrispCrinkledOnionStrip({
      radius: 0.011 + rng() * 0.014,
      arcAngle: 1.9 + rng() * 1.8,
      width: 0.0042 + rng() * 0.0022,
      thickness: 0.00085, // >= 2%
      curlLift: 0.008 + rng() * 0.014,
      seed: 200 + i * 19,
      segLen: 26,
      segWidth: 4,
    });
    const m4 = new THREE.Matrix4().compose(
      new THREE.Vector3((rng() - 0.5) * 0.056, (rng() - 0.5) * 0.040, (rng() - 0.5) * 0.052),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI)),
      new THREE.Vector3(1, 1, 1)
    );
    strip.applyMatrix4(m4);

    const uv = strip.attributes.uv;
    const cols = new Float32Array(strip.attributes.position.count * 3);
    const midCol = gold.clone().lerp(amber, rng() * 0.72);
    for (let v = 0; v < strip.attributes.position.count; v++) {
      const tipFade = Math.pow(Math.abs(uv.getX(v) - 0.5) * 2, 2.1);
      const c = midCol.clone().lerp(darkTip, tipFade * 0.88);
      cols[v * 3] = c.r;
      cols[v * 3 + 1] = c.g;
      cols[v * 3 + 2] = c.b;
    }
    strip.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    parts.push(strip);
  }

  // 16 Crisp Small Fried Onion Shards/Flakes floating outward
  for (let k = 0; k < 16; k++) {
    const cr = subdivideAndNoiseCrumb(0.0024 + rng() * 0.0014, 900 + k);
    cr.scale(1.6, 0.55, 0.85);
    cr.rotateX(rng() * 6);
    cr.rotateY(rng() * 6);
    cr.translate((rng() - 0.5) * 0.095, (rng() - 0.5) * 0.072, (rng() - 0.5) * 0.085);
    const cols = new Float32Array(cr.attributes.position.count * 3);
    const fc = k % 2 === 0 ? amber : darkTip;
    for (let v = 0; v < cr.attributes.position.count; v++) {
      cols[v * 3] = fc.r;
      cols[v * 3 + 1] = fc.g;
      cols[v * 3 + 2] = fc.b;
    }
    cr.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    parts.push(cr);
  }

  const merged = mergeGeomsSafe(parts);
  for (const g of parts) g.dispose();
  enableAoUv(merged);

  const mesh = new THREE.Mesh(merged, spiralMat);
  mesh.name = 'helical-onion-coils';
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  root.add(mesh);

  return root;
}

function subdivideAndNoiseCrumb(r: number, seed: number): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(r, 1);
  displaceLayered3D(g, { lowFreq: 220, lowAmp: r * 0.35, midFreq: 480, midAmp: r * 0.16, seed });
  enableAoUv(g);
  return g;
}

export default createFriedOnionSpiralsModel;
