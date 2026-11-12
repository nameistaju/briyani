import * as THREE from 'three';
import {
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
import { buildPhotorealChiliPod } from '../green-chili/createGreenChiliModel';

export function createChiliDuoModel(options: PhotorealOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = 'chili-duo';

  const texSize = options.textureSize ?? 1024;

  const makePepperMat = (name: string, darkRgb: [number, number, number], midRgb: [number, number, number], hiRgb: [number, number, number]) => {
    const tex = buildPhotorealPbrTextures(
      texSize,
      (u, v) => {
        const m = fbm2(u * 14, v * 12, 4, name.length * 37);
        const stria = Math.sin(v * 38 + m * 2.5) * 0.5 + 0.5;
        let rgb = mixRgb(darkRgb, midRgb, clamp(0.32 + m * 0.45 + stria * 0.2, 0, 1));
        rgb = mixRgb(rgb, hiRgb, smoothstep(0.65, 0.94, m) * 0.45);
        return { r: rgb[0], g: rgb[1], b: rgb[2], h: m * 0.45 + stria * 0.18, rough: clamp(0.08 + (1 - m) * 0.14, 0.06, 0.25), ao: 0.9 };
      },
      { normalStrength: 1.8 }
    );
    return new THREE.MeshPhysicalMaterial({
      name,
      map: tex.albedoMap,
      normalMap: tex.normalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      aoMap: tex.ormMap,
      roughnessMap: tex.ormMap,
      roughness: 1.0,
      clearcoat: 0.94,
      clearcoatRoughness: 0.06,
      wireframe: options.wireframe ?? false,
    });
  };

  const greenMat = makePepperMat('duo-green-chili', [32, 82, 4], [104, 148, 8], [156, 188, 48]);
  const redMat = makePepperMat('duo-crimson-chili', [132, 6, 4], [218, 14, 10], [244, 62, 32]);
  const calyxMat = new THREE.MeshPhysicalMaterial({ name: 'duo-chili-calyx', color: 0x528014, roughness: 0.5 });

  const dropParts: THREE.BufferGeometry[] = [];
  const calyxParts: THREE.BufferGeometry[] = [];

  const gPod = buildPhotorealChiliPod({
    maxRadius: 0.0082,
    curvePts: [
      new THREE.Vector3(-0.022, 0.022, 0.008),
      new THREE.Vector3(-0.006, 0.011, 0.010),
      new THREE.Vector3(0.015, 0.005, 0.006),
      new THREE.Vector3(0.036, 0.009, 0.002),
    ],
    droplets: dropParts,
    segAlong: 52,
    segRadial: 28,
  });
  calyxParts.push(gPod.calyx);

  const rPod = buildPhotorealChiliPod({
    maxRadius: 0.0085,
    curvePts: [
      new THREE.Vector3(-0.030, -0.006, -0.006),
      new THREE.Vector3(-0.012, -0.016, -0.009),
      new THREE.Vector3(0.012, -0.020, -0.005),
      new THREE.Vector3(0.034, -0.014, 0.001),
    ],
    droplets: dropParts,
    segAlong: 52,
    segRadial: 28,
  });
  calyxParts.push(rPod.calyx);

  root.add(new THREE.Mesh(gPod.body, greenMat));
  root.add(new THREE.Mesh(rPod.body, redMat));

  // Cross-section chili rings + cream placental pith & yellow seeds matching "Glossy Floating Chili Duo.png"
  const sliceSeeds: THREE.BufferGeometry[] = [];
  const addSlice = (mat: THREE.Material, pos: [number, number, number], rot: [number, number, number]) => {
    const ring = new THREE.CylinderGeometry(0.0068, 0.0066, 0.0028, 28, 2, true);
    const hole = new THREE.TorusGeometry(0.0058, 0.0012, 12, 28);
    hole.rotateX(Math.PI * 0.5);
    const sg = mergeGeomsSafe([ring, hole]);
    sg.rotateX(rot[0]);
    sg.rotateY(rot[1]);
    sg.rotateZ(rot[2]);
    sg.translate(pos[0], pos[1], pos[2]);
    root.add(new THREE.Mesh(sg, mat));

    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const seed = new THREE.SphereGeometry(0.0011, 8, 8);
      seed.scale(1, 0.45, 0.9);
      seed.translate(Math.cos(a) * 0.0022, 0, Math.sin(a) * 0.0022);
      seed.rotateX(rot[0]);
      seed.rotateY(rot[1]);
      seed.rotateZ(rot[2]);
      seed.translate(pos[0], pos[1], pos[2]);
      sliceSeeds.push(seed);
    }
  };
  addSlice(greenMat, [0.004, 0.028, -0.012], [0.6, 0.2, 0.3]);
  addSlice(redMat, [0.024, -0.024, 0.015], [-0.5, 0.7, -0.2]);

  if (sliceSeeds.length > 0) {
    const seedMerged = mergeGeomsSafe(sliceSeeds);
    for (const g of sliceSeeds) g.dispose();
    root.add(new THREE.Mesh(seedMerged, new THREE.MeshPhysicalMaterial({ color: 0xf6de84, roughness: 0.24, clearcoat: 0.6 })));
  }

  const cMerged = mergeGeomsSafe(calyxParts);
  for (const g of calyxParts) g.dispose();
  enableAoUv(cMerged);
  root.add(new THREE.Mesh(cMerged, calyxMat));

  if (dropParts.length > 0) {
    const dMerged = mergeGeomsSafe(dropParts);
    for (const g of dropParts) g.dispose();
    root.add(new THREE.Mesh(dMerged, createDropletMaterial()));
  }

  return root;
}

export default createChiliDuoModel;
