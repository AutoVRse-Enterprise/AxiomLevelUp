import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ActivityPlan } from '@/engines/learning/plan'
import {
  createActivitySession,
  type ActivitySession,
  sessionMatchesPlan,
} from '@/engines/learning/session'
import { idbStorage } from '@/state/persistence/idbStorage'

export const ACTIVITY_SESSION_VERSION = 6

export function migrateActivitySessionState(
  persistedState: unknown,
  version: number,
): { session: ActivitySession | null } {
  if (version < 2) return { session: null }
  if (typeof persistedState !== 'object' || persistedState === null) {
    return { session: null }
  }
  let session = (persistedState as { session?: ActivitySession | null }).session
  if (version === 2 && session?.progress) {
    session = {
      ...session,
      progress: Object.fromEntries(
        Object.entries(session.progress).map(([id, progress]) => [
          id,
          { ...progress, firstTimedOut: false, firstResponse: progress.response ?? null },
        ]),
      ),
    }
  }
  if (session?.progress) {
    session = {
      ...session,
      progress: Object.fromEntries(
        Object.entries(session.progress).map(([id, progress]) => [
          id,
          {
            ...progress,
            firstTimeoutCreditApplied: progress.firstTimeoutCreditApplied ?? false,
            lastTimeoutCreditApplied: progress.lastTimeoutCreditApplied ?? false,
          },
        ]),
      ),
    }
  }
  if (session?.caseProgress && !session.caseProgress.clueOpenContexts) {
    session = {
      ...session,
      caseProgress: {
        ...session.caseProgress,
        clueOpenContexts: {},
      },
    }
  }
  if (session?.caseProgress) {
    session = {
      ...session,
      caseProgress: {
        ...session.caseProgress,
        reviewedClueIds:
          version < ACTIVITY_SESSION_VERSION ? [] : (session.caseProgress.reviewedClueIds ?? []),
        evidence: session.caseProgress.evidence ?? { pinned: [] },
        differential: session.caseProgress.differential ?? {},
        differentialCheckpoints: session.caseProgress.differentialCheckpoints ?? {},
      },
    }
  }
  return { session: session ?? null }
}

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
      migrate: migrateActivitySessionState,
      partialize: ({ session }) => ({ session }),
    },
  ),
)
