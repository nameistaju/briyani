import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SOURCE_ROOT = path.resolve("public/3d-assets");
const OUT_ROOT = path.resolve("public/3d-assets/optimized");
const CATEGORIES = ["hero", "ingredients"];

const GLTF_TRANSFORM_CLI = path.resolve(
  "node_modules/@gltf-transform/cli/bin/cli.js"
);

if (!fs.existsSync(GLTF_TRANSFORM_CLI)) {
  console.error("gltf-transform CLI not found at:", GLTF_TRANSFORM_CLI);
  process.exit(1);
}

let totalInBytes = 0;
let totalOutBytes = 0;

for (const category of CATEGORIES) {
  const srcDir = path.join(SOURCE_ROOT, category);
  const dstDir = path.join(OUT_ROOT, category);
  fs.mkdirSync(dstDir, { recursive: true });

  const files = fs
    .readdirSync(srcDir)
    .filter((f) => f.toLowerCase().endsWith(".glb"))
    .sort();

  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const dstPath = path.join(dstDir, file);

    const budgetKB = category === "hero" ? 1500 : 400;
    const texSteps = category === "hero" ? ["1024", "768", "512"] : ["512", "384", "256"];
    let outBytes = 0;

    for (const texSize of texSteps) {
      execFileSync(
        process.execPath,
        [
          GLTF_TRANSFORM_CLI,
          "optimize",
          srcPath,
          dstPath,
          "--compress",
          "draco",
          "--texture-compress",
          "webp",
          "--texture-size",
          texSize,
        ],
        {
          stdio: ["ignore", "pipe", "inherit"],
        }
      );
      outBytes = fs.statSync(dstPath).size;
      if (outBytes / 1024 <= budgetKB) break;
    }

    const inBytes = fs.statSync(srcPath).size;
    totalInBytes += inBytes;
    totalOutBytes += outBytes;
    const savedPct = (((inBytes - outBytes) / inBytes) * 100).toFixed(1);
    console.log(
      `${category}/${file}: ${(inBytes / 1024).toFixed(1)} KB -> ${(outBytes / 1024).toFixed(1)} KB (-${savedPct}%)`
    );
  }
}

const totalSavedPct = (((totalInBytes - totalOutBytes) / totalInBytes) * 100).toFixed(1);
console.log(
  `\nTOTAL: ${(totalInBytes / 1024 / 1024).toFixed(2)} MB -> ${(totalOutBytes / 1024 / 1024).toFixed(2)} MB (-${totalSavedPct}%)`
);
