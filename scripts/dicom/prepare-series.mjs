import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

import { identifyingValues, parseDicomFile, sortPosition } from './dicom-utils.mjs'

const sourceDirectory = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : null
const outputDirectory = resolve(
  process.cwd(),
  process.argv[3] ?? 'public/assets/dicom/thoracic-ct/files',
)
const requestedCount = Math.min(Math.max(Number(process.argv[4] ?? 125), 1), 150)
const seriesId = process.argv[5] ?? 'thoracic-ct'

if (!sourceDirectory) {
  console.error(
    'Usage: npm run dicom:prepare -- <source-directory> [output-directory] [slice-count]',
  )
  process.exit(2)
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? listFiles(path) : [path]
    }),
  )
  return nested.flat()
}

const candidates = await listFiles(sourceDirectory)
const parsed = []

for (const file of candidates) {
  try {
    const dataSet = await parseDicomFile(file)
    const findings = identifyingValues(dataSet)
    if (findings.length) {
      throw new Error(
        `identifying metadata present (${findings.map(({ name }) => name).join(', ')})`,
      )
    }
    parsed.push({ file, ...sortPosition(dataSet) })
  } catch (error) {
    console.warn(`Skipping ${relative(sourceDirectory, file)}: ${String(error)}`)
  }
}

if (!parsed.length) {
  console.error('No parseable, PHI-audit-clean DICOM instances were found.')
  process.exit(1)
}

parsed.sort((a, b) => {
  if (a.z !== null && b.z !== null) return a.z - b.z
  if (a.instance !== null && b.instance !== null) return a.instance - b.instance
  return a.file.localeCompare(b.file)
})

const take = Math.min(requestedCount, parsed.length)
const start = Math.floor((parsed.length - take) / 2)
const selected = parsed.slice(start, start + take)
const firstDataSet = await parseDicomFile(selected[0].file)

function numberValue(tag) {
  const value = Number(firstDataSet.string(tag))
  return Number.isFinite(value) ? value : null
}

function numberPair(tag) {
  const values = firstDataSet.string(tag)?.split('\\').map(Number)
  return values?.length === 2 && values.every(Number.isFinite) ? values : null
}

await rm(outputDirectory, { recursive: true, force: true })
await mkdir(outputDirectory, { recursive: true })

const files = []
let totalBytes = 0
for (const [index, item] of selected.entries()) {
  const name = `${String(index + 1).padStart(4, '0')}.dcm`
  const destination = join(outputDirectory, name)
  await copyFile(item.file, destination)
  const sizeBytes = (await stat(destination)).size
  const sha256 = createHash('sha256')
    .update(await readFile(destination))
    .digest('hex')
  totalBytes += sizeBytes
  files.push({ path: `files/${name}`, sizeBytes, sha256 })
}

const manifest = {
  schemaVersion: '0.2',
  seriesId,
  description: `Curated ${take}-slice educational CT subset`,
  modality: firstDataSet.string('x00080060') ?? 'OT',
  transferSyntaxUid: firstDataSet.string('x00020010') ?? null,
  sourceFileCount: parsed.length,
  sliceCount: take,
  totalBytes,
  geometry: {
    rows: firstDataSet.uint16('x00280010'),
    columns: firstDataSet.uint16('x00280011'),
    pixelSpacingMm: numberPair('x00280030'),
    sliceThicknessMm: numberValue('x00180050'),
  },
  files,
  presets: [
    { id: 'lung', label: 'Lung', center: -600, width: 1500 },
    { id: 'mediastinal', label: 'Mediastinal', center: 40, width: 400 },
    { id: 'bone', label: 'Bone', center: 300, width: 1500 },
  ],
  attribution: {
    collection: 'ACRIN 6668 Trial NSCLC-FDG-PET',
    license: 'CC BY 3.0',
    doi: '10.7937/tcia.2019.30ilqfcl',
  },
}

await writeFile(
  resolve(outputDirectory, '..', 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
)
console.log(`Prepared ${take} slices (${totalBytes} bytes) in ${outputDirectory}`)
