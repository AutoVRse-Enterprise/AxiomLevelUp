import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'

function filesUnder(path: string): string[] {
  const entries = readdirSync(path, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const entryPath = resolve(path, entry.name)
    return entry.isDirectory() ? filesUnder(entryPath) : [entryPath]
  })
}

export function resolveBuildId(
  root: string,
  configuredId: string | undefined,
  packageVersion: string,
): string {
  if (configuredId?.trim()) return configuredId.trim()

  const inputs = [
    resolve(root, 'src'),
    resolve(root, 'public/content'),
    resolve(root, 'package.json'),
    resolve(root, 'package-lock.json'),
    resolve(root, 'vite.config.ts'),
  ]
  const files = inputs
    .flatMap((input) => (statSync(input).isDirectory() ? filesUnder(input) : [input]))
    .sort((left, right) => left.localeCompare(right))
  const digest = createHash('sha256')

  for (const file of files) {
    digest.update(relative(root, file).replaceAll('\\', '/'))
    digest.update('\0')
    digest.update(readFileSync(file))
    digest.update('\0')
  }

  return `${packageVersion}+${digest.digest('hex').slice(0, 12)}`
}
