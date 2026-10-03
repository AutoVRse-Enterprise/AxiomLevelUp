import freshSeedData from '../../public/content/seeds/fresh.json'
import caseFixtureData from '../../public/content/fixtures/case.json'
import { describe, expect, it } from 'vitest'

import { validateContentBundle } from '@/content/loader'
import {
  appConfigSchema,
  caseDocumentSchema,
  learnerSeedSchema,
  type AppConfig,
} from '@/content/schema'
import { reduceLearnerEvent } from '@/engines/pipeline'
import type { LearnerEvent, LearnerEventDraft } from '@/events/types'
import { migrateLearnerState, type LearnerData } from '@/state/learnerStore'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())
const caseDocument = caseDocumentSchema.parse(caseFixtureData)

function registryWithCase(historyLimit = 2, badges: AppConfig['badges'] = []) {
  const appConfig = appConfigSchema.parse({
    ...structuredClone(registry.appConfig),
    badges,
    caseLab: {
      title: 'Case Lab',
      featuredCaseId: caseDocument.id,
      caseIds: [caseDocument.id],
      dailyQuickCaseId: caseDocument.id,
      clueCategories: [{ id: 'evidence', label: 'Evidence' }],
      tiers: {
        foundation: {
          label: 'Basic',
          timing: 'none',
          hints: 'full',
          labelEssentialClues: true,
        },
        intermediate: {
          label: 'Intermediate',
          timing: 'stopwatch',
          hints: 'full',
          labelEssentialClues: true,
        },
        advanced: {
          label: 'Advanced',
          timing: 'countdown',
          hints: 'reduced',
          labelEssentialClues: false,
        },
      },
      scoring: {
        weights: { anatomy: 0.4, diagnosis: 0.4, speed: 0.2 },
        speedBlend: { perStep: 0.5, perCase: 0.5 },
        defaultStepTargetSeconds: 20,
        defaultStepMaxSeconds: 90,
        cluePenalty: { perOptionalClue: 2, cap: 10 },
      },
      xp: { caseComplete: 100, perfectCaseBonus: 40 },
      historyLimit,
    },
  })
  return {
    ...registry,
    appConfig,
    cases: [caseDocument],
    caseById: new Map([[caseDocument.id, caseDocument]]),
  }
}

function freshState(): LearnerData {
  const state = structuredClone(learnerSeedSchema.parse(freshSeedData))
  const { schemaVersion, ...data } = state
  void schemaVersion
  return data
}

function event(draft: LearnerEventDraft, occurredAt = '2026-10-02T09:00:00+05:30'): LearnerEvent {
  return { ...draft, id: crypto.randomUUID(), occurredAt } as LearnerEvent
}

function reduce(state: LearnerData, draft: LearnerEventDraft, occurredAt?: string) {
  return reduceLearnerEvent(state, event(draft, occurredAt), registry)
}

const perfectBreakdown = {
  anatomy: 1,
  diagnosis: 1,
  speed: 0,
  perStepSpeed: 0,
  caseSpeed: 0,
  speedModel: 'time_eligible' as const,
  speedEligibility: { minStepScore: 0.5, eligibleSteps: 1, totalScoredSteps: 1 },
  speedScored: false,
  timingMode: 'none' as const,
  penalty: 0,
  total: 100,
  weights: { anatomy: 0.5, diagnosis: 0.5, speed: 0 },
  durationSeconds: 100,
  openedClueIds: ['clue-context'],
}

function caseCompletion(attemptId: string, total = 100): LearnerEventDraft {
  return {
    event: 'case_completed',
    caseId: caseDocument.id,
    attemptId,
    tier: 'foundation',
    breakdown: { ...perfectBreakdown, total },
    durationSeconds: 100,
    openedClueIds: ['clue-context'],
    reviewedClueIds: [],
    evidence: { pinned: [] },
    differential: {},
    timeoutCreditApplied: false,
    stepResults: [
      {
        primitiveId: 'identify-location',
        firstAttemptScore: 1,
        elapsedMs: 10_000,
        timedOut: false,
        response: { choices: ['b', 'a'], metadata: { z: 1, a: 2 } },
      },
    ],
  }
}

