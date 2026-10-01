import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { subscribeToEvents } from '@/events/bus'
import type { LearnerEvent } from '@/events/types'
import { idbStorage } from '@/state/persistence/idbStorage'

export const EVENT_LOG_LIMIT = 500

interface EventLogStore {
  events: LearnerEvent[]
  append: (event: LearnerEvent) => void
  clear: () => void
}

export const useEventLogStore = create<EventLogStore>()(
  persist(
    (set) => ({
      events: [],
      append: (event) =>
        set((state) => ({
          events: [...state.events, event].slice(-EVENT_LOG_LIMIT),
        })),
      clear: () => set({ events: [] }),
    }),
    {
      name: 'event-log',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
    },
  ),
)

let unsubscribe: (() => unknown) | null = null

export function initializeEventLogging() {
  if (unsubscribe) return unsubscribe
  unsubscribe = subscribeToEvents((event) => useEventLogStore.getState().append(event))
  return unsubscribe
}

export function stopEventLoggingForTests() {
  unsubscribe?.()
  unsubscribe = null
}
