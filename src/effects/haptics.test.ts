import { afterEach, describe, expect, it, vi } from 'vitest'

import { appConfigSchema } from '@/content/schema'
import {
  hapticsSupported,
  initializeHapticEffects,
  stopHapticEffectsForTests,
} from '@/effects/haptics'
import { clearEventSubscribersForTests, emitEvent } from '@/events/bus'
import { usePreferencesStore } from '@/state/preferences'
import { makeValidContentBundle } from '@/test/contentFixtures'

const config = appConfigSchema.parse(makeValidContentBundle().appConfig).product.presentation.haptics

afterEach(() => {
  stopHapticEffectsForTests()
  clearEventSubscribersForTests()
  vi.unstubAllGlobals()
  usePreferencesStore.getState().setHapticsEnabled(true)
})

describe('haptic effects', () => {
  it('maps correct answers to the configured pattern', () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { ...navigator, vibrate })
    initializeHapticEffects(config)

    emitEvent({
      event: 'question_answered',
      activityKind: 'lesson',
      activityId: 'lesson',
      questionId: 'question',
      primitiveType: 'multiple_choice',
      conceptIds: [],
      score: 1,
      correct: true,
      attempt: 1,
      difficulty: 'foundation',
    })

    expect(hapticsSupported()).toBe(true)
    expect(vibrate).toHaveBeenCalledWith(config.correctAnswer)
  })

  it('does not vibrate for incorrect answers or when disabled', () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { ...navigator, vibrate })
    initializeHapticEffects(config)
    usePreferencesStore.getState().setHapticsEnabled(false)

    emitEvent({ event: 'badge_unlocked', badgeId: 'first-step' })

    expect(vibrate).not.toHaveBeenCalled()
  })
})
