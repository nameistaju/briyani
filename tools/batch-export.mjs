#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const JOBS = JSON.parse(fs.readFileSync(path.resolve(ROOT, process.argv[2]), 'utf8'));
const onlyFilter = process.argv.slice(3);

for (const job of JOBS) {
  if (onlyFilter.length > 0 && !onlyFilter.includes(job.slug)) continue;
  const args = [
    'tools/three-export/export-and-preview.mjs',
    '--factory', job.factory,
    '--export-name', job.exportName,
    '--glb', job.glb,
    '--preview', job.preview,
    '--hero-render', job.heroRender,
    '--meta', job.meta,
    '--az', String(job.az ?? 15),
    '--el', String(job.el ?? 24),
  ];
  const res = spawnSync('node', args, { cwd: ROOT, stdio: 'inherit', encoding: 'utf8' });
  if (res.status !== 0) {
    console.error(`FAILED export for ${job.slug}`);
    process.exit(res.status ?? 1);
  }
}
console.log('ALL EXPORTS COMPLETE.');
