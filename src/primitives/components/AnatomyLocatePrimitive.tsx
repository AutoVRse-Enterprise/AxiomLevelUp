import { useState } from 'react'

import { AnatomyViewer } from '@/anatomy3d/viewer/AnatomyViewer'
import { useAnatomyEntryContext } from '@/anatomy3d/viewer/entryContext'
import { useStepFindings } from '@/anatomy3d/viewer/findingContext'
import { Button } from '@/components/ui'
import type {
  AnatomyLocateLevel,
  AnatomyLocatePrimitive as AnatomyLocatePrimitiveContent,
} from '@/content/schema/primitives'
import { useAsset } from '@/content/useAssetUrl'
import { useAnatomyPrimitiveContext } from '@/primitives/components/anatomyUtils'
import { StepActionSlot } from '@/player/StepActionSlot'
import { ChoiceList } from '@/primitives/shared/ChoiceList'
import { ImageRegionOverlay } from '@/primitives/shared/ImageRegionOverlay'
import { ReviewMark } from '@/primitives/shared/ReviewMark'
import type { PrimitiveComponentProps } from '@/primitives/types'
import { usePresentation } from '@/primitives/presentation/PresentationContext'

type Selections = Record<string, string>

function readSelections(value: unknown): Selections {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
}

function responseLabel(
  level: AnatomyLocateLevel,
  selectionId: string | undefined,
  structureLabels: ReadonlyMap<string, string>,
): string {
  if (!selectionId) return 'No response'
  if (level.input === 'model') return structureLabels.get(selectionId) ?? selectionId
  const options = level.input === 'image' ? level.regions : level.options
  return options.find(({ id }) => id === selectionId)?.label ?? selectionId
}

interface LevelProps {
  level: AnatomyLocateLevel
  levelLabel: string
  selectionId?: string
  disabled: boolean
  reviewStatus?: 'correct' | 'incorrect' | 'missed'
  revealAnswer: boolean
  onSelect: (selectionId: string) => void
}

function ImageLevel({
  level,
  levelLabel,
  selectionId,
  disabled,
  reviewStatus,
  revealAnswer,
  onSelect,
}: LevelProps & { level: Extract<AnatomyLocateLevel, { input: 'image' }> }) {
  const asset = useAsset(level.assetId)
  const visibleRegionIds = new Set(
    [selectionId, revealAnswer ? level.targetRegionId : undefined].filter((id): id is string =>
      Boolean(id),
    ),
  )

  return (
    <div className="space-y-4">
      {asset ? (
        <figure className="space-y-2">
          <div
            className="relative overflow-hidden rounded-xl bg-neutral-100"
            style={
              asset.width && asset.height
                ? { aspectRatio: `${asset.width} / ${asset.height}` }
                : undefined
            }
          >
            <img alt={level.alt} className="block w-full" draggable={false} src={asset.path} />
            {visibleRegionIds.size ? (
              <ImageRegionOverlay regions={level.regions} visibleRegionIds={visibleRegionIds} />
            ) : null}
          </div>
          {level.caption ? (
            <figcaption className="text-small text-neutral-600">{level.caption}</figcaption>
          ) : null}
        </figure>
      ) : (
        <div
          className="grid min-h-48 place-items-center rounded-xl bg-neutral-100 p-6 text-neutral-600"
          role="status"
        >
          Image unavailable
        </div>
      )}
      <ChoiceList
        disabled={disabled}
        legend={levelLabel}
        name={`anatomy-locate-${level.levelId}`}
        options={level.regions}
        selectionMode="single"
        selectedIds={new Set(selectionId ? [selectionId] : [])}
        onChange={onSelect}
      />
      {revealAnswer ? (
        <p className="text-small font-medium text-success-700">
          Correct region: {level.regions.find(({ id }) => id === level.targetRegionId)?.label}
        </p>
      ) : null}
      {reviewStatus ? <ReviewMark status={reviewStatus} /> : null}
    </div>
  )
}

