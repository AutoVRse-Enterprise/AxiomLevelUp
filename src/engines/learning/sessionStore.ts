import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ActivityPlan } from '@/engines/learning/plan'
import {
  createActivitySession,
  type ActivitySession,
  sessionMatchesPlan,
} from '@/engines/learning/session'
import { idbStorage } from '@/state/persistence/idbStorage'

export const ACTIVITY_SESSION_VERSION = 1

interface ActivitySessionStore {
  session: ActivitySession | null
  loadForPlan: (plan: ActivityPlan) => ActivitySession
  save: (session: ActivitySession) => void
  clear: () => void
}

export const useActivitySessionStore = create<ActivitySessionStore>()(
  persist(
    (set, get) => ({
      session: null,
      loadForPlan: (plan) => {
        const current = get().session
        if (current && sessionMatchesPlan(current, plan) && current.phase !== 'complete') {
          return current
        }
        const next = createActivitySession(plan)
        set({ session: next })
        return next
      },
      save: (session) => set({ session }),
      clear: () => set({ session: null }),
    }),
    {
      name: 'activity-session',
      version: ACTIVITY_SESSION_VERSION,
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
      partialize: ({ session }) => ({ session }),
    },
  ),
)
