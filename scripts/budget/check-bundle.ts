import { gzipSync } from 'node:zlib'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

interface Budget {
  pattern: string
  maxRawBytes: number
  maxGzipBytes: number
  optional?: boolean
}

const root = process.cwd()
const assetsDirectory = join(root, 'dist', 'assets')
const configPath = join(root, 'scripts', 'budget', 'bundle-budget.json')
const budgets = JSON.parse(await readFile(configPath, 'utf8')) as Record<string, Budget>
const files = await readdir(assetsDirectory)
let failed = false

for (const [name, budget] of Object.entries(budgets)) {
  const matcher = new RegExp(budget.pattern, 'i')
  const filename = files.find((file) => matcher.test(file))

  if (!filename) {
    if (budget.optional) {
      console.log(`Bundle budget: ${name} is not present (optional).`)
      continue
    }
    console.error(`Bundle budget: required ${name} chunk was not found (${budget.pattern}).`)
    failed = true
    continue
  }

  const source = await readFile(join(assetsDirectory, filename))
  const rawBytes = source.byteLength
  const gzipBytes = gzipSync(source).byteLength
  const rawPasses = rawBytes <= budget.maxRawBytes
  const gzipPasses = gzipBytes <= budget.maxGzipBytes

  console.log(
    `Bundle budget: ${name} ${filename} — ${rawBytes} raw / ${gzipBytes} gzip bytes ` +
      `(limits ${budget.maxRawBytes} / ${budget.maxGzipBytes}).`,
  )

  if (!rawPasses || !gzipPasses) failed = true
}

if (failed) {
  console.error('Bundle budget failed.')
  process.exitCode = 1
} else {
  console.log('Bundle budget passed.')
}
