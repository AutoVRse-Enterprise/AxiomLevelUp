import type { Source } from '@/content/schema'
import type { CaseClueOpenRecord } from '@/engines/cases/clues'
import type { ActivityPlan, ActivityStep } from '@/engines/learning/plan'

export type SessionPhase = 'intro' | 'step' | 'feedback' | 'complete'

export interface PrimitiveProgress {
  attempts: number
  firstCorrect: boolean | null
  lastCorrect: boolean | null
  firstScore: number | null
  lastScore: number | null
  firstTimedOut: boolean
  lastTimedOut: boolean
  firstTimeoutCreditApplied: boolean
  lastTimeoutCreditApplied: boolean
  firstResponse: unknown
  response: unknown
  draft: unknown
  interactions: number
  interactionKeys: string[]
  mediaProgress: number
  completed: boolean
}

export interface CaseProgress {
  entrySeed?: number
  openedClueIds: string[]
  reviewedClueIds: string[]
  clueOpenContexts: Record<string, CaseClueOpenRecord>
  stepElapsedMs: Record<string, number>
  caseElapsedMs: number
  caseClockExpired: boolean
  evidence: {
    pinned: Array<{ kind: 'clue' | 'finding'; id: string }>
    currentLocation?: { kind: 'waypoint' | 'structure'; id: string }
    inspectedFindingIds?: string[]
  }
  differential: Record<string, 'unlikely' | 'possible' | 'likely'>
  differentialCheckpoints: Record<string, Record<string, 'unlikely' | 'possible' | 'likely'>>
}

export interface ActivitySession {
  activityKind: ActivityPlan['activity']['kind']
  activityId: string
  activityVersion: string
  phase: SessionPhase
  stepIndex: number
  progress: Record<string, PrimitiveProgress>
  startedAt: string | null
  completedAt: string | null
  caseProgress?: CaseProgress
}

export type SessionAction =
  | { type: 'start'; at: string }
  | { type: 'resume' }
  | { type: 'restart'; at: string }
  | { type: 'draft'; primitiveId: string; draft: unknown }
  | {
      type: 'interact'
      primitiveId: string
      key?: string
      mediaProgress?: number
      completed?: boolean
    }
  | {
      type: 'submit'
      primitiveId: string
      response: unknown
      score: number
      completed: boolean
      timedOut?: boolean
      timeoutCreditApplied?: boolean
    }
  | { type: 'complete_current'; primitiveId: string }
  | { type: 'retry' }
  | { type: 'continue'; stepCount: number }
  | { type: 'finish'; at: string }

const emptyProgress = (): PrimitiveProgress => ({
  attempts: 0,
  firstCorrect: null,
  lastCorrect: null,
  firstScore: null,
  lastScore: null,
  firstTimedOut: false,
  lastTimedOut: false,
  firstTimeoutCreditApplied: false,
  lastTimeoutCreditApplied: false,
  firstResponse: null,
  response: null,
  draft: null,
  interactions: 0,
  interactionKeys: [],
  mediaProgress: 0,
  completed: false,
})

export function createActivitySession(plan: ActivityPlan): ActivitySession {
  return {
    activityKind: plan.activity.kind,
    activityId: plan.activity.id,
    activityVersion: plan.activity.version,
    phase: 'intro',
    stepIndex: 0,
    progress: Object.fromEntries(
      plan.steps.map(({ primitive }) => [primitive.id, emptyProgress()]),
    ),
    startedAt: null,
    completedAt: null,
  }
}

export function sessionMatchesPlan(session: ActivitySession, plan: ActivityPlan) {
  return (
    session.activityKind === plan.activity.kind &&
    session.activityId === plan.activity.id &&
    session.activityVersion === plan.activity.version
  )
}

