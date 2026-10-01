import type { Source } from '@/content/schema'
import type { ActivityPlan, ActivityStep } from '@/engines/learning/plan'

export type SessionPhase = 'intro' | 'step' | 'feedback' | 'complete'

export interface PrimitiveProgress {
  attempts: number
  firstCorrect: boolean | null
  lastCorrect: boolean | null
  response: unknown
  interactions: number
  completed: boolean
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
}

export type SessionAction =
  | { type: 'start'; at: string }
  | { type: 'resume' }
  | { type: 'restart'; at: string }
  | { type: 'interact'; primitiveId: string; completed?: boolean }
  | {
      type: 'submit'
      primitiveId: string
      response: unknown
      correct: boolean
      completed: boolean
    }
  | { type: 'complete_current'; primitiveId: string }
  | { type: 'retry' }
  | { type: 'continue'; stepCount: number }
  | { type: 'finish'; at: string }

const emptyProgress = (): PrimitiveProgress => ({
  attempts: 0,
  firstCorrect: null,
  lastCorrect: null,
  response: null,
  interactions: 0,
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

export function sessionReducer(
  state: ActivitySession,
  action: SessionAction,
): ActivitySession {
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
      }
    case 'interact': {
      const current = state.progress[action.primitiveId] ?? emptyProgress()
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.primitiveId]: {
            ...current,
            interactions: current.interactions + 1,
            completed: current.completed || Boolean(action.completed),
          },
        },
      }
    }
    case 'submit': {
      const current = state.progress[action.primitiveId] ?? emptyProgress()
      const attempts = current.attempts + 1
      return {
        ...state,
        phase: 'feedback',
        progress: {
          ...state.progress,
          [action.primitiveId]: {
            ...current,
            attempts,
            firstCorrect: attempts === 1 ? action.correct : current.firstCorrect,
            lastCorrect: action.correct,
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
  const scored = plan.steps.filter((step) => step.kind === 'assessment')
  const correctCount = scored.filter(
    ({ primitive }) => session.progress[primitive.id]?.firstCorrect === true,
  ).length
  const totalWeight = scored.reduce((total, step) => total + step.primitive.scoring.weight, 0)
  const correctWeight = scored.reduce(
    (total, step) =>
      total +
      (session.progress[step.primitive.id]?.firstCorrect
        ? step.primitive.scoring.weight
        : 0),
    0,
  )
  const score = totalWeight === 0 ? 100 : Math.round((correctWeight / totalWeight) * 100)
  const accuracy =
    scored.length === 0 ? 100 : Math.round((correctCount / scored.length) * 100)
  return {
    score,
    accuracy,
    correctCount,
    scoredCount: scored.length,
    missed: scored
      .filter(({ primitive }) => session.progress[primitive.id]?.firstCorrect !== true)
      .map((step) => ({
        primitiveId: step.primitive.id,
        prompt: primitiveText(step, 'prompt') ?? 'Assessment item',
        explanation: primitiveText(step, 'explanation'),
        source: step.primitive.source,
      })),
  }
}
