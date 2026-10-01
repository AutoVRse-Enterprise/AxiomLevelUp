import { useContent } from '@/app/contentContext'

export function useAsset(assetId?: string) {
  const { assetById } = useContent()
  return assetId ? assetById.get(assetId) : undefined
}

export function useAssetUrl(assetId?: string) {
  return useAsset(assetId)?.path
}
