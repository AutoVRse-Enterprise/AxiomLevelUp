import { useContent } from '@/app/contentContext'

export function useAssetUrl(assetId?: string) {
  const { assetById } = useContent()
  return assetId ? assetById.get(assetId)?.path : undefined
}
