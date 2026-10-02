import type { AppConfig, Lesson, Primitive } from '@/content/schema'
import { resolvePrimitiveDefinition } from '@/primitives/definitions'
import type { PrimitiveLayout } from '@/primitives/definitions'

export type ActivityKind = 'lesson' | 'challenge' | 'case'
export type StepKind = 'content' | 'assessment' | 'domain' | 'unsupported'

export interface ActivityDefinition {
  kind: ActivityKind
  id: string
  courseId?: string
  version: string
  title: string
  description: string
  estimatedMinutes: number
  conceptIds: string[]
  primitives: Primitive[]
}

export interface ActivityStep {
  primitive: Primitive
  kind: StepKind
  supported: boolean
  scored: boolean
  label: string
  layout: PrimitiveLayout
  prompt: string
  explorableKeys: string[]
  timerCompatible: boolean
  retry: boolean
  maxAttempts: number
}

export interface ActivityPlan {
  activity: ActivityDefinition
  steps: ActivityStep[]
  playable: boolean
  unavailableReason: string | null
}

export function lessonActivity(
  courseId: string,
  courseVersion: string,
  lesson: Lesson,
): ActivityDefinition {
  return {
    kind: 'lesson',
    id: lesson.id,
    courseId,
    version: courseVersion,
    title: lesson.title,
    description: lesson.description,
    estimatedMinutes: lesson.estimatedMinutes,
    conceptIds: lesson.conceptIds,
    primitives: lesson.primitives,
  }
}

export function challengeActivity(challenge: AppConfig['challenges'][number]): ActivityDefinition {
  return {
    kind: 'challenge',
    id: challenge.id,
    version: '0.1',
    title: challenge.title,
    description: challenge.description,
    estimatedMinutes: challenge.estimatedMinutes,
    conceptIds: [...new Set(challenge.items.flatMap((item) => item.conceptIds))],
    primitives: challenge.items,
  }
}

export function buildActivityPlan(
  activity: ActivityDefinition,
  options: {
    environment: 'development' | 'production'
    player: AppConfig['product']['player']
  },
): ActivityPlan {
  const mapped = activity.primitives.map((primitive): ActivityStep => {
    const resolved = resolvePrimitiveDefinition(primitive)
    const family = resolved
      ? typeof resolved.definition.family === 'function'
        ? resolved.definition.family(resolved.primitive)
        : resolved.definition.family
      : 'unsupported'
    return {
      primitive,
      kind: family,
      supported: resolved !== null,
      scored: resolved?.definition.scored(resolved.primitive) ?? false,
      label: resolved?.definition.label ?? 'Activity',
      layout: resolved?.definition.layout ?? 'stacked',
      prompt: resolved?.definition.reviewPrompt(resolved.primitive) ?? 'Activity item',
      explorableKeys: resolved?.definition.explorableKeys?.(resolved.primitive) ?? [],
      timerCompatible: resolved?.definition.timerCompatible ?? false,
      retry: primitive.feedback.retry ?? options.player.retryByDefault,
      maxAttempts: primitive.feedback.maxAttempts ?? options.player.maxAttempts,
    }
  })
  const runnableCount = mapped.filter((step) => step.supported).length
  const steps = mapped

  return {
    activity,
    steps,
    playable: runnableCount > 0,
    unavailableReason:
      runnableCount > 0
        ? null
        : activity.primitives.length === 0
          ? 'This activity does not have any configured items yet.'
          : 'This activity requires learning components that are not available yet.',
  }
}
