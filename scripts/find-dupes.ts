import fs from 'fs'
import path from 'path'

const chunksDir = 'saves/test-world/chunks'
const dupes: { file: string; pos: string; types: string[] }[] = []

for (const file of fs.readdirSync(chunksDir)) {
  if (!file.endsWith('.json')) continue
  const chunk = JSON.parse(fs.readFileSync(path.join(chunksDir, file), 'utf-8'))
  const seen = new Map<string, string[]>()
  for (const ent of chunk.entities) {
    const p = ent.position
    if (!p) continue
    const key = `${p.x},${p.y},${p.z}`
    const list = seen.get(key)
    if (list) list.push(ent.entityType)
    else seen.set(key, [ent.entityType])
  }
  for (const [pos, types] of seen) {
    if (types.length > 1) dupes.push({ file, pos, types })
  }
}

if (dupes.length === 0) {
  console.log('No duplicates found')
} else {
  console.log(`${dupes.length} duplicate positions:`)
  for (const d of dupes) {
    console.log(`  ${d.file} @ (${d.pos}) -> ${d.types.join(', ')}`)
  }
}
