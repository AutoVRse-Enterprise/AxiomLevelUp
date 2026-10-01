import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { LearnerSeed } from '@/content/schema'
import type { LearningProgressState } from '@/engines/learning/progress'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { today } from '@/lib/clock'
import { idbStorage } from '@/state/persistence/idbStorage'
import { rebaseSeedDates } from '@/state/seedDates'

export const LEARNER_STATE_VERSION = 2

type LearnerData = Omit<LearnerSeed, 'schemaVersion'>

interface LearnerStore extends LearnerData {
  initialized: boolean
  storageError: string | null
  initialize: (seed: LearnerSeed) => void
  replaceWithSeed: (seed: LearnerSeed) => void
  addXp: (amount: number) => void
  applyLearningProgress: (progress: LearningProgressState) => void
  setStorageError: (message: string | null) => void
}

const emptyData: LearnerData = {
  stateVersion: LEARNER_STATE_VERSION,
  seedProfile: 'fresh',
  referenceDate: today(),
  learner: { id: 'loading-learner', name: 'Learner', role: 'R&D Learner' },
  xp: { total: 0, weekly: 0 },
  streak: { currentDays: 0, lastQualifyingDate: null },
  weeklyGoal: { targetDays: 5, completedDays: [] },
  lessonProgress: {},
  challenges: {},
  badges: {},
  mastery: {},
  stats: {
    coursesCompleted: 0,
    lessonsCompleted: 0,
    challengesCompleted: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
  },
  onboarding: { viewed: false },
  offlineDownloads: {},
}

function dataFromSeed(seed: LearnerSeed): LearnerData {
  const state = rebaseSeedDates(seed, today()) as Partial<LearnerSeed>
  delete state.schemaVersion
  state.stateVersion = LEARNER_STATE_VERSION
  return state as LearnerData
}

export const useLearnerStore = create<LearnerStore>()(
  persist(
    (set) => ({
      ...emptyData,
      initialized: false,
      storageError: null,
      initialize: (seed) =>
        set((state) => (state.initialized ? state : { ...dataFromSeed(seed), initialized: true })),
      replaceWithSeed: (seed) => {
        useActivitySessionStore.getState().clear()
        set({ ...dataFromSeed(seed), initialized: true, storageError: null })
      },
      addXp: (amount) =>
        set((state) => ({
          xp: {
            total: Math.max(0, state.xp.total + amount),
            weekly: Math.max(0, state.xp.weekly + amount),
          },
        })),
      applyLearningProgress: (progress) =>
        set({
          lessonProgress: progress.lessonProgress,
          challenges: progress.challenges,
          stats: progress.stats,
        }),
      setStorageError: (storageError) => set({ storageError }),
    }),
    {
      name: 'learner',
      version: LEARNER_STATE_VERSION,
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
      migrate: (persistedState) => {
        const state = persistedState as LearnerStore
        return {
          ...state,
          stateVersion: LEARNER_STATE_VERSION,
          referenceDate: state.referenceDate ?? today(),
        }
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          state?.setStorageError(
            error instanceof Error ? error.message : 'Learner progress could not be restored.',
          )
        }
      },
    },
  ),
)

export type { LearnerStore }
