import type { LearnerEventDraft, MediaProgressMilestone } from '@/events/types'
import type { PrimitiveInteraction } from '@/primitives/types'

const MEDIA_MILESTONES = [25, 50, 75, 100] as const

interface InteractionEventContext {
  activityKind: 'lesson' | 'challenge'
  activityId: string
  primitiveId: string
  primitiveType: string
}

export function crossedMediaMilestones(
  previousProgress: number,
  nextProgress: number,
): MediaProgressMilestone[] {
  const previous = Math.min(1, Math.max(0, previousProgress))
  const next = Math.min(1, Math.max(previous, nextProgress))

  return MEDIA_MILESTONES.filter(
    (milestone) => previous < milestone / 100 && next >= milestone / 100,
  )
}

export function mapInteractionToEvents(
  context: InteractionEventContext,
  interaction: PrimitiveInteraction,
  previousMediaProgress: number,
): LearnerEventDraft[] {
  const events: LearnerEventDraft[] = [
    {
      event: 'artifact_interacted',
      ...context,
      interaction,
    },
  ]

  if (interaction.name === 'scenario_decision' && 'nodeId' in interaction) {
    events.push({
      event: 'scenario_decision_made',
      ...context,
      nodeId: interaction.nodeId,
      choiceId: interaction.choiceId,
      decisionIndex: interaction.decisionIndex,
    })
  }

  if (interaction.name === 'media_progress' && 'fraction' in interaction) {
    for (const milestone of crossedMediaMilestones(previousMediaProgress, interaction.fraction)) {
      events.push({
        event: 'media_progressed',
        ...context,
        milestone,
      })
    }
  }

  return events
}
