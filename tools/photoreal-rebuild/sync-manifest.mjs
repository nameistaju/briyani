import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const manifestPath = path.join(ROOT, 'public/3d-assets/manifest.json');
const qaDir = path.join(ROOT, 'qa');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const assets = manifest.assets || [];

let passed = 0;
for (const item of assets) {
  const statsFile = path.join(qaDir, `${item.slug}-stats.json`);
  if (!fs.existsSync(statsFile)) {
    console.error(`MISSING stats: ${statsFile}`);
    process.exitCode = 1;
    continue;
  }
  const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
  const folder = item.category === 'hero' ? 'hero' : 'ingredients';
  const rawRel = `public/3d-assets/${folder}/${item.slug}.glb`;
  const optRel = `public/3d-assets/optimized/${folder}/${item.slug}.glb`;
  const rawBytes = fs.statSync(path.join(ROOT, rawRel)).size;
  const optBytes = fs.statSync(path.join(ROOT, optRel)).size;
  const optKb = optBytes / 1024;
  const budgetKb = item.category === 'hero' ? 1500 : 400;
  const ok = optKb <= budgetKb;

  item.glb = rawRel;
  item.glbBytes = rawBytes;
  item.glbSizeKB = Number((rawBytes / 1024).toFixed(1));
  item.optimizedGlb = optRel;
  item.optimizedBytes = optBytes;
  item.optimizedSizeKB = Number(optKb.toFixed(1));
  item.rawTriangleCount = stats.rawTriangles;
  item.triangleCount = stats.triangles;
  item.vertexCount = stats.vertices;
  item.dimensionsMeters = stats.size.map((n) => Number(n.toFixed(4)));
  const half = stats.size.map((n) => n * 0.5);
  item.boundingBox = {
    min: stats.center.map((c, idx) => Number((c - half[idx]).toFixed(4))),
    max: stats.center.map((c, idx) => Number((c + half[idx]).toFixed(4))),
    size: item.dimensionsMeters,
    center: stats.center.map((c) => Number(c.toFixed(4))),
  };
  item.materials = stats.materials ?? item.materials;
  item.channels = stats.channels ?? item.channels;
  item.qaSheet = `qa/${item.slug}.png`;

  console.log(
    `[${item.category.padEnd(11)}] ${item.slug.padEnd(26)} rawTris=${String(stats.rawTriangles).padStart(7)} optTris=${String(stats.triangles).padStart(7)} opt=${optKb.toFixed(1).padStart(6)} KB <= ${budgetKb} KB ${ok ? 'PASS' : 'FAIL'}`
  );
  if (ok) passed++;
  else process.exitCode = 1;
}

manifest.pipeline = 'photoreal-threejs-procedural-pbr-draco-webp';
manifest.generatedAt = new Date().toISOString();
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`\nSynced manifest.json: ${passed}/${assets.length} passed budget & stats verification.`);
