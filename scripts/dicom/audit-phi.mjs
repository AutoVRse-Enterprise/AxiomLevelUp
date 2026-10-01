import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

import { identifyingValues, parseDicomFile } from './dicom-utils.mjs'

const directory = resolve(process.cwd(), process.argv[2] ?? '')

if (!process.argv[2]) {
  console.error('Usage: npm run dicom:audit -- <dicom-directory>')
  process.exit(2)
}

const files = (await readdir(directory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.(dcm|dicom)$/i.test(entry.name))
  .map((entry) => entry.name)

if (!files.length) {
  console.error(`No DICOM files found in ${directory}`)
  process.exit(2)
}

let failed = false
for (const file of files) {
  try {
    const dataSet = await parseDicomFile(resolve(directory, file))
    const findings = identifyingValues(dataSet)
    if (findings.length) {
      failed = true
      console.error(
        `${file}: identifying metadata present: ${findings.map(({ name }) => name).join(', ')}`,
      )
    }
  } catch (error) {
    failed = true
    console.error(`${file}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

if (failed) {
  console.error('PHI audit failed. Nothing should be copied into public assets.')
  process.exit(1)
}

console.log(`PHI audit passed for ${files.length} DICOM files.`)
