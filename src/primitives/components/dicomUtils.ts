import { useContent } from '@/app/contentContext'
import type { DicomPrimitive, DicomTool } from '@/content/schema/primitives'
import type { DicomAsset } from '@/imaging/series'

export const defaultDicomTools: DicomTool[] = ['scroll', 'window', 'zoom', 'pan']

export class DicomAssetUnavailableError extends Error {
  constructor(assetId: string) {
    super(`DICOM asset "${assetId}" is unavailable.`)
    this.name = 'DicomAssetUnavailableError'
  }
}

export function useDicomPrimitiveContext(primitive: DicomPrimitive) {
  const { appConfig, assetById } = useContent()
  const asset = assetById.get(primitive.content.seriesAssetId)
  if (!asset || asset.type !== 'dicom' || !asset.series) {
    throw new DicomAssetUnavailableError(primitive.content.seriesAssetId)
  }
  return { appConfig, asset: asset as DicomAsset }
}
