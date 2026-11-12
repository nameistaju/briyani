import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { chromium } from 'playwright-core';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('No Chrome/Edge executable found on this machine.');
}

async function bundleFactory(factoryPath, exportName) {
  const absFactory = path.resolve(factoryPath);
  const threeDir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'node_modules/three');
  const wrapperCode = `
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as FactoryModule from ${JSON.stringify(absFactory)};

const factoryFn =
  ${exportName ? `FactoryModule[${JSON.stringify(exportName)}] || ` : ''}
  FactoryModule.default ||
  Object.values(FactoryModule).find((v) => typeof v === 'function');

if (!factoryFn) {
  throw new Error('No factory function exported from ' + ${JSON.stringify(absFactory)});
}

window.__THREE__ = THREE;
window.__GLTFExporter__ = GLTFExporter;
window.__GLTFLoader__ = GLTFLoader;
window.__RoomEnvironment__ = RoomEnvironment;
window.__CREATE_MODEL__ = factoryFn;
`;

  const result = await esbuild.build({
    stdin: {
      contents: wrapperCode,
      resolveDir: path.dirname(absFactory),
      loader: 'ts',
    },
    bundle: true,
    format: 'iife',
    write: false,
    platform: 'browser',
    target: ['chrome120'],
    nodePaths: [path.resolve(threeDir, '..')],
  });
  return result.outputFiles[0].text;
}

function startStaticServer(htmlContent, bundleJs) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/bundle.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
        res.end(bundleJs);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlContent);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, url: `http://127.0.0.1:${addr.port}/` });
    });
  });
}

