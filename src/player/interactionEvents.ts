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

  if (interaction.name === 'dicom_slice' && 'slice' in interaction) {
    events.push({
      event: 'dicom_slice_changed',
      ...context,
      slice: interaction.slice,
    })
  }

  if (interaction.name === 'dicom_window' && 'center' in interaction) {
    events.push({
      event: 'dicom_window_changed',
      ...context,
      presetId: interaction.presetId,
      center: interaction.center,
      width: interaction.width,
    })
  }

  if (interaction.name === 'dicom_region' && 'x' in interaction) {
    events.push({
      event: 'dicom_region_selected',
      ...context,
      slice: interaction.slice,
      x: interaction.x,
      y: interaction.y,
    })
  }

  if (interaction.name === 'dicom_measurement' && 'value' in interaction) {
    events.push({
      event: 'measurement_created',
      ...context,
      slice: interaction.slice,
      value: interaction.value,
      unit: interaction.unit,
    })
  }

  if (interaction.name === 'dicom_viewer_loaded' && 'firstImageMs' in interaction) {
    events.push({
      event: 'dicom_viewer_loaded',
      ...context,
      firstImageMs: interaction.firstImageMs,
      sliceCount: interaction.sliceCount,
    })
  }

  if (interaction.name === 'dicom_viewer_failed' && 'reason' in interaction) {
    events.push({
      event: 'dicom_viewer_failed',
      ...context,
      reason: interaction.reason,
    })
  }

  return events
}
