import { useContent } from '@/app/contentContext'
import type { AnatomyExplorePrimitive, AnatomyLocatePrimitive } from '@/content/schema/primitives'
import { versionedModelUrl } from '@/pwa/modelCache'

export class AnatomyAssetUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AnatomyAssetUnavailableError'
  }
}

export function useAnatomyPrimitiveContext(
  primitive: AnatomyExplorePrimitive | AnatomyLocatePrimitive,
) {
  const { anatomyMapById, appConfig, assetById } = useContent()
  const map = anatomyMapById.get(primitive.content.anatomyMapId)
  if (!map) {
    throw new AnatomyAssetUnavailableError(
      `Anatomy map "${primitive.content.anatomyMapId}" is unavailable.`,
    )
  }

  const model = assetById.get(map.modelAssetId)
  if (!model || model.type !== 'model') {
    throw new AnatomyAssetUnavailableError(`Anatomy model "${map.modelAssetId}" is unavailable.`)
  }

  return { appConfig, map, model, modelUrl: versionedModelUrl(model) }
}
