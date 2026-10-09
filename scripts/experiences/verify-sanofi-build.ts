import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

interface ContentManifest {
  appConfig: string
  courses: string[]
  cases: string[]
  anatomyMaps: string[]
  rounds: string[]
  games: string[]
  seeds: Record<string, string>
  assetManifest: string
}

interface AssetManifest {
  assets: Array<{ path: string; sha256?: string; type: string }>
}

const root = process.cwd()
const outputRoot = resolve(root, 'dist-sanofi')
const contentPrefix = 'experiences/sanofi/content'
const maximumArtifactBytes = 90 * 1024 * 1024

function posix(path: string) {
  return path.split(sep).join('/')
}

async function listFiles(directory: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(absolute)))
    else files.push(posix(relative(outputRoot, absolute)))
  }
  return files
}

const files = (await listFiles(outputRoot)).sort()
const forbidden = files.filter(
  (file) =>
    file.startsWith('content/') ||
    file.startsWith('experiences/default/') ||
    /(?:^|\/)fixture-[^/]+\.json$/i.test(file),
)
assert.deepEqual(forbidden, [], `Sanofi release contains forbidden files:\n${forbidden.join('\n')}`)

const manifestPath = resolve(outputRoot, contentPrefix, 'manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ContentManifest
assert.equal(
  JSON.stringify(manifest).includes('fixture-'),
  false,
  'Sanofi production manifest references test fixtures.',
)
const requiredContent = [
  'manifest.json',
  manifest.appConfig,
  ...manifest.courses,
  ...manifest.cases,
  ...manifest.anatomyMaps,
  ...manifest.rounds,
  ...manifest.games,
  ...Object.values(manifest.seeds),
  manifest.assetManifest,
].map((path) => `${contentPrefix}/${posix(path)}`)
for (const file of requiredContent) {
  assert.ok(files.includes(file), `Sanofi release is missing content document: ${file}`)
}

const assets = JSON.parse(
  await readFile(resolve(outputRoot, contentPrefix, manifest.assetManifest), 'utf8'),
) as AssetManifest
for (const asset of assets.assets) {
  if (asset.type === 'dicom') {
    const manifestFile = `assets/dicom/${asset.path.replace(/^\/+/, '')}`
    assert.ok(files.includes(manifestFile), `Sanofi release is missing DICOM manifest: ${manifestFile}`)
    const hosted = JSON.parse(await readFile(resolve(outputRoot, manifestFile), 'utf8')) as {
      files?: Array<{ path: string }>
    }
    const manifestDirectory = manifestFile.slice(0, manifestFile.lastIndexOf('/'))
    for (const slice of hosted.files ?? []) {
      const sliceFile = `${manifestDirectory}/${slice.path.replace(/^\/+/, '')}`
      assert.ok(files.includes(sliceFile), `Sanofi release is missing DICOM slice: ${sliceFile}`)
    }
    continue
  }
  const file = asset.path.replace(/^\/+/, '')
  assert.ok(files.includes(file), `Sanofi release is missing configured asset: ${file}`)
}

const serviceWorker = await readFile(resolve(outputRoot, 'sw.js'), 'utf8')
for (const asset of assets.assets) {
  if (asset.type === 'dicom') continue
  const expected =
    asset.type === 'model' && asset.sha256 ? `${asset.path}?v=${asset.sha256}` : asset.path
  assert.ok(
    serviceWorker.includes(expected),
    `Sanofi service worker does not precache configured asset: ${expected}`,
  )
}

let totalBytes = 0
const digest = createHash('sha256')
for (const file of files) {
  const absolute = resolve(outputRoot, file)
  const size = (await stat(absolute)).size
  totalBytes += size
  digest.update(file)
  digest.update(await readFile(absolute))
}
assert.ok(
  totalBytes <= maximumArtifactBytes,
  `Sanofi release is ${totalBytes} bytes; maximum is ${maximumArtifactBytes}.`,
)

console.log(
  `Sanofi release verified: ${files.length} files, ${totalBytes} bytes, sha256 ${digest.digest('hex')}.`,
)
