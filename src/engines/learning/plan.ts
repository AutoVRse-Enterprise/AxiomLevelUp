import type { AppConfig, Lesson, Primitive } from '@/content/schema'
import {
  assessmentPrimitiveTypes,
  contentPrimitiveTypes,
  domainPrimitiveTypes,
  type PrimitiveType,
} from '@/content/primitiveTypes'

export type ActivityKind = 'lesson' | 'challenge'
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
  retry: boolean
  maxAttempts: number
}

export interface ActivityPlan {
  activity: ActivityDefinition
  steps: ActivityStep[]
  playable: boolean
  unavailableReason: string | null
}

const implementedTypes = new Set<PrimitiveType>(['rich_text', 'image', 'multiple_choice'])
const contentTypes = new Set<string>(contentPrimitiveTypes)
const assessmentTypes = new Set<string>(assessmentPrimitiveTypes)
const domainTypes = new Set<string>(domainPrimitiveTypes)

function stepKind(type: string): StepKind {
  if (contentTypes.has(type)) return 'content'
  if (assessmentTypes.has(type)) return 'assessment'
  if (domainTypes.has(type)) return 'domain'
  return 'unsupported'
}

export function lessonActivity(courseId: string, courseVersion: string, lesson: Lesson): ActivityDefinition {
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

export function challengeActivity(
  challenge: AppConfig['challenges'][number],
): ActivityDefinition {
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
    const supported = implementedTypes.has(primitive.type as PrimitiveType)
    return {
      primitive,
      kind: supported ? stepKind(primitive.type) : 'unsupported',
      supported,
      retry: primitive.feedback.retry ?? options.player.retryByDefault,
      maxAttempts: primitive.feedback.maxAttempts ?? options.player.maxAttempts,
    }
  })
  const runnableCount = mapped.filter((step) => step.supported).length
  const steps =
    options.environment === 'production' ? mapped.filter((step) => step.supported) : mapped

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
