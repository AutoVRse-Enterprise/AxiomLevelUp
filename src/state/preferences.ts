export interface Preferences {
  soundEnabled: boolean
  motion: 'system' | 'reduced' | 'full'
  installPromptDismissedAt?: string
}

const key = 'axiom-runtime:preferences'
const defaults: Preferences = { soundEnabled: false, motion: 'system' }

export function readPreferences(): Preferences {
  if (typeof window === 'undefined') return defaults
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? { ...defaults, ...(JSON.parse(stored) as Partial<Preferences>) } : defaults
  } catch {
    return defaults
  }
}

export function writePreferences(preferences: Preferences) {
  window.localStorage.setItem(key, JSON.stringify(preferences))
}
