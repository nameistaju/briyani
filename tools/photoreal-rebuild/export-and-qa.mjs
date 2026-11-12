#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const esbuild = require(path.resolve('tools/three-export/node_modules/esbuild'));
const { chromium } = require(path.resolve('tools/three-export/node_modules/playwright-core'));

const ROOT = process.cwd();
const GLTF_TRANSFORM_CLI = path.resolve(ROOT, 'node_modules/@gltf-transform/cli/bin/cli.js');
const PALETTES = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'tools/photoreal-rebuild/color-palettes.json'), 'utf8'));

function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('No Chrome/Edge executable found.');
}

async function bundleFactory(factoryPath, exportName) {
  const absFactory = path.resolve(ROOT, factoryPath);
  const rootNodeModules = path.resolve(ROOT, 'node_modules');
  const code = `
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
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
window.__DRACOLoader__ = DRACOLoader;
window.__RoomEnvironment__ = RoomEnvironment;
window.__CREATE_MODEL__ = factoryFn;
`;

  const res = await esbuild.build({
    stdin: {
      contents: code,
      resolveDir: path.dirname(absFactory),
      loader: 'ts',
    },
    bundle: true,
    format: 'iife',
    write: false,
    platform: 'browser',
    target: ['chrome120'],
    define: { 'import.meta.url': 'window.location.href' },
    nodePaths: [rootNodeModules],
  });
  return res.outputFiles[0].text;
}

const MIME = {
  '.js': 'application/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.html': 'text/html; charset=utf-8',
};

function startServer(html, bundleJs, glbMap) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = (req.url || '/').split('?')[0];
      if (urlPath === '/bundle.js') {
        res.writeHead(200, { 'Content-Type': MIME['.js'] });
        res.end(bundleJs);
        return;
      }
      if (urlPath.startsWith('/draco/')) {
        const fname = path.basename(urlPath);
        const fpath = path.resolve(ROOT, 'public/draco', fname);
        if (fs.existsSync(fpath)) {
          const ext = path.extname(fname);
          res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
          res.end(fs.readFileSync(fpath));
          return;
        }
      }
      if (urlPath === '/opt.glb' && glbMap.optPath && fs.existsSync(glbMap.optPath)) {
        res.writeHead(200, { 'Content-Type': MIME['.glb'] });
        res.end(fs.readFileSync(glbMap.optPath));
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME['.html'] });
      res.end(html);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, url: `http://127.0.0.1:${addr.port}/` });
    });
  });
}

