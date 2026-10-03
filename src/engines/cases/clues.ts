import type { AnatomyMap, CaseClue, Primitive } from '@/content/schema'
import type {
  AnatomyLocatePrimitive,
  ClassificationPrimitive,
  ImageHotspotPrimitive,
  MultipleChoicePrimitive,
  MultipleSelectPrimitive,
  ScenarioPrimitive,
  TrueFalsePrimitive,
} from '@/content/schema/primitives'
import { hitImageRegions, isNormalizedPoint } from '@/primitives/definitions/imageHitTesting'
import { isScenarioPath, traceScenarioPath } from '@/primitives/definitions/scenarioEngine'

export interface MissedClue {
  id: string
  title: string
}

export interface ResolveMissedCluesInput {
  primitive: Primitive
  response: unknown
  score: number
  clues: readonly Pick<CaseClue, 'id' | 'title'>[]
  anatomyMap?: AnatomyMap
}

export interface OpenClueResult {
  openedClueIds: readonly string[]
  newlyOpened: boolean
}

export interface ReviewClueResult {
  reviewedClueIds: readonly string[]
  newlyReviewed: boolean
}

export type CaseClueOpenContext = 'entry' | 'browse' | 'remediation'

export interface CaseClueOpenRecord {
  context: CaseClueOpenContext
  beforeResponse: boolean
}

export type CaseClueReviewMethod = 'dwell' | 'completion' | 'interaction' | 'media_progress'

export type CaseClueReviewSignal =
  | { method: 'dwell' | 'completion' | 'interaction' }
  | { method: 'media_progress'; progress: number }

const mediaClueTypes = new Set(['audio', 'video'])
const interactiveClueTypes = new Set([
  'carousel',
  'image_compare',
  'image_hotspot',
  'zoomable_image',
])

