import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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

export async function updateAssetHashes(manifestPath: string, publicRoot: string) {
  const localAssetPath = (path: string) => resolve(publicRoot, path.replace(/^\/+/, ''))
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as AssetManifestFile
  manifest.schemaVersion = '0.2'

  for (const asset of manifest.assets) {
    if (asset.type === 'model') {
      asset.offlineRequired = false
      asset.offlineAvailable ??= false
    } else {
      asset.offlineAvailable ??= true
    }
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
  return manifest
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  const publicRoot = resolve(root, process.argv[3] ?? 'public')
  const manifestPath = resolve(root, process.argv[2] ?? 'public/content/assets.json')
  const manifest = await updateAssetHashes(manifestPath, publicRoot)
  console.log(
    `Updated size and SHA-256 metadata for ${manifest.assets.length} assets in ${manifestPath}.`,
  )
}
