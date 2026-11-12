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
  smoothstep,
} from '../../../../tools/shared/photoreal3d';

export interface PhotorealOptions {
  textureSize?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  wireframe?: boolean;
}

/**
 * Builds one thick red-onion ring cleanly split into:
 * - epidermisSkin (deep ruby-magenta outer skin shell)
 * - cutLayers (crisp translucent white-violet annular flesh with subtle magenta membrane rims)
 */
function buildSculptedOnionRing(
  outerR: number,
  thickness: number,
  height: number,
  arcStart: number,
  arcLen: number,
  seedVal: number
): { skin: THREE.BufferGeometry; flesh: THREE.BufferGeometry; dropAnchors: THREE.Vector3[] } {
  const segU = 112;
  const innerR = Math.max(outerR * 0.42, outerR - thickness);
  const halfH = height * 0.5;
  const isFullRing = arcLen >= Math.PI * 1.98;

  const skinVerts: number[] = [];
  const skinUvs: number[] = [];
  const skinIdx: number[] = [];

  const fleshVerts: number[] = [];
  const fleshUvs: number[] = [];
  const fleshIdx: number[] = [];

  const pushQuad = (
    vArr: number[],
    uArr: number[],
    iArr: number[],
    p0: THREE.Vector3,
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    p3: THREE.Vector3,
    uv0: [number, number],
    uv1: [number, number],
    uv2: [number, number],
    uv3: [number, number]
  ) => {
    const base = vArr.length / 3;
    vArr.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
    uArr.push(uv0[0], uv0[1], uv1[0], uv1[1], uv2[0], uv2[1], uv3[0], uv3[1]);
    iArr.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  for (let iu = 0; iu < segU; iu++) {
    const f0 = iu / segU;
    const f1 = (iu + 1) / segU;
    const a0 = arcStart + f0 * arcLen;
    const a1 = arcStart + f1 * arcLen;

    const evalPts = (a: number, f: number) => {
      const wobble = 1 + 0.03 * Math.cos(a * 3 + seedVal) + 0.015 * Math.sin(a * 5 + seedVal * 0.7);
      const lift = (fbm2(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 3, seedVal) - 0.5) * 0.0014;
      const rOut = outerR * wobble;
      const rIn = innerR * wobble;
      const rMid = rOut - (rOut - rIn) * 0.24;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      return {
        // 4 outer -> inner ring cross-section corners
        oTop: new THREE.Vector3(ca * rOut, halfH + lift, sa * rOut),
        oBot: new THREE.Vector3(ca * rOut, -halfH + lift, sa * rOut),
        mTop: new THREE.Vector3(ca * rMid, halfH + 0.00025 + lift, sa * rMid),
        mBot: new THREE.Vector3(ca * rMid, -halfH - 0.00025 + lift, sa * rMid),
        iTop: new THREE.Vector3(ca * rIn, halfH + lift, sa * rIn),
        iBot: new THREE.Vector3(ca * rIn, -halfH + lift, sa * rIn),
        f,
      };
    };

    const s0 = evalPts(a0, f0);
    const s1 = evalPts(a1, f1);

    // Outer magenta epidermis wall + outer beveled top/bottom magenta rim band
    pushQuad(skinVerts, skinUvs, skinIdx, s0.oBot, s0.oTop, s1.oTop, s1.oBot, [f0, 0.2], [f0, 0.8], [f1, 0.8], [f1, 0.2]);
    pushQuad(skinVerts, skinUvs, skinIdx, s0.oTop, s0.mTop, s1.mTop, s1.oTop, [f0, 0.82], [f0, 0.96], [f1, 0.96], [f1, 0.82]);
    pushQuad(skinVerts, skinUvs, skinIdx, s0.mBot, s0.oBot, s1.oBot, s1.mBot, [f0, 0.04], [f0, 0.18], [f1, 0.18], [f1, 0.04]);

    // Inner bright lavender-white crisp annular onion flesh faces + inner wall
    pushQuad(fleshVerts, fleshUvs, fleshIdx, s0.mTop, s0.iTop, s1.iTop, s1.mTop, [f0, 0.2], [f0, 0.85], [f1, 0.85], [f1, 0.2]);
    pushQuad(fleshVerts, fleshUvs, fleshIdx, s0.iBot, s0.mBot, s1.mBot, s1.iBot, [f0, 0.2], [f0, 0.85], [f1, 0.85], [f1, 0.2]);
    pushQuad(fleshVerts, fleshUvs, fleshIdx, s0.iTop, s0.iBot, s1.iBot, s1.iTop, [f0, 0.15], [f0, 0.85], [f1, 0.85], [f1, 0.15]);

    if (!isFullRing && iu === 0) {
      pushQuad(fleshVerts, fleshUvs, fleshIdx, s0.oBot, s0.iBot, s0.iTop, s0.oTop, [0, 0], [1, 0], [1, 1], [0, 1]);
    }
    if (!isFullRing && iu === segU - 1) {
      pushQuad(fleshVerts, fleshUvs, fleshIdx, s1.oTop, s1.iTop, s1.iBot, s1.oBot, [0, 0], [1, 0], [1, 1], [0, 1]);
    }
  }

  const makeGeom = (v: number[], u: number[], ix: number[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
    g.setIndex(ix);
    g.computeVertexNormals();
    enableAoUv(g);
    return g;
  };

  const dropAnchors = [
    new THREE.Vector3(Math.cos(arcStart + arcLen * 0.22) * (outerR * 0.96), halfH + 0.0005, Math.sin(arcStart + arcLen * 0.22) * (outerR * 0.96)),
    new THREE.Vector3(Math.cos(arcStart + arcLen * 0.65) * (outerR * 0.92), halfH + 0.0005, Math.sin(arcStart + arcLen * 0.65) * (outerR * 0.92)),
  ];

  return {
    skin: makeGeom(skinVerts, skinUvs, skinIdx),
    flesh: makeGeom(fleshVerts, fleshUvs, fleshIdx),
    dropAnchors,
  };
}

export function createRedOnionRingsModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'red-onion-rings';

  const texSize = options.textureSize ?? 1024;

  // Deep jewel crimson-magenta epidermis (#720442 -> #bd0c70 -> crisp plum highlights)
  const skinTex = buildPhotorealPbrTextures(
    texSize,
    (u, v) => {
      const ribs = Math.sin(u * 130 + fbm2(u * 8, v * 8, 3, 21) * 2.0) * 0.5 + 0.5;
      const m = fbm2(u * 10, v * 10, 3, 44);
      const edgeHighlight = smoothstep(0.32, 0.48, Math.abs(v - 0.5));
      let rgb = mixRgb([96, 3, 52], [176, 12, 98], clamp(0.28 + ribs * 0.35 + m * 0.35, 0, 1));
      rgb = mixRgb(rgb, [218, 54, 146], clamp(edgeHighlight * 0.6 + ribs * 0.15, 0, 0.85));
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: ribs * 0.45 + m * 0.35,
        rough: clamp(0.10 + ribs * 0.12, 0.07, 0.30),
        ao: clamp(0.75 + 0.25 * ribs, 0.55, 1.0),
      };
    },
    { normalStrength: 2.4 }
  );

  // Crisp translucent white-lilac annular flesh with magenta vascular edge & concentric layer veins
  const fleshTex = buildPhotorealPbrTextures(
    512,
    (u, v) => {
      const cells = Math.sin(u * 150) * 0.5 + 0.5;
      const vein = smoothstep(0.18, 0.02, v) + smoothstep(0.82, 0.98, v);
      const midLayerBand = Math.exp(-Math.pow((v - 0.52) / 0.08, 2)) * 0.48;
      let rgb = mixRgb([246, 236, 246], [220, 178, 210], clamp(0.22 + cells * 0.25 + fbm2(u * 14, v * 14, 3, 88) * 0.35, 0, 1));
      rgb = mixRgb(rgb, [168, 16, 98], clamp(vein * 0.8 + midLayerBand, 0, 0.92));
      return {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2],
        h: cells * 0.35,
        rough: clamp(0.08 + cells * 0.1, 0.05, 0.24),
        ao: clamp(0.84 + 0.16 * cells, 0.68, 1.0),
      };
    },
    { normalStrength: 1.6 }
  );

  const skinMat = new THREE.MeshPhysicalMaterial({
    name: 'red-onion-magenta-skin',
    map: skinTex.albedoMap,
    normalMap: skinTex.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    aoMap: skinTex.ormMap,
    aoMapIntensity: 0.7,
    roughnessMap: skinTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.82,
    clearcoatRoughness: 0.1,
    sheen: 0.25,
    sheenColor: new THREE.Color(0xe848a8),
    wireframe: options.wireframe ?? false,
  });

  const fleshMat = new THREE.MeshPhysicalMaterial({
    name: 'red-onion-white-layers',
    map: fleshTex.albedoMap,
    normalMap: fleshTex.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    aoMap: fleshTex.ormMap,
    aoMapIntensity: 0.65,
    roughnessMap: fleshTex.ormMap,
    roughness: 1.0,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    sheen: 0.22,
    sheenColor: new THREE.Color(0xf6d8ea),
    wireframe: options.wireframe ?? false,
  });

  // 5 Spaced, non-intersecting crisp Red Onion Rings + 4 floating arc shards (~13,500 tris)
  const specs = [
    { outer: 0.032, thick: 0.0046, h: 0.0074, start: 0, arc: Math.PI * 2, pos: [0, 0.015, 0.004], rot: [0.58, 0.22, -0.32] },
    { outer: 0.024, thick: 0.0038, h: 0.0066, start: 0, arc: Math.PI * 2, pos: [0.002, 0.016, 0.004], rot: [0.52, 0.28, -0.25] }, // concentric nested inner ring!
    { outer: 0.027, thick: 0.0042, h: 0.0070, start: 0, arc: Math.PI * 2, pos: [-0.022, -0.020, 0.018], rot: [-0.42, 0.85, 0.36] },
    { outer: 0.021, thick: 0.0036, h: 0.0064, start: 0, arc: Math.PI * 2, pos: [0.028, -0.014, -0.014], rot: [0.85, -0.55, 0.52] },
    { outer: 0.015, thick: 0.0030, h: 0.0056, start: 0, arc: Math.PI * 2, pos: [-0.034, 0.032, -0.024], rot: [-0.6, 0.3, -0.8] },
    // Crisp tumbling cut crescent shards as in reference
    { outer: 0.014, thick: 0.0032, h: 0.0050, start: 0.2, arc: 1.5, pos: [0.036, 0.028, 0.018], rot: [0.9, 0.4, -0.5] },
    { outer: 0.011, thick: 0.0028, h: 0.0045, start: 1.1, arc: 1.2, pos: [-0.006, -0.038, -0.018], rot: [-0.7, 1.2, 0.2] },
    { outer: 0.012, thick: 0.0028, h: 0.0045, start: 0.5, arc: 1.3, pos: [0.044, -0.002, 0.004], rot: [0.2, -0.9, 0.8] },
  ];

  const skinParts: THREE.BufferGeometry[] = [];
  const fleshParts: THREE.BufferGeometry[] = [];
  const dropParts: THREE.BufferGeometry[] = [];

  for (let i = 0; i < specs.length; i++) {
    const sp = specs[i];
    const g = buildSculptedOnionRing(sp.outer, sp.thick, sp.h, sp.start, sp.arc, 10 + i * 27);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...sp.pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...sp.rot)),
      new THREE.Vector3(1, 1, 1)
    );
    g.skin.applyMatrix4(m);
    g.flesh.applyMatrix4(m);
    skinParts.push(g.skin);
    fleshParts.push(g.flesh);

    if (i < 5) {
      for (const dp of g.dropAnchors) {
        const wp = dp.clone().applyMatrix4(m);
        const dg = buildClearDropletGeometry(0.0014, 12, 8);
        dg.translate(wp.x, wp.y, wp.z);
        dropParts.push(dg);
      }
    }
  }

  const sMerged = mergeGeomsSafe(skinParts);
  const fMerged = mergeGeomsSafe(fleshParts);
  const dMerged = mergeGeomsSafe(dropParts);
  for (const g of [...skinParts, ...fleshParts, ...dropParts]) g.dispose();
  enableAoUv(sMerged);
  enableAoUv(fMerged);

  const skinMesh = new THREE.Mesh(sMerged, skinMat);
  skinMesh.name = 'red-onion-epidermis';
  skinMesh.castShadow = options.castShadow ?? true;
  skinMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(skinMesh);

  const fleshMesh = new THREE.Mesh(fMerged, fleshMat);
  fleshMesh.name = 'red-onion-layers';
  fleshMesh.castShadow = options.castShadow ?? true;
  fleshMesh.receiveShadow = options.receiveShadow ?? true;
  root.add(fleshMesh);

  root.add(new THREE.Mesh(dMerged, createDropletMaterial()));

  return root;
}

export default createRedOnionRingsModel;