const HTML_PAGE = `<!doctype html>
<html>
<head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;}canvas{display:block;}</style></head>
<body>
<script src="/bundle.js"></script>
<script>
function setupSceneAndRenderer(width, height) {
  const THREE = window.__THREE__;
  const RoomEnvironment = window.__RoomEnvironment__;

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
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.innerHTML = '';
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // Culinary warm-dark studio HDRI environment (deep shadow floor + glowing amber key softboxes + teal rim panel)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x160c07);
  const addPanel = (color, intensity, pos, scale, rot) => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    mesh.rotation.set(...rot);
    envScene.add(mesh);
  };
  addPanel(0xffecd2, 3.8, [1.8, 4.2, 2.2], [4.5, 4.5, 1], [-Math.PI / 2, 0, 0]);
  addPanel(0xffbe7b, 2.4, [-4.2, 1.8, 1.8], [3.5, 4.0, 1], [0, Math.PI / 2, 0]);
  addPanel(0x6de6e0, 1.5, [4.2, 1.6, -1.8], [3.2, 3.6, 1], [0, -Math.PI / 2, 0]);
  addPanel(0xffc98c, 2.8, [0, 3.0, -4.5], [5.8, 2.6, 1], [0.4, 0, 0]);
  addPanel(0x281308, 0.5, [0, -4.0, 0], [12, 12, 1], [Math.PI / 2, 0, 0]);
  const envTex = pmrem.fromScene(envScene, 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 1.1;

  // Required rig: 3200K warm key + cool teal rim + soft fill
  const keyLight = new THREE.DirectionalLight(0xffb974, 2.75);
  keyLight.position.set(1.8, 2.5, 2.1);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x4be3dc, 1.55);
  rimLight.position.set(-2.2, 1.4, -2.0);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0xffead3, 1.05);
  fillLight.position.set(-1.6, 0.9, 1.6);
  scene.add(fillLight);

  const hemi = new THREE.HemisphereLight(0xffe7c9, 0x26140c, 0.55);
  scene.add(hemi);

  return { THREE, renderer, scene };
}

window.__EXPORT_RAW_GLB__ = async function(options) {
  const THREE = window.__THREE__;
  const GLTFExporter = window.__GLTFExporter__;
  const group = window.__CREATE_MODEL__(options || {});
  group.updateMatrixWorld(true);

  let rawTriangles = 0;
  let rawVertices = 0;
  const channels = new Set();
  const materials = new Set();

  group.traverse((o) => {
    if (o.isMesh) {
      const g = o.geometry;
      const cnt = o.isInstancedMesh ? o.count : 1;
      if (g) {
        const vc = g.attributes.position ? g.attributes.position.count : 0;
        const tc = g.index ? g.index.count / 3 : vc / 3;
        rawVertices += vc * cnt;
        rawTriangles += Math.round(tc * cnt);
      }
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m) continue;
        materials.add(m.name || m.type);
        for (const ch of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'sheen', 'clearcoat', 'transmission']) {
          if (ch === 'sheen' && m.sheen > 0) channels.add('sheen');
          else if (ch === 'clearcoat' && m.clearcoat > 0) channels.add('clearcoat');
          else if (ch === 'transmission' && m.transmission > 0) channels.add('transmission');
          else if (m[ch] && typeof m[ch] === 'object') channels.add(ch);
        }
      }
    }
  });

  const exporter = new GLTFExporter();
  const buf = await new Promise((resolve, reject) => {
    exporter.parse(group, resolve, reject, { binary: true, onlyVisible: true, embedImages: true });
  });
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return {
    glbBase64: btoa(bin),
    rawTriangles,
    rawVertices,
    channels: [...channels],
    materials: [...materials],
  };
};

window.__RENDER_QA_VIEWS__ = async function(options) {
  const { THREE, renderer, scene } = setupSceneAndRenderer(612, 868);
  const GLTFLoader = window.__GLTFLoader__;
  const DRACOLoader = window.__DRACOLoader__;

  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  loader.setDRACOLoader(draco);

  const gltf = await loader.loadAsync('/opt.glb');
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  scene.add(root);

  let triangles = 0;
  let vertices = 0;
  const channels = new Set();
  const materials = new Set();
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      const g = o.geometry;
      if (g) {
        const vc = g.attributes.position ? g.attributes.position.count : 0;
        const tc = g.index ? g.index.count / 3 : vc / 3;
        vertices += vc;
        triangles += Math.round(tc);
      }
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m) continue;
        materials.add(m.name || m.type);
        if (m.envMapIntensity !== undefined) m.envMapIntensity = 1.2;
        for (const ch of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) {
          if (m[ch]) channels.add(ch);
        }
        if (m.sheen > 0) channels.add('sheen');
        if (m.clearcoat > 0) channels.add('clearcoat');
        if (m.transmission > 0) channels.add('transmission');
      }
    }
  });

  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const fov = 30;
  const dist = (maxDim * 0.56) / Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 1.48;
  const cam = new THREE.PerspectiveCamera(fov, 612 / 868, dist * 0.02, dist * 25);

  const angles = [
    { name: 'front', az: 0, el: 10 },
    { name: '3quarter', az: 38, el: 22 },
    { name: 'side', az: 90, el: 10 },
    { name: 'top', az: 12, el: 76 },
  ];

  const renderShots = (bgHex, clearAlpha) => {
    renderer.setClearColor(new THREE.Color(bgHex), clearAlpha);
    const out = [];
    for (const ang of angles) {
      const az = THREE.MathUtils.degToRad(ang.az);
      const el = THREE.MathUtils.degToRad(ang.el);
      cam.position.set(
        center.x + dist * Math.cos(el) * Math.sin(az),
        center.y + dist * Math.sin(el),
        center.z + dist * Math.cos(el) * Math.cos(az)
      );
      cam.lookAt(center);
      cam.updateProjectionMatrix();
      renderer.render(scene, cam);
      out.push(renderer.domElement.toDataURL('image/png'));
    }
    return out;
  };

  const teal = renderShots(0x117a7a, 1.0);
  const maroon = renderShots(0x650d1a, 1.0);

  // Transparent high-res hero preview (at 960x960)
  renderer.setSize(960, 960);
  cam.aspect = 1.0;
  cam.updateProjectionMatrix();
  const az = THREE.MathUtils.degToRad(options.az ?? 28);
  const el = THREE.MathUtils.degToRad(options.el ?? 22);
  cam.position.set(
    center.x + dist * Math.cos(el) * Math.sin(az),
    center.y + dist * Math.sin(el),
    center.z + dist * Math.cos(el) * Math.cos(az)
  );
  cam.lookAt(center);
  renderer.setClearColor(0x000000, 0);
  renderer.render(scene, cam);
  const transparentPreview = renderer.domElement.toDataURL('image/png');

  return {
    triangles,
    vertices,
    size: [size.x, size.y, size.z],
    center: [center.x, center.y, center.z],
    materials: [...materials],
    channels: [...channels],
    teal,
    maroon,
    transparentPreview,
  };
};
</script>
</body>
</html>`;

