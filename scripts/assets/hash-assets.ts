import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

interface AssetRecord {
  assetId: string
  path: string
  type: string
  offlineRequired: boolean
  offlineAvailable?: boolean
  sizeBytes?: number
  sha256?: string
  [key: string]: unknown
}

interface AssetManifestFile {
  schemaVersion: string
  assets: AssetRecord[]
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const publicRoot = resolve(root, 'public')
const manifestPath = resolve(publicRoot, 'content/assets.json')

function localAssetPath(path: string) {
  return resolve(publicRoot, path.replace(/^\/+/, ''))
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as AssetManifestFile
manifest.schemaVersion = '0.2'

for (const asset of manifest.assets) {
  asset.offlineAvailable ??= true
  if (asset.type === 'dicom') {
    const hostedManifest = JSON.parse(
      await readFile(localAssetPath(`/assets/dicom/${asset.path}`), 'utf8'),
    ) as { totalBytes: number }
    asset.sizeBytes = hostedManifest.totalBytes
    delete asset.sha256
    continue
  }

  const bytes = await readFile(localAssetPath(asset.path))
  asset.sizeBytes = bytes.byteLength
  asset.sha256 = createHash('sha256').update(bytes).digest('hex')
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Updated size and SHA-256 metadata for ${manifest.assets.length} assets.`)
