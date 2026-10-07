import type { ContentRegistry } from '@/content/loader'
import type { AssetManifest, Primitive, RoundDocument } from '@/content/schema'
import { getPrimitiveAssetRefs } from '@/content/schema/primitives'

export type CreditedAsset = AssetManifest['assets'][number] & {
  provenance: NonNullable<AssetManifest['assets'][number]['provenance']>
}

function roundPrimitives(round: RoundDocument): Primitive[] {
  return [
    round.primitive,
    ...Object.values(round.primitiveByOptionSet),
    ...(round.explore ? [round.explore] : []),
    ...round.clues.map(({ primitive }) => primitive),
  ]
}

export function collectRunCredits(
  roundIds: readonly string[],
  registry: Pick<ContentRegistry, 'roundById' | 'anatomyMapById' | 'assetById'>,
): CreditedAsset[] {
  const assetIds = new Set<string>()
  roundIds.forEach((roundId) => {
    const round = registry.roundById.get(roundId)
    if (!round) return
    roundPrimitives(round).forEach((primitive) => {
      getPrimitiveAssetRefs(primitive).forEach(({ assetId }) => assetIds.add(assetId))
    })
    if (round.anatomyMapId) {
      const map = registry.anatomyMapById.get(round.anatomyMapId)
      if (map) assetIds.add(map.modelAssetId)
    }
  })

  return [...assetIds].flatMap((assetId) => {
    const asset = registry.assetById.get(assetId)
    return asset?.provenance ? [{ ...asset, provenance: asset.provenance }] : []
  })
}
