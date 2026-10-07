import { AnatomyViewer } from '@/anatomy3d/viewer/AnatomyViewer'
import type { AnatomyMap, AppConfig } from '@/content/schema'
import type { GameConfig } from '@/content/schema/game'
import type { AnatomyLocatePrimitive } from '@/content/schema/primitives'
import { useAsset } from '@/content/useAssetUrl'
import type { PlannedRound } from '@/engines/games/plan'

export function PinReveal({
  plannedRound,
  response,
  map,
  config,
  copy,
}: {
  plannedRound: PlannedRound
  response: unknown
  map: AnatomyMap
  config: AppConfig['product']['anatomy3d']
  copy: NonNullable<GameConfig['copy']>
}) {
  const asset = useAsset(map.modelAssetId)
  if (!asset || plannedRound.primitive.type !== 'anatomy_locate') return null
  const primitive = plannedRound.primitive as AnatomyLocatePrimitive
  const selections =
    response && typeof response === 'object' && !Array.isArray(response)
      ? (response as Record<string, unknown>)
      : {}
  const structureIds = new Set(map.structures.map(({ id }) => id))
  const guessStructureIds = primitive.content.levels.flatMap((level) => {
    const selection = selections[level.levelId]
    return typeof selection === 'string' && structureIds.has(selection) ? [selection] : []
  })
  const actualStructureIds = primitive.content.levels.flatMap((level) => {
    const target =
      level.input === 'model' || level.input === 'structure_choice' ? level.targetStructureId : null
    return target && structureIds.has(target) ? [target] : []
  })

  return (
    <div className="mt-5 space-y-3">
      <div className="flex flex-wrap gap-4 text-small">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-full"
            style={{ background: config.comparisonStyles.guess.color }}
          />
          {copy.pinGuessLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-full"
            style={{ background: config.comparisonStyles.actual.color }}
          />
          {copy.pinActualLabel}
        </span>
      </div>
      <AnatomyViewer
        comparison={{ actualStructureIds, guessStructureIds }}
        config={config}
        disabled
        hideLocationLabels
        map={map}
        modelUrl={asset.path}
        navigation="orbit"
        orientationLabels="hidden"
        prompt={copy.pinRevealPrompt}
        startView={{ mode: 'overview' }}
      />
    </div>
  )
}
