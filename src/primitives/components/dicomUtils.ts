import { useContent } from '@/app/contentContext'
import type { DicomPrimitive, DicomTool } from '@/content/schema/primitives'
import type { DicomAsset } from '@/imaging/series'

export const defaultDicomTools: DicomTool[] = ['scroll', 'window', 'zoom', 'pan']

export function useDicomPrimitiveContext(primitive: DicomPrimitive) {
  const { appConfig, assetById } = useContent()
  const asset = assetById.get(primitive.content.seriesAssetId)
  if (!asset || asset.type !== 'dicom' || !asset.series) {
    throw new Error(`DICOM asset "${primitive.content.seriesAssetId}" is unavailable.`)
  }
  return { appConfig, asset: asset as DicomAsset }
}
