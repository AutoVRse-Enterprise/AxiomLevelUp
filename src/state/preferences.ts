import { create } from 'zustand'

import { activeExperienceId, storagePrefixFor } from '@/lib/experience'

export interface Preferences {
  motion: 'system' | 'reduced' | 'full'
  hapticsEnabled: boolean
  installPromptDismissedAt?: string
}

const key = `${storagePrefixFor(activeExperienceId)}preferences`
export const defaultPreferences: Preferences = {
  motion: 'system',
  hapticsEnabled: true,
}

export function readPreferences(): Preferences {
  if (typeof window === 'undefined') return defaultPreferences
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return defaultPreferences
    const parsed = JSON.parse(stored) as Partial<Preferences> & { soundEnabled?: boolean }
    return {
      ...defaultPreferences,
      motion: parsed.motion ?? defaultPreferences.motion,
      hapticsEnabled: parsed.hapticsEnabled ?? defaultPreferences.hapticsEnabled,
      installPromptDismissedAt: parsed.installPromptDismissedAt,
    }
  } catch {
    return defaultPreferences
  }
}

export function writePreferences(preferences: Preferences) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(preferences))
}

interface PreferencesStore extends Preferences {
  setMotion: (motion: Preferences['motion']) => void
  setHapticsEnabled: (hapticsEnabled: boolean) => void
  setInstallPromptDismissedAt: (installPromptDismissedAt?: string) => void
}

const initialPreferences = readPreferences()

export const usePreferencesStore = create<PreferencesStore>((set) => ({
  ...initialPreferences,
  setMotion: (motion) =>
    set((state) => {
      const next = { ...state, motion }
      writePreferences(toPreferences(next))
      return { motion }
    }),
  setHapticsEnabled: (hapticsEnabled) =>
    set((state) => {
      const next = { ...state, hapticsEnabled }
      writePreferences(toPreferences(next))
      return { hapticsEnabled }
    }),
  setInstallPromptDismissedAt: (installPromptDismissedAt) =>
    set((state) => {
      const next = { ...state, installPromptDismissedAt }
      writePreferences(toPreferences(next))
      return { installPromptDismissedAt }
    }),
}))

function toPreferences(state: PreferencesStore): Preferences {
  return {
    motion: state.motion,
    hapticsEnabled: state.hapticsEnabled,
    installPromptDismissedAt: state.installPromptDismissedAt,
  }
}
