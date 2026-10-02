import type { AppConfig } from '@/content/schema'
import { subscribeToEvents } from '@/events/bus'
import type { LearnerEvent } from '@/events/types'
import { usePreferencesStore } from '@/state/preferences'

type HapticConfig = AppConfig['product']['presentation']['haptics']

let unsubscribe: (() => void) | null = null
let lastVibrationAt = 0

export function hapticsSupported() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

export function initializeHapticEffects(config: HapticConfig) {
  unsubscribe?.()
  unsubscribe = subscribeToEvents((event) => handleHapticEvent(event, config))
  return () => {
    unsubscribe?.()
    unsubscribe = null
  }
}

function handleHapticEvent(event: LearnerEvent, config: HapticConfig) {
  if (!usePreferencesStore.getState().hapticsEnabled || !hapticsSupported()) return

  const pattern =
    event.event === 'question_answered' && event.correct
      ? config.correctAnswer
      : event.event === 'badge_unlocked'
        ? config.badgeUnlocked
        : event.event === 'challenge_completed'
          ? config.challengeCompleted
          : null

  if (!pattern?.length) return
  const now = Date.now()
  if (now - lastVibrationAt < 250) return
  lastVibrationAt = now
  navigator.vibrate(pattern)
}

export function stopHapticEffectsForTests() {
  unsubscribe?.()
  unsubscribe = null
  lastVibrationAt = 0
}