describe('learner event pipeline', () => {
  it('awards first-attempt, completion, perfect and badge XP once', () => {
    let state = freshState()
    state = reduce(state, {
      event: 'lesson_started',
      courseId: 'scientific-imaging',
      lessonId: 'thoracic-ct',
      attempt: 1,
      resumed: false,
    }).state
    const answer = reduce(state, {
      event: 'question_answered',
      activityKind: 'lesson',
      activityId: 'thoracic-ct',
      questionId: 'showcase-question',
      primitiveType: 'multiple_choice',
      conceptIds: ['image-windowing'],
      score: 1,
      correct: true,
      attempt: 1,
      difficulty: 'intermediate',
    })
    state = answer.state
    expect(state.xp.total).toBe(10)
    expect(state.mastery['image-windowing']?.score).toBe(54)
    expect(answer.followUps).toContainEqual(
      expect.objectContaining({ event: 'xp_awarded', reason: 'question', amount: 10 }),
    )

    const completion = reduce(state, {
      event: 'lesson_completed',
      courseId: 'scientific-imaging',
      lessonId: 'thoracic-ct',
      score: 100,
      accuracy: 100,
      correctCount: 1,
      scoredCount: 1,
      durationSeconds: 60,
    })
    state = completion.state
    expect(state.xp.total).toBe(170)
    expect(state.lessonProgress['thoracic-ct']?.stars).toBe(3)
    expect(state.badges['perfect-lesson']?.unlockedAt).not.toBeNull()
    expect(state.gamification.lastActivityResult).toEqual(
      expect.objectContaining({
        activityId: 'thoracic-ct',
        xpEarned: 170,
        stars: 3,
        masteryDelta: { 'image-windowing': 4 },
      }),
    )
  })

  it('treats completed lesson replay as revision without repaying completion', () => {
    let state = freshState()
    state.lessonProgress['imaging-orientation'] = {
      status: 'completed',
      stars: 3,
      bestScore: 100,
      attempts: 1,
      lastPrimitiveIndex: 0,
      completedAt: '2026-10-01T09:00:00+05:30',
    }
    state.gamification.lessonRewards['imaging-orientation'] = {
      completionAwarded: true,
      perfectAwarded: true,
    }
    state = reduce(state, {
      event: 'lesson_started',
      courseId: 'scientific-imaging',
      lessonId: 'imaging-orientation',
      attempt: 2,
      resumed: false,
    }).state
    state = reduce(state, {
      event: 'lesson_completed',
      courseId: 'scientific-imaging',
      lessonId: 'imaging-orientation',
      score: 80,
      accuracy: 80,
      correctCount: 0,
      scoredCount: 0,
      durationSeconds: 30,
    }).state
    expect(state.xp.total).toBe(registry.appConfig.gamification.xp.revisionComplete)
    expect(state.gamification.lastActivityResult?.revision).toBe(true)
  })

  it('routes case mastery without question XP and rewards case attempts idempotently', () => {
    const caseRegistry = registryWithCase()
    let state = freshState()
    const reduceCase = (draft: LearnerEventDraft) =>
      reduceLearnerEvent(state, event(draft), caseRegistry)

    state = reduceCase({
      event: 'case_started',
      caseId: caseDocument.id,
      attempt: 1,
      resumed: false,
      tier: 'foundation',
    }).state
    const answer = reduceCase({
      event: 'question_answered',
      activityKind: 'case',
      activityId: caseDocument.id,
      questionId: 'identify-location',
      primitiveType: 'multiple_choice',
      conceptIds: ['thoracic-imaging'],
      score: 1,
      correct: true,
      attempt: 1,
      difficulty: 'foundation',
    })
    state = answer.state
    expect(state.xp.total).toBe(0)
    expect(state.mastery['thoracic-imaging']?.score).toBe(53)
    expect(answer.followUps.some(({ event }) => event === 'xp_awarded')).toBe(false)

    const first = reduceCase(caseCompletion('attempt-1'))
    state = first.state
    expect(state.xp.total).toBe(140)
    expect(state.caseProgress[caseDocument.id]).toMatchObject({
      completions: 1,
      bestTotal: 100,
    })
    expect(state.caseAttempts[caseDocument.id]).toHaveLength(1)
    expect(state.caseAttempts[caseDocument.id]?.[0]).toMatchObject({
      resultVersion: 7,
      perStepSpeed: 0,
      caseSpeed: 0,
      speedModel: 'time_eligible',
      speedEligibility: { minStepScore: 0.5, eligibleSteps: 1, totalScoredSteps: 1 },
      clueCostPoints: 0,
      speedScored: false,
      timingMode: 'none',
      weights: { anatomy: 0.5, diagnosis: 0.5, speed: 0 },
      actualAwardedXp: 140,
      actualAwardedXpSource: 'gamification_activity_result',
      reviewedClueIds: [],
      evidence: { pinned: [] },
      differential: {},
      timeoutCreditApplied: false,
      stepResults: [
        expect.objectContaining({
          response: { choices: ['a', 'b'], metadata: { a: 2, z: 1 } },
        }),
      ],
    })
    expect(state.stats.casesCompleted).toBe(1)
    expect(state.gamification.lastActivityResult).toMatchObject({
      activityKind: 'case',
      activityId: caseDocument.id,
      masteryDelta: { 'thoracic-imaging': 3 },
      revision: false,
    })
    expect(() => learnerSeedSchema.parse({ schemaVersion: '0.1', ...state })).not.toThrow()

    state = reduceCase(caseCompletion('attempt-1')).state
    expect(state.xp.total).toBe(140)
    expect(state.caseAttempts[caseDocument.id]).toHaveLength(1)

    state = reduceCase({
      event: 'case_started',
      caseId: caseDocument.id,
      attempt: 2,
      resumed: false,
      tier: 'foundation',
    }).state
    state = reduceCase(caseCompletion('attempt-2', 80)).state
    expect(state.xp.total).toBe(170)
    expect(state.caseProgress[caseDocument.id]?.completions).toBe(2)
    expect(state.gamification.lastActivityResult?.revision).toBe(true)

    state = reduceCase(caseCompletion('attempt-3', 70)).state
    expect(state.caseAttempts[caseDocument.id]?.map(({ attemptId }) => attemptId)).toEqual([
      'attempt-2',
      'attempt-3',
    ])
  })

  it('derives and unlocks configured case badges from attempt facts', () => {
    const badges: AppConfig['badges'] = [
      {
        id: 'case-finisher',
        title: 'Case finisher',
        description: 'Complete a basic case.',
        category: 'performance',
        icon: 'brain',
        rewardXp: 0,
        criteria: { type: 'cases_completed', count: 1, tiers: ['foundation'] },
      },
      {
        id: 'case-diagnosis',
        title: 'Case diagnosis',
        description: 'Diagnose perfectly.',
        category: 'performance',
        icon: 'brain',
        rewardXp: 0,
        criteria: {
          type: 'case_component_score',
          component: 'diagnosis',
          min: 1,
          maxOptionalClues: 0,
        },
      },
      {
        id: 'case-speed',
        title: 'Case speed',
        description: 'Finish within the target.',
        category: 'performance',
        icon: 'brain',
        rewardXp: 0,
        criteria: { type: 'case_duration', maxRatioOfTarget: 1 },
      },
    ]
    const caseRegistry = registryWithCase(2, badges)
    const result = reduceLearnerEvent(
      freshState(),
      event(caseCompletion('badge-attempt')),
      caseRegistry,
    )

    expect(badges.map(({ id }) => result.state.badges[id]?.unlockedAt)).toEqual([
      expect.any(String),
      expect.any(String),
      expect.any(String),
    ])
  })

  it('pays a daily challenge reward once per local day', () => {
    let state = freshState()
    const start: LearnerEventDraft = {
      event: 'challenge_started',
      challengeId: 'daily-imaging-interpretation',
      attempt: 1,
      resumed: false,
    }
    const complete: LearnerEventDraft = {
      event: 'challenge_completed',
      challengeId: 'daily-imaging-interpretation',
      score: 100,
      accuracy: 100,
      correctCount: 5,
      scoredCount: 5,
      durationSeconds: 90,
    }
    state = reduce(state, start).state
    state = reduce(state, complete).state
    expect(state.xp.total).toBe(75)
    expect(state.streak.currentDays).toBe(1)

    state = reduce(state, start).state
    state = reduce(state, complete).state
    expect(state.xp.total).toBe(75)
    expect(state.gamification.counters.challengeCompletions['daily-imaging-interpretation']).toBe(1)
  })

  it('rounds fractional question XP and emits one level-up crossing', () => {
    const state = freshState()
    state.xp = { total: 245, weekly: 245 }
    const partial = reduce(state, {
      event: 'question_answered',
      activityKind: 'lesson',
      activityId: 'thoracic-ct',
      questionId: 'showcase-question',
      primitiveType: 'multiple_choice',
      conceptIds: ['image-windowing'],
      score: 0.5,
      correct: false,
      attempt: 1,
      difficulty: 'intermediate',
    })
    expect(partial.state.xp.total).toBe(250)
    expect(partial.followUps).toContainEqual({
      event: 'level_up',
      from: 1,
      to: 2,
    })
    expect(
      partial.state.gamification.celebrations.filter(({ type }) => type === 'level'),
    ).toHaveLength(1)
  })

  it('resets weekly XP at a configured week boundary', () => {
    const state = freshState()
    state.xp.weekly = 100
    state.gamification.xpWeekStart = '2026-09-28'
    const result = reduce(
      state,
      { event: 'app_opened', source: 'client' },
      '2026-10-05T09:00:00+05:30',
    )
    expect(result.state.xp.weekly).toBe(0)
    expect(result.state.gamification.xpWeekStart).toBe('2026-10-05')
  })

  it('awards the configured weekly target once', () => {
    let state = freshState()
    state.weeklyGoal.completedDays = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01']
    state = reduce(state, {
      event: 'lesson_started',
      courseId: 'scientific-imaging',
      lessonId: 'thoracic-ct',
      attempt: 1,
      resumed: false,
    }).state
    const result = reduce(state, {
      event: 'lesson_completed',
      courseId: 'scientific-imaging',
      lessonId: 'thoracic-ct',
      score: 80,
      accuracy: 80,
      correctCount: 0,
      scoredCount: 0,
      durationSeconds: 30,
    })
    expect(result.state.gamification.counters.weeklyGoalsMet).toBe(1)
    expect(result.followUps).toContainEqual(
      expect.objectContaining({
        event: 'xp_awarded',
        reason: 'weekly_target',
        amount: 100,
      }),
    )
  })

  it('unlocks primitive rewards idempotently and applies badge XP', () => {
    const state = freshState()
    const first = reduce(state, {
      event: 'primitive_completed',
      activityKind: 'lesson',
      activityId: 'dicom-lab',
      primitiveId: 'lab-measure',
      primitiveType: 'dicom_measure',
      stepIndex: 2,
    })
    expect(first.state.badges['first-dicom']?.unlockedAt).not.toBeNull()
    expect(first.state.xp.total).toBe(40)
    expect(first.state.gamification.digitalRewards).toContainEqual(
      expect.objectContaining({ type: 'badge', id: 'first-dicom' }),
    )

    const second = reduce(first.state, {
      event: 'primitive_completed',
      activityKind: 'lesson',
      activityId: 'dicom-lab',
      primitiveId: 'lab-measure',
      primitiveType: 'dicom_measure',
      stepIndex: 2,
    })
    expect(second.state.xp.total).toBe(40)
    expect(second.state.gamification.digitalRewards).toHaveLength(1)
  })

  it('allows badge XP to trigger a single level-up cascade', () => {
    const state = freshState()
    state.xp = { total: 220, weekly: 220 }
    const result = reduce(state, {
      event: 'demo_command',
      command: 'simulate_badge',
      badgeId: 'perfect-lesson',
    })
    expect(result.state.xp.total).toBe(250)
    expect(result.followUps.filter(({ event }) => event === 'level_up')).toEqual([
      { event: 'level_up', from: 1, to: 2 },
    ])
    expect(result.state.gamification.celebrations.map(({ type }) => type)).toEqual([
      'badge',
      'level',
    ])
  })

  it('migrates v2 completed lessons into an idempotent reward ledger', () => {
    const legacy = freshState()
    delete (legacy as Partial<LearnerData>).gamification
    legacy.lessonProgress['imaging-orientation'] = {
      status: 'completed',
      stars: 3,
      bestScore: 100,
      attempts: 1,
      lastPrimitiveIndex: 0,
      completedAt: '2026-10-01T09:00:00+05:30',
    }

    const migrated = migrateLearnerState(legacy)
    expect(migrated.stateVersion).toBe(7)
    expect(migrated.gamification.lessonRewards['imaging-orientation']).toEqual({
      completionAwarded: true,
      perfectAwarded: true,
    })
    expect(migrated.gamification.counters.perfectLessons).toBe(1)
  })
})
