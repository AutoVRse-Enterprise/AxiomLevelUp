import type {
  AppConfig,
  CaseClue,
  CaseDocument,
  CaseLabConfig,
  CaseStage,
  Primitive,
} from '@/content/schema'
import { buildActivityPlan, type ActivityPlan, type ActivityStep } from '@/engines/learning/plan'

export interface CaseStageBoundary {
  stageId: string
  kind: CaseStage['kind']
  component: CaseStage['component']
  title: string
  intro?: string
  clueIds: string[]
  startIndex: number
  endIndex: number
}

export interface CasePlan extends ActivityPlan {
  activity: ActivityPlan['activity'] & { kind: 'case' }
  stageBoundaries: CaseStageBoundary[]
  clueMap: ReadonlyMap<string, CaseClue>
  tierPreset: CaseLabConfig['tiers'][CaseDocument['tier']]
}

function withEntryView(primitive: Primitive, caseDoc: CaseDocument): Primitive {
  if (primitive.type !== 'anatomy_explore' && primitive.type !== 'anatomy_locate') return primitive

  const startView =
    caseDoc.entry.mode === 'overview_marker'
      ? { mode: 'marker' as const, structureId: caseDoc.entry.markerStructureId }
      : caseDoc.entry.mode === 'endoscopic'
        ? { mode: 'endoscopic' as const, waypointId: caseDoc.entry.waypointId }
        : undefined

  return startView ? { ...primitive, content: { ...primitive.content, startView } } : primitive
}

export function stageForStep(
  plan: Pick<CasePlan, 'stageBoundaries'>,
  stepIndex: number,
): CaseStageBoundary | null {
  return (
    plan.stageBoundaries.find(
      ({ startIndex, endIndex }) => stepIndex >= startIndex && stepIndex < endIndex,
    ) ?? null
  )
}

export function buildCasePlan(caseDoc: CaseDocument, config: AppConfig): CasePlan {
  const caseLab = config.caseLab
  if (!caseLab) throw new Error('Case Lab configuration is required to build a case plan.')

  let nextIndex = 0
  const stageBoundaries = caseDoc.stages.map((stage): CaseStageBoundary => {
    const startIndex = nextIndex
    nextIndex += stage.steps.length
    return {
      stageId: stage.id,
      kind: stage.kind,
      component: stage.component,
      title: stage.title,
      ...(stage.intro ? { intro: stage.intro } : {}),
      clueIds: [...stage.clueIds],
      startIndex,
      endIndex: nextIndex,
    }
  })
  const firstOrientStepId = caseDoc.stages.find(({ kind }) => kind === 'orient')?.steps[0]?.id
  const primitives = caseDoc.stages.flatMap((stage) =>
    stage.steps.map((primitive) =>
      primitive.id === firstOrientStepId ? withEntryView(primitive, caseDoc) : primitive,
    ),
  )
  const activity = {
    kind: 'case' as const,
    id: caseDoc.id,
    version: caseDoc.caseVersion,
    title: caseDoc.title,
    description: caseDoc.summary,
    estimatedMinutes: caseDoc.estimatedMinutes,
    conceptIds: caseDoc.conceptIds,
    primitives,
  }
  const base = buildActivityPlan(activity, {
    environment: 'production',
    player: config.product.player,
  })
  const clues = caseDoc.clues.map((clue) =>
    caseDoc.entry.mode === 'clue_first' && clue.id === caseDoc.entry.clueId
      ? { ...clue, essential: true }
      : clue,
  )

  return {
    ...base,
    activity,
    steps: base.steps as ActivityStep[],
    stageBoundaries,
    clueMap: new Map(clues.map((clue) => [clue.id, clue])),
    tierPreset: caseLab.tiers[caseDoc.tier],
  }
}