function ChoiceLevel({
  level,
  levelLabel,
  selectionId,
  disabled,
  reviewStatus,
  revealAnswer,
  onSelect,
}: LevelProps & { level: Extract<AnatomyLocateLevel, { input: 'choice' }> }) {
  const reviewItems =
    reviewStatus && selectionId
      ? Object.fromEntries(
          level.options.flatMap(({ id }) => {
            if (id === selectionId) return [[id, reviewStatus] as const]
            if (revealAnswer && id === level.correctOptionId) return [[id, 'missed'] as const]
            return []
          }),
        )
      : undefined

  return (
    <div className="space-y-3">
      <ChoiceList
        disabled={disabled}
        legend={levelLabel}
        name={`anatomy-locate-${level.levelId}`}
        options={level.options}
        selectionMode="single"
        selectedIds={new Set(selectionId ? [selectionId] : [])}
        reviewItems={reviewItems}
        revealAnswer={revealAnswer}
        onChange={onSelect}
      />
      {revealAnswer ? (
        <p className="text-small font-medium text-success-700">
          Correct choice: {level.options.find(({ id }) => id === level.correctOptionId)?.label}
        </p>
      ) : null}
    </div>
  )
}

export function AnatomyLocatePrimitive({
  primitive,
  mode,
  review,
  draft,
  disabled = false,
  onDraftChange,
  onInteract,
  onSubmit,
}: PrimitiveComponentProps<AnatomyLocatePrimitiveContent>) {
  const { labels } = usePresentation()
  const { appConfig, map, modelUrl } = useAnatomyPrimitiveContext(primitive)
  const entryContext = useAnatomyEntryContext()
  const findings = useStepFindings(primitive.id)
  const initial = readSelections(mode === 'review' ? review?.response : draft)
  const [selections, setSelections] = useState<Selections>(initial)
  const [levelIndex, setLevelIndex] = useState(() => {
    const firstIncomplete = primitive.content.levels.findIndex(({ levelId }) => !initial[levelId])
    return firstIncomplete < 0 ? primitive.content.levels.length - 1 : firstIncomplete
  })
  const levelLabels = new Map(map.levels.map(({ id, label }) => [id, label]))
  const structureLabels = new Map(map.structures.map(({ id, label }) => [id, label]))
  const readOnly = disabled || mode === 'review'
  const unknownEntry =
    primitive.content.answerFrom === 'entry' &&
    (entryContext.neutralNavigationLabels || entryContext.hideLocationLabels)

  const select = (level: AnatomyLocateLevel, selectionId: string) => {
    if (readOnly) return
    const next = { ...selections, [level.levelId]: selectionId }
    setSelections(next)
    onDraftChange(next)
    onInteract({
      name:
        level.input === 'model'
          ? 'anatomy_structure_selected'
          : level.input === 'image'
            ? 'anatomy_region_selected'
            : 'anatomy_choice_selected',
      key: `${level.levelId}:${selectionId}`,
      ...(level.input === 'model' ? { structureId: selectionId } : {}),
    })
  }

  const renderLevel = (level: AnatomyLocateLevel, revealAnswer: boolean) => {
    const levelLabel = levelLabels.get(level.levelId) ?? level.levelId
    const selectionId = selections[level.levelId]
    const reviewStatus = review?.evaluation.items?.[level.levelId]

    if (level.input === 'model') {
      const correctLabel = structureLabels.get(level.targetStructureId) ?? level.targetStructureId
      return (
        <div className="space-y-3">
          <AnatomyViewer
            config={appConfig.product.anatomy3d}
            disabled={readOnly}
            findings={findings}
            map={map}
            modelUrl={modelUrl}
            markerStructureId={
              primitive.content.startView.mode === 'marker'
                ? primitive.content.startView.structureId
                : undefined
            }
            navigation={primitive.content.navigation}
            orientationLabels={primitive.content.orientationLabels}
            neutralNavigationLabels={
              unknownEntry && mode === 'interactive' && entryContext.neutralNavigationLabels
            }
            hideLocationLabels={
              unknownEntry && mode === 'interactive' && entryContext.hideLocationLabels
            }
            prompt={levelLabel}
            selectableLevelIds={[level.levelId]}
            selectedStructureIds={
              revealAnswer ? [level.targetStructureId] : selectionId ? [selectionId] : []
            }
            startView={primitive.content.startView}
            onFailed={(reason) => {
              if (!readOnly) onInteract({ name: 'anatomy_viewer_failed', reason })
            }}
            onLoaded={(result, loadMs) => {
              if (!readOnly)
                onInteract({
                  name: 'anatomy_viewer_loaded',
                  loadMs,
                  meshCount: result.meshNames.length,
                  triangleCount: result.triangleCount,
                })
            }}
            onFindingInspected={(findingId) => {
              if (!readOnly) {
                onInteract({
                  name: 'anatomy_finding_inspected',
                  findingId,
                  key: `finding:${findingId}`,
                })
              }
            }}
            onStructureSelected={(structureId) => select(level, structureId)}
          />
          {mode === 'review' ? (
            <div className="flex flex-wrap items-center gap-2 text-small">
              <span>Your response: {responseLabel(level, selectionId, structureLabels)}</span>
              {reviewStatus ? <ReviewMark status={reviewStatus} /> : null}
              {revealAnswer ? (
                <span className="font-medium text-success-700">
                  Correct structure: {correctLabel}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      )
    }

    const commonProps: LevelProps = {
      level,
      levelLabel,
      selectionId,
      disabled: readOnly,
      reviewStatus,
      revealAnswer,
      onSelect: (selection) => select(level, selection),
    }
    return level.input === 'image' ? (
      <ImageLevel {...commonProps} level={level} />
    ) : (
      <ChoiceLevel {...commonProps} level={level} />
    )
  }

  if (mode === 'review') {
    return (
      <div className="space-y-6">
        <header>
          <h2 className="text-title font-bold text-neutral-950">{primitive.content.prompt}</h2>
          <p className="mt-1 text-small text-neutral-600">Review each localisation level.</p>
        </header>
        {primitive.content.levels.map((level) => (
          <section className="space-y-3" key={level.levelId}>
            <h3 className="text-lg font-semibold text-neutral-950">
              {levelLabels.get(level.levelId) ?? level.levelId}
            </h3>
            {renderLevel(level, Boolean(review?.revealAnswer))}
          </section>
        ))}
      </div>
    )
  }

  const level = primitive.content.levels[levelIndex]!
  const selected = Boolean(selections[level.levelId])
  const lastLevel = levelIndex === primitive.content.levels.length - 1

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (lastLevel && selected) onSubmit(selections)
      }}
    >
      <header>
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-700">
          {labels.levelProgress(levelIndex + 1, primitive.content.levels.length)}
        </p>
        <h2 className="mt-1 text-title font-bold text-neutral-950">{primitive.content.prompt}</h2>
      </header>
      {renderLevel(level, false)}
      <StepActionSlot className="justify-between">
        <div className="flex w-full flex-wrap justify-between gap-3">
          <Button
            disabled={disabled || levelIndex === 0}
            type="button"
            variant="secondary"
            onClick={() => setLevelIndex((current) => Math.max(0, current - 1))}
          >
            {labels.previousLevel}
          </Button>
          {lastLevel ? (
            <Button disabled={disabled || !selected} type="submit">
              {labels.commitLocalisation}
            </Button>
          ) : (
            <Button
              disabled={disabled || !selected}
              type="button"
              onClick={() =>
                setLevelIndex((current) =>
                  Math.min(primitive.content.levels.length - 1, current + 1),
                )
              }
            >
              {labels.nextLevel}
            </Button>
          )}
        </div>
      </StepActionSlot>
    </form>
  )
}