const HTML_PAGE = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
<script src="/bundle.js"></script>
<script>
window.__RUN_EXPORT_AND_RENDER__ = async function(options) {
  const THREE = window.__THREE__;
  const GLTFExporter = window.__GLTFExporter__;
  const GLTFLoader = window.__GLTFLoader__;
  const RoomEnvironment = window.__RoomEnvironment__;

  const group = window.__CREATE_MODEL__(options.modelOptions || {});
  group.updateMatrixWorld(true);

  // Extract procedural textures info if any
  const textureSummary = [];
  const seenTex = new Set();
  group.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        for (const ch of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'alphaMap', 'emissiveMap']) {
          const tex = mat[ch];
          if (tex && !seenTex.has(tex.uuid)) {
            seenTex.add(tex.uuid);
            textureSummary.push({
              channel: ch,
              material: mat.name || 'material',
              width: tex.image?.width || 0,
              height: tex.image?.height || 0,
            });
          }
        }
      }
    }
  });

  // Export to GLB using Three.js GLTFExporter
  const exporter = new GLTFExporter();
  const glbBuffer = await new Promise((resolve, reject) => {
    exporter.parse(
      group,
      (result) => resolve(result),
      (err) => reject(err),
      { binary: true, onlyVisible: true, embedImages: true }
    );
  });

  const glbBytes = new Uint8Array(glbBuffer);
  let binaryStr = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < glbBytes.length; i += chunkSize) {
    binaryStr += String.fromCharCode.apply(null, glbBytes.subarray(i, i + chunkSize));
  }
  const glbBase64 = btoa(binaryStr);

  // Now reload the exported GLB using GLTFLoader in a clean verification scene!
  const loader = new GLTFLoader();
  const gltf = await new Promise((resolve, reject) => {
    loader.parse(glbBuffer, '', resolve, reject);
  });

  const loadedRoot = gltf.scene;
  loadedRoot.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(loadedRoot);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  let meshCount = 0;
  let triangleCount = 0;
  let vertexCount = 0;
  const materialNames = new Set();
  const meshNames = [];

  loadedRoot.traverse((obj) => {
    if (obj.isMesh) {
      meshCount++;
      meshNames.push(obj.name || ('mesh_' + meshCount));
      const geom = obj.geometry;
      const count = obj.isInstancedMesh ? obj.count : 1;
      if (geom) {
        const pos = geom.attributes.position;
        const vCount = pos ? pos.count : 0;
        const tCount = geom.index ? geom.index.count / 3 : vCount / 3;
        vertexCount += vCount * count;
        triangleCount += Math.round(tCount * count);
      }
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m) materialNames.add(m.name || m.type);
      }
    }
  });

  // Setup WebGLRenderer with transparent alpha + PMREM RoomEnvironment
  const width = options.width || 1024;
  const height = options.height || 1024;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = options.exposure || 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x140d09);
  const addPanel = (color, intensity, pos, scale, rot) => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    mesh.rotation.set(...rot);
    envScene.add(mesh);
  };
  // Overhead main warm key softbox
  addPanel(0xfff1dc, 3.6, [1.5, 4.2, 2.0], [5.5, 5.5, 1], [-Math.PI / 2, 0, 0]);
  // Left soft fill strip
  addPanel(0xffd7ad, 2.0, [-4.5, 1.5, 1.5], [4.0, 4.5, 1], [0, Math.PI / 2, 0]);
  // Right cool subtle specular accent
  addPanel(0xdce6f7, 1.3, [4.5, 1.2, -1.2], [3.5, 4.0, 1], [0, -Math.PI / 2, 0]);
  // Back rim highlight strip
  addPanel(0xffc988, 2.8, [0, 3.0, -4.5], [6.5, 2.8, 1], [0.4, 0, 0]);
  // Dark warm mahogany studio floor (prevents bright white reflections under curved metals)
  addPanel(0x1f1108, 0.45, [0, -4.0, 0], [12, 12, 1], [Math.PI / 2, 0, 0]);
  const envTex = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = options.envIntensity || 1.05;

  // Studio 3-point warm food photography lighting
  const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.4);
  keyLight.position.set(1.6, 2.4, 1.8);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xdce8ff, 0.85);
  fillLight.position.set(-2.0, 1.1, 1.2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffcf99, 1.5);
  rimLight.position.set(-0.4, 1.8, -2.2);
  scene.add(rimLight);

  const hemi = new THREE.HemisphereLight(0xfff4e6, 0x2a1810, 0.55);
  scene.add(hemi);

  scene.add(loadedRoot);

  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const fov = 36;
  const camera = new THREE.PerspectiveCamera(fov, width / height, maxDim * 0.01, maxDim * 100);
  const dist = (maxDim / (2 * Math.tan((fov * Math.PI) / 360))) * 1.48;

  function renderView(azDeg, elDeg, clearAlpha = 0) {
    const az = (azDeg * Math.PI) / 180;
    const el = (elDeg * Math.PI) / 180;
    const r = dist;
    camera.position.set(
      center.x + r * Math.cos(el) * Math.sin(az),
      center.y + r * Math.sin(el),
      center.z + r * Math.cos(el) * Math.cos(az)
    );
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    renderer.setClearColor(0x000000, clearAlpha);
    renderer.clear();
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  }

  const heroView = options.heroView || { az: 24, el: 26 };
  const heroPng = renderView(heroView.az, heroView.el, 0);

  // Render 4 angles for inspection sheet
  const angles = options.angles || [
    { label: 'Front (0°)', az: 0, el: 18 },
    { label: 'Hero 3/4 (35°)', az: 35, el: 28 },
    { label: 'Side (90°)', az: 90, el: 16 },
    { label: 'Top / Rear (155°)', az: 155, el: 52 },
  ];
  const viewDataUrls = angles.map((a) => ({
    label: a.label,
    dataUrl: renderView(a.az, a.el, 0),
  }));

  // Composite 2x2 sheet on dark studio backdrop with subtle checkerboard/dark tone and labels
  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = 1280;
  sheetCanvas.height = 1280;
  const ctx = sheetCanvas.getContext('2d');
  ctx.fillStyle = '#0d0b0a';
  ctx.fillRect(0, 0, 1280, 1280);

  const cellW = 640;
  const cellH = 640;
  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col * cellW;
    const y = row * cellH;
    // subtle radial vignette per cell
    const grad = ctx.createRadialGradient(x + 320, y + 320, 40, x + 320, y + 320, 340);
    grad.addColorStop(0, '#221c18');
    grad.addColorStop(1, '#0b0908');
    ctx.fillStyle = grad;
    ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

    const img = new Image();
    await new Promise((res) => { img.onload = res; img.src = viewDataUrls[i].dataUrl; });
    ctx.drawImage(img, x + 20, y + 20, cellW - 40, cellH - 40);

    ctx.fillStyle = 'rgba(244, 191, 135, 0.9)';
    ctx.font = '600 20px system-ui, -apple-system, sans-serif';
    ctx.fillText(viewDataUrls[i].label, x + 22, y + 38);
  }
  ctx.strokeStyle = '#3a2b20';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(640, 0); ctx.lineTo(640, 1280);
  ctx.moveTo(0, 640); ctx.lineTo(1280, 640);
  ctx.stroke();

  const sheetPng = sheetCanvas.toDataURL('image/png');

  return {
    glbBase64,
    heroPng,
    sheetPng,
    metrics: {
      glbBytes: glbBytes.length,
      meshCount,
      triangleCount,
      vertexCount,
      materials: Array.from(materialNames),
      meshNames,
      textures: textureSummary,
      boundingBox: {
        min: [Number(box.min.x.toFixed(4)), Number(box.min.y.toFixed(4)), Number(box.min.z.toFixed(4))],
        max: [Number(box.max.x.toFixed(4)), Number(box.max.y.toFixed(4)), Number(box.max.z.toFixed(4))],
        size: [Number(size.x.toFixed(4)), Number(size.y.toFixed(4)), Number(size.z.toFixed(4))],
        center: [Number(center.x.toFixed(4)), Number(center.y.toFixed(4)), Number(center.z.toFixed(4))],
      },
      sculptRuntime: (() => {
        const rt = group.userData?.sculptRuntime;
        if (!rt) return null;
        return {
          nodeNames: Object.keys(rt.nodes || {}),
          meshNames: Object.keys(rt.meshes || {}),
          sockets: Object.fromEntries(
            Object.entries(rt.sockets || {}).map(([k, v]) => [
              k,
              {
                position: v?.position ? v.position.toArray().map((n) => Number(n.toFixed(4))) : [0, 0, 0],
                socket: v?.userData?.socket || null,
              },
            ])
          ),
          colliders: rt.colliders || {},
          destructionGroupNames: Object.keys(rt.destructionGroups || {}),
        };
      })(),
    },
  };
};
</script>
</body>
</html>`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.factory || !args.glb) {
    console.error('Usage: node export-and-preview.mjs --factory <file.ts> --glb <out.glb> [--preview <sheet.png>] [--hero-render <hero.png>] [--meta <meta.json>] [--export-name <fn>] [--az 24] [--el 26]');
    process.exit(1);
  }

  const bundleJs = await bundleFactory(args.factory, args['export-name']);
  const { server, url } = await startStaticServer(HTML_PAGE, bundleJs);
  const chromePath = findChromeExecutable();

  let browser;
  try {
    browser = await chromium.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
      ],
    });
    const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(async (opts) => {
      return await window.__RUN_EXPORT_AND_RENDER__(opts);
    }, {
      heroView: {
        az: args.az !== undefined ? Number(args.az) : 24,
        el: args.el !== undefined ? Number(args.el) : 26,
      },
      exposure: args.exposure !== undefined ? Number(args.exposure) : 1.15,
      envIntensity: args['env-intensity'] !== undefined ? Number(args['env-intensity']) : 0.9,
    });

    if (errors.length > 0) {
      throw new Error('Browser errors during Three.js export/render:\n' + errors.join('\n'));
    }

    const glbPath = path.resolve(args.glb);
    fs.mkdirSync(path.dirname(glbPath), { recursive: true });
    fs.writeFileSync(glbPath, Buffer.from(result.glbBase64, 'base64'));

    if (args.preview) {
      const pPath = path.resolve(args.preview);
      fs.mkdirSync(path.dirname(pPath), { recursive: true });
      const b64 = result.sheetPng.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(pPath, Buffer.from(b64, 'base64'));
    }

    if (args['hero-render']) {
      const hPath = path.resolve(args['hero-render']);
      fs.mkdirSync(path.dirname(hPath), { recursive: true });
      const b64 = result.heroPng.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(hPath, Buffer.from(b64, 'base64'));
    }

    if (args.meta) {
      const mPath = path.resolve(args.meta);
      fs.mkdirSync(path.dirname(mPath), { recursive: true });
      fs.writeFileSync(mPath, JSON.stringify(result.metrics, null, 2) + '\n', 'utf8');
    }

    console.log(JSON.stringify({
      ok: true,
      glb: glbPath,
      glbBytes: result.metrics.glbBytes,
      triangleCount: result.metrics.triangleCount,
      meshCount: result.metrics.meshCount,
      size: result.metrics.boundingBox.size,
      materials: result.metrics.materials,
    }, null, 2));
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