export function sessionReducer(state: ActivitySession, action: SessionAction): ActivitySession {
  switch (action.type) {
    case 'start':
      return { ...state, phase: 'step', startedAt: action.at }
    case 'resume':
      return { ...state, phase: state.phase === 'intro' ? 'step' : state.phase }
    case 'restart':
      return {
        ...state,
        phase: 'step',
        stepIndex: 0,
        progress: Object.fromEntries(
          Object.keys(state.progress).map((id) => [id, emptyProgress()]),
        ),
        startedAt: action.at,
        completedAt: null,
        caseProgress: undefined,
      }
    case 'draft': {
      const current = state.progress[action.primitiveId] ?? emptyProgress()
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.primitiveId]: { ...current, draft: action.draft },
        },
      }
    }
    case 'interact': {
      const current = state.progress[action.primitiveId] ?? emptyProgress()
      const interactionKeys =
        action.key && !current.interactionKeys.includes(action.key)
          ? [...current.interactionKeys, action.key]
          : current.interactionKeys
      const mediaProgress =
        action.mediaProgress === undefined
          ? current.mediaProgress
          : Math.max(current.mediaProgress, Math.min(1, Math.max(0, action.mediaProgress)))
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.primitiveId]: {
            ...current,
            interactions: current.interactions + 1,
            interactionKeys,
            mediaProgress,
            completed: current.completed || Boolean(action.completed),
          },
        },
      }
    }
    case 'submit': {
      const current = state.progress[action.primitiveId] ?? emptyProgress()
      const attempts = current.attempts + 1
      const score = Number.isFinite(action.score) ? Math.min(1, Math.max(0, action.score)) : 0
      const correct = score === 1
      return {
        ...state,
        phase: 'feedback',
        progress: {
          ...state.progress,
          [action.primitiveId]: {
            ...current,
            attempts,
            firstCorrect: attempts === 1 ? correct : current.firstCorrect,
            lastCorrect: correct,
            firstScore: attempts === 1 ? score : current.firstScore,
            lastScore: score,
            firstTimedOut: attempts === 1 ? (action.timedOut ?? false) : current.firstTimedOut,
            lastTimedOut: action.timedOut ?? false,
            firstTimeoutCreditApplied:
              attempts === 1
                ? (action.timeoutCreditApplied ?? false)
                : current.firstTimeoutCreditApplied,
            lastTimeoutCreditApplied: action.timeoutCreditApplied ?? false,
            firstResponse: attempts === 1 ? action.response : current.firstResponse,
            response: action.response,
            completed: action.completed,
          },
        },
      }
    }
    case 'complete_current': {
      const current = state.progress[action.primitiveId] ?? emptyProgress()
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.primitiveId]: { ...current, completed: true },
        },
      }
    }
    case 'retry':
      return { ...state, phase: 'step' }
    case 'continue': {
      const isLast = state.stepIndex >= action.stepCount - 1
      return {
        ...state,
        phase: isLast ? 'complete' : 'step',
        stepIndex: isLast ? state.stepIndex : state.stepIndex + 1,
      }
    }
    case 'finish':
      return { ...state, phase: 'complete', completedAt: action.at }
  }
}

export function selectCurrentStep(session: ActivitySession, plan: ActivityPlan) {
  return plan.steps[session.stepIndex] ?? null
}

export function selectProgressFraction(session: ActivitySession, plan: ActivityPlan) {
  if (plan.steps.length === 0) return 0
  const completed = plan.steps.filter(
    ({ primitive }) => session.progress[primitive.id]?.completed,
  ).length
  return completed / plan.steps.length
}

export interface MissedItem {
  primitiveId: string
  prompt: string
  explanation: string | null
  source?: Source
}

export interface ActivitySummary {
  score: number
  accuracy: number
  correctCount: number
  scoredCount: number
  missed: MissedItem[]
}

function primitiveText(step: ActivityStep, key: 'prompt' | 'explanation') {
  const value = step.primitive.content[key]
  return typeof value === 'string' ? value : null
}

export function selectActivitySummary(
  session: ActivitySession,
  plan: ActivityPlan,
): ActivitySummary {
  const scored = plan.steps.filter((step) => step.scored)
  const correctCount = scored.filter(
    ({ primitive }) => session.progress[primitive.id]?.firstCorrect === true,
  ).length
  const totalWeight = scored.reduce((total, step) => total + step.primitive.scoring.weight, 0)
  const earnedWeight = scored.reduce(
    (total, step) =>
      total +
      (session.progress[step.primitive.id]?.firstScore ?? 0) * step.primitive.scoring.weight,
    0,
  )
  const score = totalWeight === 0 ? 100 : Math.round((earnedWeight / totalWeight) * 100)
  const accuracy = scored.length === 0 ? 100 : Math.round((correctCount / scored.length) * 100)
  return {
    score,
    accuracy,
    correctCount,
    scoredCount: scored.length,
    missed: scored
      .filter(({ primitive }) => session.progress[primitive.id]?.firstCorrect !== true)
      .map((step) => ({
        primitiveId: step.primitive.id,
        prompt: step.prompt,
        explanation: primitiveText(step, 'explanation'),
        source: step.primitive.source,
      })),
  }
}
