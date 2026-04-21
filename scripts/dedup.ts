import fs from 'fs'
import path from 'path'

const saveName = process.argv[2]
if (!saveName) {
  console.error('Usage: npx tsx scripts/dedup.ts <save-name>')
  process.exit(1)
}
const chunksDir = `saves/${saveName}/chunks`
const priority: Record<string, number> = { stone: 0, sand: 1, dirt: 2, water: 3 }
let removed = 0

type EntityPos = { x?: number; y?: number; z?: number }
type DedupEntity = { entityType?: string; position?: EntityPos } & Record<string, unknown>
type SaveChunk = { entities: DedupEntity[] } & Record<string, unknown>

for (const file of fs.readdirSync(chunksDir)) {
  if (!file.endsWith('.json')) continue
  const filePath = path.join(chunksDir, file)
  const chunk = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SaveChunk

  // Group entities by position key
  const groups = new Map<string, DedupEntity[]>()
  for (const ent of chunk.entities) {
    const p = ent.position ?? { x: 0, y: 0, z: 0 }
    const key = `${p.x ?? 0},${p.y ?? 0},${p.z ?? 0}`
    const list = groups.get(key)
    if (list) list.push(ent)
    else groups.set(key, [ent])
  }

  const deduped: DedupEntity[] = []
  for (const [, ents] of groups) {
    if (ents.length === 1) {
      deduped.push(ents[0])
      continue
    }
    // Pick the entity with highest priority (lowest number)
    ents.sort((a, b) => (priority[a.entityType ?? ''] ?? 99) - (priority[b.entityType ?? ''] ?? 99))
    deduped.push(ents[0])
    removed += ents.length - 1
    console.log(`  ${file}: kept ${ents[0].entityType ?? 'unknown'}, removed ${ents.slice(1).map(e => e.entityType ?? 'unknown').join(', ')} at (${ents[0].position?.x ?? 0},${ents[0].position?.y ?? 0},${ents[0].position?.z ?? 0})`)
  }

  chunk.entities = deduped
  fs.writeFileSync(filePath, JSON.stringify(chunk))
}

console.log(`\nRemoved ${removed} duplicate entities.`)
