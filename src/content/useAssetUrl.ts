import { useContent } from '@/app/contentContext'
import { versionedModelUrl } from '@/pwa/modelCache'

export function useAsset(assetId?: string) {
  const { assetById } = useContent()
  return assetId ? assetById.get(assetId) : undefined
}

export function useAssetUrl(assetId?: string) {
  const asset = useAsset(assetId)
  return asset ? versionedModelUrl(asset) : undefined
}
