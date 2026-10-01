import { readFile } from 'node:fs/promises'
import dicomParser from 'dicom-parser'

export const identifyingTags = {
  x00100010: 'PatientName',
  x00100020: 'PatientID',
  x00100030: 'PatientBirthDate',
  x00080080: 'InstitutionName',
  x00080090: 'ReferringPhysicianName',
  x00080050: 'AccessionNumber',
  x00080020: 'StudyDate',
  x00080021: 'SeriesDate',
  x00080022: 'AcquisitionDate',
  x00080023: 'ContentDate',
}

const anonymizedValues = /^(|anonymous|anonymized|anon|removed|deidentified|de-identified|research)$/i

export async function parseDicomFile(path) {
  const bytes = await readFile(path)
  return dicomParser.parseDicom(new Uint8Array(bytes))
}

export function identifyingValues(dataSet) {
  return Object.entries(identifyingTags)
    .map(([tag, name]) => ({ tag, name, value: dataSet.string(tag)?.trim() ?? '' }))
    .filter(({ value }) => value && !anonymizedValues.test(value))
}

export function sortPosition(dataSet) {
  const position = dataSet.string('x00200032')
  const z = position ? Number(position.split('\\')[2]) : Number.NaN
  const instance = Number(dataSet.string('x00200013'))
  return {
    z: Number.isFinite(z) ? z : null,
    instance: Number.isFinite(instance) ? instance : null,
  }
}
