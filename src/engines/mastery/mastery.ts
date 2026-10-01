import type { AppConfig } from '@/content/schema'
import type { LearnerEvent, LearnerEventDraft } from '@/events/types'
import type { LearnerData } from '@/state/learnerStore'

const round = (value: number) => Math.round(value * 100) / 100
const clamp = (value: number) => Math.min(100, Math.max(0, value))

export function applyMasteryEvent(
  state: LearnerData,
  event: LearnerEvent,
  config: AppConfig['gamification']['mastery'],
): LearnerEventDraft[] {
  if (event.event !== 'question_answered' || event.attempt !== 1 || event.conceptIds.length === 0) {
    return []
  }

  const weight = config.difficultyWeights[event.difficulty]
  const combined = weight * (event.score * config.gain - (1 - event.score) * config.loss)
  const delta = round(combined / event.conceptIds.length)
  const followUps: LearnerEventDraft[] = []

  for (const conceptId of event.conceptIds) {
    const previous = state.mastery[conceptId] ?? {
      score: config.initialScore,
      history: [],
    }
    const current = round(clamp(previous.score + delta))
    const appliedDelta = round(current - previous.score)
    state.mastery[conceptId] = {
      score: current,
      history: [
        ...previous.history,
        {
          at: event.occurredAt,
          delta: appliedDelta,
          reason: event.questionId,
        },
      ].slice(-config.historyLimit),
    }
    followUps.push({
      event: 'mastery_updated',
      conceptId,
      previous: previous.score,
      current,
      delta: appliedDelta,
    })
  }
  return followUps
}
