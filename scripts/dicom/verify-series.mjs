import { createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

/* global fetch */

const target = process.argv[2]
const assetManifestPath = process.argv[3]
const assetId = process.argv[4]

if (!target) {
  console.error(
    'Usage: npm run dicom:verify -- <manifest-url-or-directory> [asset-manifest] [asset-id]',
  )
  process.exit(2)
}

const isRemote = /^https?:\/\//i.test(target)

async function load(pathOrUrl) {
  if (isRemote || /^https?:\/\//i.test(pathOrUrl)) {
    const response = await fetch(pathOrUrl)
    if (!response.ok) throw new Error(`${pathOrUrl} returned ${response.status}`)
    const cors = response.headers.get('access-control-allow-origin')
    if (!cors) throw new Error(`${pathOrUrl} does not expose Access-Control-Allow-Origin`)
    return Buffer.from(await response.arrayBuffer())
  }
  return readFile(pathOrUrl)
}

const manifestLocation = isRemote
  ? new URL(target.endsWith('.json') ? target : `${target.replace(/\/?$/, '/')}manifest.json`)
  : resolve(target.endsWith('.json') ? target : join(target, 'manifest.json'))
const manifestBytes = await load(String(manifestLocation))
const manifest = JSON.parse(manifestBytes.toString('utf8'))

if (manifest.schemaVersion !== '0.2' || !Array.isArray(manifest.files)) {
  throw new Error('Expected a DICOM series manifest with schemaVersion 0.2 and files[].')
}
if (manifest.files.length !== manifest.sliceCount) {
  throw new Error(
    `sliceCount ${manifest.sliceCount} does not match ${manifest.files.length} files.`,
  )
}

const base = isRemote
  ? new URL('.', manifestLocation)
  : dirname(isAbsolute(manifestLocation) ? manifestLocation : fileURLToPath(manifestLocation))
let totalBytes = 0

for (const file of manifest.files) {
  const location = isRemote ? new URL(file.path, base) : join(base, file.path)
  const bytes = await load(String(location))
  const hash = createHash('sha256').update(bytes).digest('hex')
  if (bytes.byteLength !== file.sizeBytes) {
    throw new Error(`${file.path}: expected ${file.sizeBytes} bytes, received ${bytes.byteLength}.`)
  }
  if (hash !== file.sha256) throw new Error(`${file.path}: SHA-256 mismatch.`)
  totalBytes += bytes.byteLength
}

if (totalBytes !== manifest.totalBytes) {
  throw new Error(`Expected ${manifest.totalBytes} total bytes, received ${totalBytes}.`)
}

if (assetManifestPath || assetId) {
  if (!assetManifestPath || !assetId) {
    throw new Error('Both asset-manifest and asset-id are required for metadata verification.')
  }
  const assets = JSON.parse(await readFile(resolve(assetManifestPath), 'utf8'))
  const asset = assets.assets?.find((candidate) => candidate.assetId === assetId)
  if (!asset) throw new Error(`Asset ${assetId} was not found in ${assetManifestPath}.`)
  const expected = asset.series
  const actual = manifest.geometry
  const mismatches = [
    ['sliceCount', expected?.sliceCount, manifest.sliceCount],
    ['rows', expected?.rows, actual?.rows],
    ['columns', expected?.columns, actual?.columns],
    ['sliceThicknessMm', expected?.sliceThicknessMm, actual?.sliceThicknessMm],
  ].filter(([, left, right]) => left !== right)
  if (mismatches.length) {
    throw new Error(
      `Asset metadata mismatch: ${mismatches
        .map(([name, expectedValue, actualValue]) => `${name} ${expectedValue} != ${actualValue}`)
        .join(', ')}`,
    )
  }
}

console.log(
  `Verified ${manifest.files.length} DICOM files (${totalBytes} bytes) for ${manifest.seriesId}.`,
)
