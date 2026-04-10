#!/usr/bin/env node

/**
 * Aseprite → PNG + JSON atlas exporter.
 *
 * Usage:
 *   node scripts/export-sprites.mjs                 # one-shot export
 *   node scripts/export-sprites.mjs --watch          # watch for changes
 *
 * Reads all .aseprite files from the project root and outputs
 * PNG sprite sheets + JSON atlas metadata to packages/dev-ui/public/sprites/.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Aseprite = require('ase-parser');
const sharp = require('sharp');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INPUT_DIR = path.resolve(ROOT, 'packages/dev-ui'); // .aseprite files in dev-ui
const OUTPUT_DIR = path.resolve(ROOT, 'packages/dev-ui/public/sprites');

function findAsepriteFiles() {
  return fs.readdirSync(INPUT_DIR).filter((f) => f.endsWith('.aseprite'));
}

async function exportFile(filename) {
  const filepath = path.join(INPUT_DIR, filename);
  const buf = fs.readFileSync(filepath);
  const ase = new Aseprite(buf, filename);
  ase.parse();

  const baseName = path.basename(filename, '.aseprite');
  const frames = [];

  for (let i = 0; i < ase.frames.length; i++) {
    const frame = ase.frames[i];

    // ase-parser gives us raw RGBA pixel data per frame
    const cels = frame.cels;
    // Create a blank RGBA buffer for the full frame
    const frameBuf = Buffer.alloc(ase.width * ase.height * 4, 0);

    for (const cel of cels) {
      const layer = ase.layers[cel.layerIndex];
      if (layer && layer.flags && layer.flags.visible === false) continue;

      const celData = cel.rawCelData;
      if (!celData) continue;

      // Blit cel into frame buffer at cel.xpos, cel.ypos
      for (let y = 0; y < cel.h; y++) {
        for (let x = 0; x < cel.w; x++) {
          const srcIdx = (y * cel.w + x) * 4;
          const dstX = cel.xpos + x;
          const dstY = cel.ypos + y;
          if (dstX < 0 || dstX >= ase.width || dstY < 0 || dstY >= ase.height)
            continue;
          const dstIdx = (dstY * ase.width + dstX) * 4;
          // Alpha composite (src over dst)
          const srcA = celData[srcIdx + 3] / 255;
          if (srcA === 0) continue;
          frameBuf[dstIdx] = celData[srcIdx]; // R
          frameBuf[dstIdx + 1] = celData[srcIdx + 1]; // G
          frameBuf[dstIdx + 2] = celData[srcIdx + 2]; // B
          frameBuf[dstIdx + 3] = Math.round(
            Math.min(255, celData[srcIdx + 3] + frameBuf[dstIdx + 3] * (1 - srcA))
          );
        }
      }
    }

    frames.push({
      duration: frame.frameDuration,
      buffer: frameBuf,
    });
  }

  // For a single-frame file, output a single PNG.
  // For multi-frame, pack horizontally into a strip.
  const totalWidth = ase.width * frames.length;
  const totalHeight = ase.height;

  const composites = frames.map((f, i) => ({
    input: f.buffer,
    raw: { width: ase.width, height: ase.height, channels: 4 },
    left: i * ase.width,
    top: 0,
  }));

  const sheet = sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png();

  const pngPath = path.join(OUTPUT_DIR, `${baseName}.png`);
  await sheet.toFile(pngPath);

  // JSON atlas
  const atlas = {
    image: `${baseName}.png`,
    frameWidth: ase.width,
    frameHeight: ase.height,
    frames: frames.map((f, i) => ({
      index: i,
      x: i * ase.width,
      y: 0,
      w: ase.width,
      h: ase.height,
      duration: f.duration,
    })),
    tags: (ase.tags || []).map((t) => ({
      name: t.name,
      from: t.from,
      to: t.to,
      direction: t.animDirection,
    })),
  };

  const jsonPath = path.join(OUTPUT_DIR, `${baseName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(atlas, null, 2));

  console.log(`  ✓ ${filename} → ${baseName}.png (${totalWidth}×${totalHeight}, ${frames.length} frame(s))`);
}

async function exportAll() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const files = findAsepriteFiles();
  if (files.length === 0) {
    console.log('No .aseprite files found.');
    return;
  }
  console.log(`Exporting ${files.length} file(s)...`);
  for (const f of files) {
    await exportFile(f);
  }
  console.log('Done.');
}

// ─── Watch mode ───

if (process.argv.includes('--watch')) {
  const { watch } = await import('chokidar');
  console.log('Watching for .aseprite changes...');
  await exportAll();

  const watcher = watch('*.aseprite', { cwd: INPUT_DIR, ignoreInitial: true });
  watcher.on('change', async (filename) => {
    console.log(`\n${filename} changed:`);
    await exportFile(filename);
  });
  watcher.on('add', async (filename) => {
    console.log(`\n${filename} added:`);
    await exportFile(filename);
  });
} else {
  await exportAll();
}
