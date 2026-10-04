import type { EventActivityKind, LearnerEventDraft, MediaProgressMilestone } from '@/events/types'
import type { PrimitiveInteraction } from '@/primitives/types'

const MEDIA_MILESTONES = [25, 50, 75, 100] as const

interface InteractionEventContext {
  activityKind: EventActivityKind
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

  if (
    context.activityKind === 'case' &&
    interaction.name === 'case_hypothesis_rated' &&
    'hypothesisId' in interaction
  ) {
    events.push({
      event: 'case_hypothesis_updated',
      caseId: context.activityId,
      checkpointId: context.primitiveId,
      hypothesisId: interaction.hypothesisId,
      confidence: interaction.confidence,
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

  if (interaction.name === 'anatomy_structure_selected' && 'structureId' in interaction) {
    events.push({
      event: 'anatomy_structure_selected',
      ...context,
      structureId: interaction.structureId,
    })
  }

  if (interaction.name === 'anatomy_waypoint_reached' && 'waypointId' in interaction) {
    events.push({
      event: 'anatomy_waypoint_reached',
      ...context,
      waypointId: interaction.waypointId,
    })
  }

  if (interaction.name === 'anatomy_finding_inspected' && 'findingId' in interaction) {
    events.push({
      event: 'anatomy_finding_inspected',
      ...context,
      findingId: interaction.findingId,
    })
  }

  if (interaction.name === 'anatomy_view_changed' && 'position' in interaction) {
    events.push({
      event: 'anatomy_view_changed',
      ...context,
      position: interaction.position,
      target: interaction.target,
      waypointId: interaction.waypointId,
      endoscopic: interaction.endoscopic,
    })
  }

  if (interaction.name === 'anatomy_viewer_loaded' && 'loadMs' in interaction) {
    events.push({
      event: 'anatomy_viewer_loaded',
      ...context,
      loadMs: interaction.loadMs,
      meshCount: interaction.meshCount,
      triangleCount: interaction.triangleCount,
    })
  }

  if (interaction.name === 'anatomy_viewer_failed' && 'reason' in interaction) {
    events.push({
      event: 'anatomy_viewer_failed',
      ...context,
      reason: interaction.reason,
    })
  }

  return events
}
