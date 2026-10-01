import { z } from 'zod'

import type { AssetManifest } from '@/content/schema'
import { resolveDicomUrl } from '@/imaging/seriesUrl'

const fileSchema = z.strictObject({
  path: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
})

export const dicomSeriesManifestSchema = z.strictObject({
  schemaVersion: z.literal('0.2'),
  seriesId: z.string().min(1),
  description: z.string().min(1),
  modality: z.string().min(1),
  transferSyntaxUid: z.string().min(1),
  sourceFileCount: z.number().int().positive(),
  sliceCount: z.number().int().positive(),
  totalBytes: z.number().int().positive(),
  geometry: z.strictObject({
    rows: z.number().int().positive(),
    columns: z.number().int().positive(),
    pixelSpacingMm: z.tuple([z.number().positive(), z.number().positive()]),
    sliceThicknessMm: z.number().positive(),
  }),
  files: z.array(fileSchema).min(1),
  presets: z.array(
    z.strictObject({
      id: z.string().min(1),
      label: z.string().min(1),
      center: z.number(),
      width: z.number().positive(),
    }),
  ),
  attribution: z.strictObject({
    collection: z.string().min(1),
    license: z.string().min(1),
    doi: z.string().min(1),
  }),
})

export type DicomSeriesManifest = z.infer<typeof dicomSeriesManifestSchema>
export type DicomAsset = AssetManifest['assets'][number] & {
  type: 'dicom'
  series: NonNullable<AssetManifest['assets'][number]['series']>
}

export async function loadDicomSeries(
  asset: DicomAsset,
  baseUrl?: string,
  signal?: AbortSignal,
): Promise<{ manifest: DicomSeriesManifest; manifestUrl: URL; imageUrls: URL[] }> {
  const manifestUrl = resolveDicomUrl(asset.path, baseUrl)
  const response = await fetch(manifestUrl, { signal })
  if (!response.ok) throw new Error(`DICOM series manifest returned ${response.status}.`)
  const manifest = dicomSeriesManifestSchema.parse(await response.json())
  assertManifestMatchesAsset(manifest, asset)
  if (manifest.files.length !== manifest.sliceCount) {
    throw new Error('DICOM manifest file count does not match its slice count.')
  }
  return {
    manifest,
    manifestUrl,
    imageUrls: manifest.files.map(({ path }) => new URL(path, manifestUrl)),
  }
}

export function assertManifestMatchesAsset(manifest: DicomSeriesManifest, asset: DicomAsset) {
  const expected = asset.series
  const actual = manifest.geometry
  const equalSpacing = expected.pixelSpacingMm.every(
    (value, index) => value === actual.pixelSpacingMm[index],
  )
  if (
    expected.sliceCount !== manifest.sliceCount ||
    expected.rows !== actual.rows ||
    expected.columns !== actual.columns ||
    expected.sliceThicknessMm !== actual.sliceThicknessMm ||
    !equalSpacing
  ) {
    throw new Error('Hosted DICOM geometry does not match validated course metadata.')
  }
}