function unique(ids: readonly string[]): string[] {
  return [...new Set(ids)]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function selectedChoiceClueIds(
  primitive: MultipleChoicePrimitive,
  response: unknown,
): readonly string[] {
  if (typeof response !== 'string' || response === primitive.content.correctOptionId) return []
  return primitive.content.options.find(({ id }) => id === response)?.clueIds ?? []
}

function selectedMultipleChoiceClueIds(
  primitive: MultipleSelectPrimitive,
  response: unknown,
): readonly string[] {
  if (!Array.isArray(response)) return []
  const correctIds = new Set(primitive.content.correctOptionIds)
  return response.flatMap((selectedId) =>
    typeof selectedId === 'string' && !correctIds.has(selectedId)
      ? (primitive.content.options.find(({ id }) => id === selectedId)?.clueIds ?? [])
      : [],
  )
}

function selectedTrueFalseClueIds(
  primitive: TrueFalsePrimitive,
  response: unknown,
): readonly string[] {
  if (typeof response !== 'boolean' || response === primitive.content.answer) return []
  return primitive.content.responseClueIds?.[String(response) as 'true' | 'false'] ?? []
}

function selectedClassificationClueIds(
  primitive: ClassificationPrimitive,
  response: unknown,
): readonly string[] {
  if (!isRecord(response)) return []
  return primitive.content.items.flatMap((item) => {
    const selectedCategoryId = response[item.id]
    if (typeof selectedCategoryId !== 'string' || selectedCategoryId === item.categoryId) return []
    const category = primitive.content.categories.find(({ id }) => id === selectedCategoryId)
    return category?.clueIds ?? item.clueIds ?? []
  })
}

function selectedImageRegionClueIds(
  primitive: ImageHotspotPrimitive,
  response: unknown,
): readonly string[] {
  if (
    primitive.content.mode !== 'assess' ||
    !isNormalizedPoint(response) ||
    hitImageRegions(response, primitive.content.regions).some(({ id }) =>
      primitive.content.mode === 'assess' ? primitive.content.targetRegionIds.includes(id) : false,
    )
  ) {
    return []
  }
  return hitImageRegions(response, primitive.content.regions).flatMap(
    ({ clueIds }) => clueIds ?? [],
  )
}

function selectedScenarioClueIds(
  primitive: ScenarioPrimitive,
  response: unknown,
): readonly string[] {
  if (!isScenarioPath(response)) return []
  const traced = traceScenarioPath(primitive.content, response)
  if (!traced.valid) return []
  return traced.details.flatMap(({ decision, choice }) => {
    const scoredChoices = decision.choices.filter(({ score }) => score !== undefined)
    const bestScore =
      scoredChoices.length > 0
        ? Math.max(...scoredChoices.map(({ score }) => score ?? 0))
        : undefined
    return bestScore !== undefined && choice.score !== bestScore ? (choice.clueIds ?? []) : []
  })
}

function selectedAnatomyClueIds(
  primitive: AnatomyLocatePrimitive,
  response: unknown,
  anatomyMap?: AnatomyMap,
): readonly string[] {
  const selections = isRecord(response) ? response : {}
  return primitive.content.levels.flatMap((level) => {
    const selectedId = selections[level.levelId]
    if (typeof selectedId !== 'string') return level.clueIds ?? []

    const targetId =
      level.input === 'model'
        ? level.targetStructureId
        : level.input === 'image'
          ? level.targetRegionId
          : level.correctOptionId
    if (selectedId === targetId) return []

    const responseClueIds =
      level.input === 'model'
        ? anatomyMap?.structures.find(({ id }) => id === selectedId)?.clueIds
        : level.input === 'image'
          ? level.regions.find(({ id }) => id === selectedId)?.clueIds
          : level.options.find(({ id }) => id === selectedId)?.clueIds
    const anatomyLevelClueIds = anatomyMap?.levels.find(({ id }) => id === level.levelId)?.clueIds
    return responseClueIds ?? level.clueIds ?? anatomyLevelClueIds ?? []
  })
}

export function resolveMissedClueIds({
  primitive,
  response,
  score,
  anatomyMap,
}: Omit<ResolveMissedCluesInput, 'clues'>): string[] {
  if (!Number.isFinite(score) || score >= 1) return []

  let overrides: readonly string[] = []
  switch (primitive.type) {
    case 'multiple_choice':
      overrides = selectedChoiceClueIds(primitive as MultipleChoicePrimitive, response)
      break
    case 'multiple_select':
      overrides = selectedMultipleChoiceClueIds(primitive as MultipleSelectPrimitive, response)
      break
    case 'true_false':
      overrides = selectedTrueFalseClueIds(primitive as TrueFalsePrimitive, response)
      break
    case 'classification':
      overrides = selectedClassificationClueIds(primitive as ClassificationPrimitive, response)
      break
    case 'image_hotspot':
      overrides = selectedImageRegionClueIds(primitive as ImageHotspotPrimitive, response)
      break
    case 'scenario':
      overrides = selectedScenarioClueIds(primitive as ScenarioPrimitive, response)
      break
    case 'anatomy_locate':
      overrides = selectedAnatomyClueIds(primitive as AnatomyLocatePrimitive, response, anatomyMap)
      break
  }

  return unique(overrides.length > 0 ? overrides : (primitive.clueIds ?? []))
}

export function resolveMissedClues(input: ResolveMissedCluesInput): MissedClue[] {
  const clueById = new Map(input.clues.map((clue) => [clue.id, clue]))
  return resolveMissedClueIds(input).flatMap((id) => {
    const clue = clueById.get(id)
    return clue ? [{ id, title: clue.title }] : []
  })
}

export function openClue(openedClueIds: readonly string[], clueId: string): OpenClueResult {
  if (openedClueIds.includes(clueId)) {
    return { openedClueIds, newlyOpened: false }
  }
  return { openedClueIds: [...openedClueIds, clueId], newlyOpened: true }
}

export function reviewClue(reviewedClueIds: readonly string[], clueId: string): ReviewClueResult {
  if (reviewedClueIds.includes(clueId)) {
    return { reviewedClueIds, newlyReviewed: false }
  }
  return { reviewedClueIds: [...reviewedClueIds, clueId], newlyReviewed: true }
}

export function isClueReviewSignal(
  primitiveType: string,
  signal: CaseClueReviewSignal,
  mediaProgressThreshold: number,
): boolean {
  if (mediaClueTypes.has(primitiveType)) {
    return (
      signal.method === 'completion' ||
      (signal.method === 'media_progress' && signal.progress >= mediaProgressThreshold)
    )
  }
  if (interactiveClueTypes.has(primitiveType)) {
    return signal.method === 'completion' || signal.method === 'interaction'
  }
  return signal.method === 'dwell'
}
