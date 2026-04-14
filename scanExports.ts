import fs from 'node:fs'
import path from 'node:path'

/**
 * Scan directories for exported names, distinguishing values from types.
 * Classes are emitted as both (they're usable as values and type annotations).
 */
export interface PackageExports {
  values: string[]
  types: string[]
}

function scanDir(dir: string): PackageExports {
  const valueRe = /export\s+(?:abstract\s+)?(?:class|function|const|let|var|enum)\s+(\w+)/g
  const typeRe = /export\s+(?:interface|type)\s+(\w+)/g
  const values: string[] = []
  const types: string[] = []
  if (!fs.existsSync(dir)) return { values, types }
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.ts') || file.endsWith('.d.ts')) continue
    const content = fs.readFileSync(path.join(dir, file), 'utf-8')
    for (const m of content.matchAll(valueRe)) {
      values.push(m[1])
      // Classes are usable as type annotations too.
      if (/class/.test(m[0])) types.push(m[1])
    }
    for (const m of content.matchAll(typeRe)) types.push(m[1])
  }
  return { values, types }
}

type ImportEntry = string | { name: string; type: true }
type Preset = { from: string; imports: ImportEntry[] }

function makePreset(from: string, exports: PackageExports): Preset {
  return {
    from,
    imports: [
      ...exports.values,
      ...exports.types.map(t => ({ name: t, type: true as const })),
    ],
  }
}

/**
 * Build an imports preset array for unplugin-auto-import.
 *
 * Keys starting with `@` are treated as **package-level** imports:
 *   all exports from all dirs are grouped under one package specifier.
 *
 * Keys starting with `~` are treated as **alias-level** imports:
 *   each file gets its own import path (`~alias/subdir/filename`),
 *   avoiding circular dependencies within a package.
 *
 * @param packages  Map of package/alias → array of source directories.
 * @param aliasRoot  For alias keys, the root dir to compute relative sub-paths.
 */
export function buildAutoImports(
  packages: Record<string, string[]>,
  aliasRoot?: string,
): Preset[] {
  const presets: Preset[] = []
  for (const [key, dirs] of Object.entries(packages)) {
    if (key.startsWith('~')) {
      // Per-file mapping (avoids circular imports within a package).
      const root = aliasRoot ?? ''
      for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue
        for (const file of fs.readdirSync(dir)) {
          if (!file.endsWith('.ts') || file.endsWith('.d.ts')) continue
          if (file === 'index.ts') continue
          const filePath = path.join(dir, file)
          const rel = path.relative(root, filePath).replace(/\.ts$/, '')
          const from = `${key}/${rel}`
          const content = fs.readFileSync(filePath, 'utf-8')
          const exports = scanFileContent(content)
          if (exports.values.length > 0 || exports.types.length > 0) {
            presets.push(makePreset(from, exports))
          }
        }
      }
    } else {
      // Package-level mapping (cross-package).
      const merged: PackageExports = { values: [], types: [] }
      for (const dir of dirs) {
        const info = scanDir(dir)
        merged.values.push(...info.values)
        merged.types.push(...info.types)
      }
      presets.push(makePreset(key, merged))
    }
  }
  return presets
}

function scanFileContent(content: string): PackageExports {
  const valueRe = /export\s+(?:abstract\s+)?(?:class|function|const|let|var|enum)\s+(\w+)/g
  const typeRe = /export\s+(?:interface|type)\s+(\w+)/g
  const values: string[] = []
  const types: string[] = []
  for (const m of content.matchAll(valueRe)) {
    values.push(m[1])
    if (/class/.test(m[0])) types.push(m[1])
  }
  for (const m of content.matchAll(typeRe)) types.push(m[1])
  return { values, types }
}
