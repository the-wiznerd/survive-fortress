import fs from 'node:fs'
import path from 'node:path'

/**
 * Scan directories for exported names and build an imports map
 * suitable for unplugin-auto-import's `imports` option.
 *
 * Unlike the built-in `dirs` option, this handles abstract classes.
 * Module paths are relative to `baseDir` so the generated .d.ts
 * resolves correctly for tsc.
 */
export function scanExports(dirs: string[], baseDir: string): Record<string, string[]> {
  const exportRe = /export\s+(?:abstract\s+)?(?:class|function|const|let|var|enum)\s+(\w+)/g
  const result: Record<string, string[]> = {}
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.ts') || file.endsWith('.d.ts')) continue
      const filePath = path.join(dir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const names: string[] = []
      for (const match of content.matchAll(exportRe)) {
        names.push(match[1])
      }
      if (names.length > 0) {
        const relPath = './' + path.relative(baseDir, filePath).replace(/\.ts$/, '')
        result[relPath] = names
      }
    }
  }
  return result
}
