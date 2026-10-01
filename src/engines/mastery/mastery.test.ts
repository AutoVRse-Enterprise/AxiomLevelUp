import freshSeedData from '../../../public/content/seeds/fresh.json'
import { describe, expect, it } from 'vitest'

import appConfigData from '../../../public/content/app-config.json'
import { appConfigSchema, learnerSeedSchema } from '@/content/schema'
import { applyMasteryEvent } from '@/engines/mastery/mastery'
import type { LearnerEvent } from '@/events/types'
import type { LearnerData } from '@/state/learnerStore'

const config = appConfigSchema.parse(appConfigData).gamification.mastery

function state(): LearnerData {
  const parsed = structuredClone(learnerSeedSchema.parse(freshSeedData))
  const { schemaVersion, ...data } = parsed
  void schemaVersion
  return data
}

function answer(
  score: number,
  attempt = 1,
  occurredAt = '2026-10-02T09:00:00+05:30',
): LearnerEvent {
  return {
    event: 'question_answered',
    id: crypto.randomUUID(),
    occurredAt,
    activityKind: 'lesson',
    activityId: 'thoracic-ct',
    questionId: 'showcase-question',
    primitiveType: 'multiple_choice',
    conceptIds: ['image-windowing'],
    score,
    correct: score === 1,
    attempt,
    difficulty: 'advanced',
  }
}

describe('mastery engine', () => {
  it('applies weighted partial credit and ignores retries', () => {
    const current = state()
    const followUps = applyMasteryEvent(current, answer(0.5), config)
    const score = current.mastery['image-windowing']?.score
    expect(score).toBe(51.25)
    expect(followUps).toContainEqual(
      expect.objectContaining({
        event: 'mastery_updated',
        conceptId: 'image-windowing',
        delta: 1.25,
      }),
    )
    applyMasteryEvent(current, answer(1, 2), config)
    expect(current.mastery['image-windowing']?.score).toBe(score)
  })

  it('clamps mastery and caps history', () => {
    const current = state()
    current.mastery['image-windowing'] = {
      score: 99,
      history: Array.from({ length: config.historyLimit }, (_, index) => ({
        at: `2026-09-${String((index % 28) + 1).padStart(2, '0')}T09:00:00+05:30`,
        delta: 1,
        reason: `question-${index}`,
      })),
    }
    applyMasteryEvent(current, answer(1), config)
    expect(current.mastery['image-windowing']?.score).toBe(100)
    expect(current.mastery['image-windowing']?.history).toHaveLength(config.historyLimit)
  })
})
