/**
 * Re-export the test-world save so that Trait.save() (delta-only) produces
 * clean JSON files. Fields matching current defaults will be stripped.
 *
 * Usage:  npx tsx scripts/resave.ts [save-name]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { type WorldManifest, type ChunkData } from '@repo/state'
import { bootstrap, importWorld, exportChunk, exportManifest } from '@repo/engine'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SAVES_DIR = path.resolve(__dirname, '../saves')
const saveName = process.argv[2] ?? 'test-world'
const worldDir = path.join(SAVES_DIR, saveName)

// Load.
const manifest = JSON.parse(fs.readFileSync(path.join(worldDir, 'world.json'), 'utf-8')) as WorldManifest
const chunksDir = path.join(worldDir, 'chunks')
const chunks: ChunkData[] = []
for (const file of fs.readdirSync(chunksDir)) {
  if (file.endsWith('.json')) {
    chunks.push(JSON.parse(fs.readFileSync(path.join(chunksDir, file), 'utf-8')) as ChunkData)
  }
}

bootstrap()
const { world } = importWorld(manifest, chunks)

// Re-export chunks.
const chunkCoords = Object.values(manifest.chunks).map(c => ({ cx: c.cx, cy: c.cy }))
for (const { cx, cy } of chunkCoords) {
  const chunk = exportChunk(world, cx, cy, manifest.chunkSize)
  const file = path.join(chunksDir, `${cx}_${cy}.json`)
  fs.writeFileSync(file, JSON.stringify(chunk, null, 2) + '\n')
  console.log(`  wrote ${cx}_${cy}.json (${chunk.entities.length} entities)`)
}

// Re-export manifest.
const newManifest = exportManifest(world, manifest.seed, manifest.chunkSize, chunkCoords)
fs.writeFileSync(path.join(worldDir, 'world.json'), JSON.stringify(newManifest, null, 2) + '\n')
console.log(`  wrote world.json`)

console.log(`Done — re-saved "${saveName}".`)
