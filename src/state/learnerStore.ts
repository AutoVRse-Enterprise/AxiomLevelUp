import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { LearnerSeed } from '@/content/schema'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { today } from '@/lib/clock'
import { idbStorage } from '@/state/persistence/idbStorage'
import { rebaseSeedDates } from '@/state/seedDates'

export const LEARNER_STATE_VERSION = 5

export type LearnerData = Omit<LearnerSeed, 'schemaVersion'>

interface LearnerStore extends LearnerData {
  initialized: boolean
  storageError: string | null
  initialize: (seed: LearnerSeed) => void
  replaceWithSeed: (seed: LearnerSeed) => void
  applyEventState: (data: LearnerData) => void
  resetCaseAttempts: () => void
  setStorageError: (message: string | null) => void
}

export function createEmptyGamificationState(date = today()): LearnerData['gamification'] {
  return {
    xpWeekStart: date,
    weeklyTargetRewardedWeek: null,
    lessonRewards: {},
    caseRewards: {},
    challengePeriods: {},
    counters: {
      perfectLessons: 0,
      weeklyGoalsMet: 0,
      challengeCompletions: {},
      firstAttemptCorrect: 0,
      firstAttemptCorrectByType: {},
      firstAttemptCorrectByConcept: {},
      caseCompletions: {},
      caseCompletionsByTier: {
        foundation: 0,
        intermediate: 0,
        advanced: 0,
      },
    },
    activeRun: null,
    lastQuestionReward: null,
    lastActivityResult: null,
    celebrations: [],
    digitalRewards: [],
  }
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
  caseProgress: {},
  caseAttempts: {},
  challenges: {},
  badges: {},
  mastery: {},
  gamification: createEmptyGamificationState(),
  stats: {
    coursesCompleted: 0,
    lessonsCompleted: 0,
    challengesCompleted: 0,
    casesCompleted: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
  },
  onboarding: { viewed: false },
}

function dataFromSeed(seed: LearnerSeed): LearnerData {
  const state = rebaseSeedDates(seed, today()) as Partial<LearnerSeed>
  delete state.schemaVersion
  state.stateVersion = LEARNER_STATE_VERSION
  return state as LearnerData
}

export function migrateLearnerState(persistedState: unknown): LearnerData {
  const state = persistedState as LearnerData & { offlineDownloads?: unknown }
  delete state.offlineDownloads
  const completedLessonEntries = Object.entries(state.lessonProgress ?? {}).filter(
    ([, progress]) => progress.status === 'completed',
  )
  const emptyGamification = createEmptyGamificationState(state.referenceDate ?? today())
  const gamification = state.gamification
    ? {
        ...state.gamification,
        caseRewards: state.gamification.caseRewards ?? {},
        counters: {
          ...emptyGamification.counters,
          ...state.gamification.counters,
          caseCompletions: state.gamification.counters.caseCompletions ?? {},
          caseCompletionsByTier: {
            ...emptyGamification.counters.caseCompletionsByTier,
            ...state.gamification.counters.caseCompletionsByTier,
          },
        },
      }
    : ({
      ...createEmptyGamificationState(state.referenceDate ?? today()),
      lessonRewards: Object.fromEntries(
        completedLessonEntries.map(([id, progress]) => [
          id,
          {
            completionAwarded: true,
            perfectAwarded: progress.bestScore === 100,
          },
        ]),
      ),
      counters: {
        ...createEmptyGamificationState().counters,
        perfectLessons: completedLessonEntries.filter(([, progress]) => progress.bestScore === 100)
          .length,
      },
    } satisfies LearnerData['gamification'])
  return {
    ...state,
    stateVersion: LEARNER_STATE_VERSION,
    referenceDate: state.referenceDate ?? today(),
    caseProgress: state.caseProgress ?? {},
    caseAttempts: state.caseAttempts ?? {},
    gamification,
    stats: {
      ...state.stats,
      casesCompleted: state.stats?.casesCompleted ?? 0,
    },
  }
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
      applyEventState: (data) => set(data),
      resetCaseAttempts: () => {
        if (useActivitySessionStore.getState().session?.activityKind === 'case') {
          useActivitySessionStore.getState().clear()
        }
        set({ caseProgress: {}, caseAttempts: {} })
      },
      setStorageError: (storageError) => set({ storageError }),
    }),
    {
      name: 'learner',
      version: LEARNER_STATE_VERSION,
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
      migrate: (persistedState) => migrateLearnerState(persistedState),
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

export function learnerDataSnapshot(state: LearnerStore): LearnerData {
  return {
    stateVersion: state.stateVersion,
    seedProfile: state.seedProfile,
    referenceDate: state.referenceDate,
    learner: state.learner,
    xp: state.xp,
    streak: state.streak,
    weeklyGoal: state.weeklyGoal,
    lessonProgress: state.lessonProgress,
    caseProgress: state.caseProgress,
    caseAttempts: state.caseAttempts,
    challenges: state.challenges,
    badges: state.badges,
    mastery: state.mastery,
    gamification: state.gamification,
    stats: state.stats,
    onboarding: state.onboarding,
  }
}

export type { LearnerStore }