async function main() {
  const args = process.argv.slice(2);
  const slug = args[0];
  if (!slug) {
    console.error('Usage: node tools/photoreal-rebuild/export-and-qa.mjs <slug>');
    process.exit(1);
  }

  const jobsHero = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'tools/manifests/hero-export-jobs.json'), 'utf8'));
  const jobsIng = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'tools/manifests/ingredients-export-jobs.json'), 'utf8'));

  // Include copper-handi cleanly even if it wasn't in hero-export-jobs.json
  const allJobs = [
    {
      slug: 'copper-handi',
      category: 'hero',
      factory: 'public/3d-assets/source/copper-handi/createCopperHandiModel.ts',
      exportName: 'createCopperHandiModel',
      glb: 'public/3d-assets/hero/copper-handi.glb',
      preview: 'public/3d-assets/previews/copper-handi.png',
      heroRender: 'public/3d-assets/previews/copper-handi-hero.png',
      meta: 'public/3d-assets/source/copper-handi/metadata.json',
      az: 18,
      el: 22,
    },
    ...jobsHero.map((j) => ({ ...j, category: 'hero' })),
    ...jobsIng.map((j) => ({ ...j, category: 'ingredients' })),
  ];

  const job = allJobs.find((j) => j.slug === slug);
  if (!job) {
    console.error(`Unknown slug: ${slug}`);
    process.exit(1);
  }

  const isHero = job.category === 'hero';
  const budgetKB = isHero ? 1500 : 400;
  const rawGlbPath = path.resolve(ROOT, job.glb);
  const optGlbPath = path.resolve(ROOT, 'public/3d-assets/optimized', job.category, `${slug}.glb`);
  fs.mkdirSync(path.dirname(rawGlbPath), { recursive: true });
  fs.mkdirSync(path.dirname(optGlbPath), { recursive: true });

  console.log(`\n=== [${slug}] Bundling ${job.factory} ===`);
  const bundleJs = await bundleFactory(job.factory, job.exportName);

  const glbState = { optPath: optGlbPath };
  const { server, url } = await startServer(HTML_PAGE, bundleJs, glbState);
  const chromePath = findChromeExecutable();
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
    page.on('pageerror', (err) => console.error(`[PAGE ERROR ${slug}]:`, err));
    await page.goto(url, { waitUntil: 'load' });

    const expRes = await page.evaluate(
      (opts) => window.__EXPORT_RAW_GLB__(opts),
      { textureSize: isHero ? 2048 : 1024, highPoly: true }
    );

    const rawBuf = Buffer.from(expRes.glbBase64, 'base64');
    fs.writeFileSync(rawGlbPath, rawBuf);
    console.log(
      `Raw GLB exported: ${(rawBuf.length / 1024).toFixed(1)} KB | ${expRes.rawTriangles.toLocaleString()} tris | ${expRes.rawVertices.toLocaleString()} verts`
    );

    // Optimize via @gltf-transform/cli with Draco + WebP within budget
    const texSteps = isHero ? ['1024', '768', '512'] : ['512', '384', '256'];
    let optBytes = 0;
    for (const texSize of texSteps) {
      execFileSync(
        process.execPath,
        [
          GLTF_TRANSFORM_CLI,
          'optimize',
          rawGlbPath,
          optGlbPath,
          '--compress',
          'draco',
          '--texture-compress',
          'webp',
          '--texture-size',
          texSize,
        ],
        { stdio: ['ignore', 'pipe', 'inherit'] }
      );
      optBytes = fs.statSync(optGlbPath).size;
      if (optBytes / 1024 <= budgetKB) break;
      console.log(`Optimized ${optGlbPath} is ${(optBytes / 1024).toFixed(1)} KB (> ${budgetKB} KB), retrying texSize=${texSize}...`);
    }
    console.log(`Optimized GLB: ${(optBytes / 1024).toFixed(1)} KB (budget <= ${budgetKB} KB)`);

    // Render 4 Teal + 4 Maroon views FROM THE OPTIMIZED DRACO GLB
    const qaRes = await page.evaluate(
      (opts) => window.__RENDER_QA_VIEWS__(opts),
      { az: job.az, el: job.el }
    );

    const tmpDir = path.resolve(ROOT, 'qa', '.tmp', slug);
    fs.mkdirSync(tmpDir, { recursive: true });
    const savePng = (dataUrl, dst) => {
      const b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(dst, Buffer.from(b64, 'base64'));
    };

    const tealPaths = qaRes.teal.map((u, i) => {
      const p = path.join(tmpDir, `teal_${i}.png`);
      savePng(u, p);
      return p;
    });
    const maroonPaths = qaRes.maroon.map((u, i) => {
      const p = path.join(tmpDir, `maroon_${i}.png`);
      savePng(u, p);
      return p;
    });

    if (job.preview) {
      savePng(qaRes.transparentPreview, path.resolve(ROOT, job.preview));
    }

    const statsObj = {
      slug,
      category: job.category,
      reference: PALETTES[slug]?.reference || '',
      triangles: qaRes.triangles,
      rawTriangles: expRes.rawTriangles,
      vertices: qaRes.vertices,
      rawBytes: rawBuf.length,
      optBytes,
      budgetKB,
      size: qaRes.size,
      center: qaRes.center,
      materials: qaRes.materials,
      channels: qaRes.channels,
      sheetPath: path.resolve(ROOT, 'qa', `${slug}.png`),
      views: { teal: tealPaths, maroon: maroonPaths },
    };

    const statsPath = path.resolve(ROOT, 'qa', `${slug}-stats.json`);
    fs.writeFileSync(statsPath, JSON.stringify(statsObj, null, 2));

    const pyRes = spawnSync(
      path.resolve(ROOT, 'tools/.venv/Scripts/python.exe'),
      [path.resolve(ROOT, 'tools/photoreal-rebuild/make_qa_sheet.py'), statsPath],
      { cwd: ROOT, stdio: 'inherit' }
    );
    if (pyRes.status !== 0) {
      throw new Error(`make_qa_sheet.py failed with status ${pyRes.status}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
