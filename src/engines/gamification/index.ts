import type { ContentRegistry } from '@/content/loader'
import type { AppConfig, Primitive } from '@/content/schema'
import {
  localDateFromTimestamp,
  periodKey,
  startOfLocalWeek,
} from '@/engines/gamification/calendar'
import { evaluateCriterion } from '@/engines/gamification/criteria'
import { levelForXp, xpToNextLevel } from '@/engines/gamification/levels'
import { starsForScore } from '@/engines/gamification/stars'
import { nextStreak } from '@/engines/gamification/streak'
import type { EventActivityKind, LearnerEvent, LearnerEventDraft } from '@/events/types'
import type { LearnerData } from '@/state/learnerStore'

type XpReason = Extract<LearnerEventDraft, { event: 'xp_awarded' }>['reason']

function findPrimitive(
  registry: ContentRegistry,
  activityKind: EventActivityKind,
  activityId: string,
  primitiveId: string,
): Primitive | undefined {
  if (activityKind === 'lesson') {
    return registry.lessonById.get(activityId)?.primitives.find(({ id }) => id === primitiveId)
  }
  if (activityKind === 'challenge') {
    return registry.appConfig.challenges
        .find(({ id }) => id === activityId)
        ?.items.find(({ id }) => id === primitiveId)
  }
  return registry.caseById
    .get(activityId)
    ?.stages.flatMap(({ steps }) => steps)
    .find(({ id }) => id === primitiveId)
}

function leaderboardRank(state: LearnerData, config: AppConfig) {
  const entries = config.leaderboard.entries
    .map((entry) => ({
      id: entry.id,
      xp: entry.id === state.learner.id ? state.xp.weekly : entry.weeklyXp,
    }))
    .sort((left, right) => right.xp - left.xp)
  const index = entries.findIndex(({ id }) => id === state.learner.id)
  return index < 0 ? null : index + 1
}

function awardXp(
  state: LearnerData,
  amount: number,
  reason: XpReason,
  sourceId: string,
  followUps: LearnerEventDraft[],
) {
  if (amount <= 0) return
  state.xp.total += amount
  state.xp.weekly += amount
  if (state.gamification.activeRun) state.gamification.activeRun.xpEarned += amount
  followUps.push({ event: 'xp_awarded', amount, reason, sourceId })
}

function normalizeWeek(state: LearnerData, event: LearnerEvent, config: AppConfig) {
  const date = localDateFromTimestamp(event.occurredAt)
  const weekStart = startOfLocalWeek(date, config.product.weekStartsOn)
  if (state.gamification.xpWeekStart !== weekStart) {
    state.xp.weekly = 0
    state.gamification.xpWeekStart = weekStart
    state.weeklyGoal.completedDays = state.weeklyGoal.completedDays.filter(
      (day) => startOfLocalWeek(day, config.product.weekStartsOn) === weekStart,
    )
  }
  return { date, weekStart }
}

function applyQualifyingActivity(
  state: LearnerData,
  date: string,
  weekStart: string,
  sourceId: string,
  config: AppConfig,
  followUps: LearnerEventDraft[],
) {
  const previousStreak = state.streak.currentDays
  const previousQualifyingDate = state.streak.lastQualifyingDate
  state.streak = nextStreak(state.streak.currentDays, state.streak.lastQualifyingDate, date)
  if (
    state.streak.currentDays !== previousStreak ||
    previousQualifyingDate !== state.streak.lastQualifyingDate
  ) {
    followUps.push({
      event: 'streak_updated',
      currentDays: state.streak.currentDays,
      qualifyingDate: date,
    })
  }
  if (!state.weeklyGoal.completedDays.includes(date)) {
    state.weeklyGoal.completedDays.push(date)
  }
  const completedDays = state.weeklyGoal.completedDays.filter(
    (day) => startOfLocalWeek(day, config.product.weekStartsOn) === weekStart,
  ).length
  if (
    completedDays >= state.weeklyGoal.targetDays &&
    state.gamification.weeklyTargetRewardedWeek !== weekStart
  ) {
    state.gamification.weeklyTargetRewardedWeek = weekStart
    state.gamification.counters.weeklyGoalsMet += 1
    awardXp(state, config.gamification.xp.weeklyTarget, 'weekly_target', sourceId, followUps)
    followUps.push({ event: 'weekly_goal_met', weekStart, completedDays })
  }
}

function criterionMatchesLesson(
  criterion: Extract<AppConfig['badges'][number]['criteria'], { type: 'lessons_completed' }>,
  lessonId: string,
  registry: ContentRegistry,
) {
  const lesson = registry.lessonById.get(lessonId)
  if (!lesson) return false
  if (criterion.lessonIds && !criterion.lessonIds.includes(lessonId)) return false
  if (
    criterion.courseIds &&
    !criterion.courseIds.some((courseId) =>
      registry.courseById.get(courseId)?.lessons.some(({ id }) => id === lessonId),
    )
  ) {
    return false
  }
  return !criterion.difficulties || criterion.difficulties.includes(lesson.difficulty)
}

function progressWeeklyChallenges(
  state: LearnerData,
  previous: LearnerData,
  lessonId: string,
  weekStart: string,
  registry: ContentRegistry,
  followUps: LearnerEventDraft[],
) {
  if (previous.lessonProgress[lessonId]?.status === 'completed') return
  for (const challenge of registry.appConfig.challenges) {
    if (
      challenge.type !== 'weekly' ||
      challenge.progressRule?.type !== 'lessons_completed' ||
      !criterionMatchesLesson(challenge.progressRule, lessonId, registry)
    ) {
      continue
    }
    const period = state.gamification.challengePeriods[challenge.id] ?? {
      progressPeriod: weekStart,
      lastCompletedPeriod: null,
      periodProgress: 0,
    }
    if (period.progressPeriod !== weekStart) {
      period.progressPeriod = weekStart
      period.periodProgress = 0
    }
    if (period.lastCompletedPeriod === weekStart) continue
    period.periodProgress += 1
    state.gamification.challengePeriods[challenge.id] = period
    state.challenges[challenge.id] = {
      completed: period.periodProgress >= challenge.progressRule.count,
      progress: period.periodProgress,
      bestScore: state.challenges[challenge.id]?.bestScore ?? null,
    }
    if (period.periodProgress >= challenge.progressRule.count) {
      period.lastCompletedPeriod = weekStart
      state.gamification.counters.challengeCompletions[challenge.id] =
        (state.gamification.counters.challengeCompletions[challenge.id] ?? 0) + 1
      state.stats.challengesCompleted += 1
      awardXp(state, challenge.rewardXp, 'challenge_complete', challenge.id, followUps)
    }
  }
}

function grantDigitalReward(
  state: LearnerData,
  reward: { type: 'badge' | 'certificate' | 'points' | 'recognition'; id: string },
  occurredAt: string,
  followUps: LearnerEventDraft[],
) {
  if (
    state.gamification.digitalRewards.some(
      (current) => current.type === reward.type && current.id === reward.id,
    )
  ) {
    return
  }
  state.gamification.digitalRewards.push({ ...reward, grantedAt: occurredAt })
  followUps.push({
    event: 'reward_granted',
    rewardType: reward.type,
    rewardId: reward.id,
  })
}

function unlockBadge(
  state: LearnerData,
  badge: AppConfig['badges'][number],
  occurredAt: string,
  followUps: LearnerEventDraft[],
) {
  if (state.badges[badge.id]?.unlockedAt) return
  state.badges[badge.id] = { unlockedAt: occurredAt }
  grantDigitalReward(state, { type: 'badge', id: badge.id }, occurredAt, followUps)
  state.gamification.celebrations.push({
    id: `badge-${badge.id}-${occurredAt.replaceAll(/[^0-9]/g, '')}`,
    type: 'badge',
    badgeId: badge.id,
    rewardXp: badge.rewardXp,
  })
  followUps.push({ event: 'badge_unlocked', badgeId: badge.id })
  awardXp(state, badge.rewardXp, 'badge', badge.id, followUps)
}

function evaluateBadges(
  state: LearnerData,
  registry: ContentRegistry,
  occurredAt: string,
  followUps: LearnerEventDraft[],
) {
  for (const badge of registry.appConfig.badges) {
    if (
      !state.badges[badge.id]?.unlockedAt &&
      evaluateCriterion(badge.criteria, state, registry).complete
    ) {
      unlockBadge(state, badge, occurredAt, followUps)
    }
  }
}

function applyDemoCommand(
  state: LearnerData,
  event: Extract<LearnerEvent, { event: 'demo_command' }>,
  registry: ContentRegistry,
  followUps: LearnerEventDraft[],
) {
  switch (event.command) {
    case 'grant_xp':
      awardXp(state, event.amount, 'demo', 'developer-tools', followUps)
      break
    case 'simulate_badge': {
      const badge = event.badgeId
        ? registry.appConfig.badges.find(({ id }) => id === event.badgeId)
        : registry.appConfig.badges.find(({ id }) => !state.badges[id]?.unlockedAt)
      if (badge) unlockBadge(state, badge, event.occurredAt, followUps)
      break
    }
    case 'simulate_level_up':
      awardXp(
        state,
        xpToNextLevel(state.xp.total, registry.appConfig.gamification.levels),
        'demo',
        'developer-tools',
        followUps,
      )
      break
    case 'unlock_all':
      for (const lesson of registry.lessonById.values()) {
        const current = state.lessonProgress[lesson.id]
        if (current?.status === 'completed') continue
        state.lessonProgress[lesson.id] = {
          status: 'available',
          stars: current?.stars ?? 0,
          bestScore: current?.bestScore ?? null,
          attempts: current?.attempts ?? 0,
          lastPrimitiveIndex: current?.lastPrimitiveIndex ?? 0,
          completedAt: current?.completedAt ?? null,
        }
      }
      break
  }
}

export function applyGamificationEvent(
  state: LearnerData,
  previous: LearnerData,
  event: LearnerEvent,
  registry: ContentRegistry,
): LearnerEventDraft[] {
  const config = registry.appConfig
  const followUps: LearnerEventDraft[] = []
  const initialLevel = levelForXp(previous.xp.total, config.gamification.levels)
  const { date, weekStart } = normalizeWeek(state, event, config)

  switch (event.event) {
    case 'lesson_started':
      state.gamification.activeRun = {
        activityKind: 'lesson',
        activityId: event.lessonId,
        revision: previous.lessonProgress[event.lessonId]?.status === 'completed',
        xpEarned: 0,
        masteryBefore: Object.fromEntries(
          Object.entries(state.mastery).map(([id, value]) => [id, value.score]),
        ),
        weeklyXpBefore: state.xp.weekly,
        startedAt: event.occurredAt,
      }
      state.gamification.lastActivityResult = null
      break
    case 'challenge_started':
      state.gamification.activeRun = {
        activityKind: 'challenge',
        activityId: event.challengeId,
        revision: false,
        xpEarned: 0,
        masteryBefore: Object.fromEntries(
          Object.entries(state.mastery).map(([id, value]) => [id, value.score]),
        ),
        weeklyXpBefore: state.xp.weekly,
        startedAt: event.occurredAt,
      }
      state.gamification.lastActivityResult = null
      break
    case 'case_started':
      state.gamification.activeRun = {
        activityKind: 'case',
        activityId: event.caseId,
        revision: (previous.caseProgress[event.caseId]?.completions ?? 0) > 0,
        xpEarned: 0,
        masteryBefore: Object.fromEntries(
          Object.entries(state.mastery).map(([id, value]) => [id, value.score]),
        ),
        weeklyXpBefore: state.xp.weekly,
        startedAt: event.occurredAt,
      }
      state.gamification.lastActivityResult = null
      break
    case 'question_answered': {
      if (event.attempt !== 1) break
      if (event.activityKind === 'case') {
        state.gamification.lastQuestionReward = {
          questionId: event.questionId,
          xp: 0,
          at: event.occurredAt,
        }
      } else {
        const primitive = findPrimitive(
          registry,
          event.activityKind,
          event.activityId,
          event.questionId,
        )
        const baseXp =
          primitive?.scoring.xp ??
          (event.difficulty === 'advanced'
            ? config.gamification.xp.correctDifficult
            : config.gamification.xp.correctStandard)
        const amount = Math.round(baseXp * event.score)
        awardXp(state, amount, 'question', event.questionId, followUps)
        state.gamification.lastQuestionReward = {
          questionId: event.questionId,
          xp: amount,
          at: event.occurredAt,
        }
      }
      if (event.correct) {
        const counters = state.gamification.counters
        counters.firstAttemptCorrect += 1
        counters.firstAttemptCorrectByType[event.primitiveType] =
          (counters.firstAttemptCorrectByType[event.primitiveType] ?? 0) + 1
        for (const conceptId of event.conceptIds) {
          counters.firstAttemptCorrectByConcept[conceptId] =
            (counters.firstAttemptCorrectByConcept[conceptId] ?? 0) + 1
        }
      }
      break
    }
    case 'primitive_completed': {
      const reward = findPrimitive(
        registry,
        event.activityKind,
        event.activityId,
        event.primitiveId,
      )?.reward
      if (reward) grantDigitalReward(state, reward, event.occurredAt, followUps)
      break
    }
    case 'lesson_completed': {
      const lesson = registry.lessonById.get(event.lessonId)
      if (!lesson) break
      const reward = state.gamification.lessonRewards[event.lessonId] ?? {
        completionAwarded: false,
        perfectAwarded: false,
      }
      const revision =
        state.gamification.activeRun?.activityId === event.lessonId
          ? state.gamification.activeRun.revision
          : previous.lessonProgress[event.lessonId]?.status === 'completed'
      const stars = starsForScore(event.score, lesson.starThresholds ?? config.gamification.stars)
      const progress = state.lessonProgress[event.lessonId]
      if (progress) progress.stars = Math.max(progress.stars, stars)
      if (stars > (previous.lessonProgress[event.lessonId]?.stars ?? 0)) {
        followUps.push({ event: 'stars_awarded', lessonId: event.lessonId, stars })
      }
      if (!reward.completionAwarded) {
        awardXp(
          state,
          lesson.xpReward ?? config.gamification.xp.lessonComplete,
          'lesson_complete',
          event.lessonId,
          followUps,
        )
        reward.completionAwarded = true
      } else if (revision) {
        awardXp(
          state,
          config.gamification.xp.revisionComplete,
          'revision',
          event.lessonId,
          followUps,
        )
      }
      if (event.score === 100 && !reward.perfectAwarded) {
        awardXp(
          state,
          config.gamification.xp.perfectLessonBonus,
          'lesson_perfect',
          event.lessonId,
          followUps,
        )
        reward.perfectAwarded = true
        state.gamification.counters.perfectLessons += 1
      }
      state.gamification.lessonRewards[event.lessonId] = reward
      applyQualifyingActivity(state, date, weekStart, event.lessonId, config, followUps)
      progressWeeklyChallenges(state, previous, event.lessonId, weekStart, registry, followUps)
      break
    }
    case 'case_completed': {
      const caseLab = config.caseLab
      if (!caseLab) break
      const reward = state.gamification.caseRewards[event.caseId] ?? {
        completionAwarded: false,
        perfectAwarded: false,
        rewardedAttemptIds: [],
      }
      if (reward.rewardedAttemptIds.includes(event.attemptId)) break

      if (!reward.completionAwarded) {
        awardXp(state, caseLab.xp.caseComplete, 'case_complete', event.caseId, followUps)
        reward.completionAwarded = true
      } else {
        awardXp(
          state,
          config.gamification.xp.revisionComplete,
          'revision',
          event.caseId,
          followUps,
        )
      }
      if (event.breakdown.total === 100 && !reward.perfectAwarded) {
        awardXp(
          state,
          caseLab.xp.perfectCaseBonus,
          'case_perfect',
          event.caseId,
          followUps,
        )
        reward.perfectAwarded = true
      }
      reward.rewardedAttemptIds.push(event.attemptId)
      state.gamification.caseRewards[event.caseId] = reward
      applyQualifyingActivity(state, date, weekStart, event.caseId, config, followUps)
      break
    }
    case 'challenge_completed': {
      const challenge = config.challenges.find(({ id }) => id === event.challengeId)
      if (!challenge) break
      const key = periodKey(challenge.type, date, config.product.weekStartsOn)
      const period = state.gamification.challengePeriods[event.challengeId] ?? {
        progressPeriod: key,
        lastCompletedPeriod: null,
        periodProgress: 0,
      }
      if (period.progressPeriod !== key) {
        period.progressPeriod = key
        period.periodProgress = 0
      }
      const firstInPeriod = period.lastCompletedPeriod !== key
      if (firstInPeriod) {
        if (previous.challenges[event.challengeId]?.completed) {
          state.stats.challengesCompleted += 1
        }
        period.lastCompletedPeriod = key
        period.periodProgress = event.scoredCount
        state.gamification.counters.challengeCompletions[event.challengeId] =
          (state.gamification.counters.challengeCompletions[event.challengeId] ?? 0) + 1
        awardXp(
          state,
          challenge.rewardXp ??
            (challenge.type === 'daily'
              ? config.gamification.xp.dailyChallenge
              : config.gamification.xp.weeklyTarget),
          'challenge_complete',
          event.challengeId,
          followUps,
        )
        if (event.score === 100) {
          awardXp(
            state,
            config.gamification.xp.perfectChallengeBonus,
            'challenge_perfect',
            event.challengeId,
            followUps,
          )
        }
        if (challenge.type === 'daily') {
          applyQualifyingActivity(state, date, weekStart, event.challengeId, config, followUps)
        }
      }
      state.gamification.challengePeriods[event.challengeId] = period
      break
    }
    case 'celebration_dismissed':
      state.gamification.celebrations = state.gamification.celebrations.filter(
        ({ id }) => id !== event.celebrationId,
      )
      break
    case 'demo_command':
      applyDemoCommand(state, event, registry, followUps)
      break
  }

  evaluateBadges(state, registry, event.occurredAt, followUps)

  const finalLevel = levelForXp(state.xp.total, config.gamification.levels)
  if (finalLevel > initialLevel) {
    state.gamification.celebrations.push({
      id: `level-${finalLevel}-${event.id}`,
      type: 'level',
      from: initialLevel,
      to: finalLevel,
    })
    followUps.push({ event: 'level_up', from: initialLevel, to: finalLevel })
  }
  return followUps
}

export function finalizeActivityResult(
  state: LearnerData,
  event: LearnerEvent,
  registry: ContentRegistry,
) {
  if (
    event.event !== 'lesson_completed' &&
    event.event !== 'challenge_completed' &&
    event.event !== 'case_completed'
  ) {
    return
  }
  const run = state.gamification.activeRun
  const activityId =
    event.event === 'lesson_completed'
      ? event.lessonId
      : event.event === 'challenge_completed'
        ? event.challengeId
        : event.caseId
  if (!run || run.activityId !== activityId) return
  const levelTo = levelForXp(state.xp.total, registry.appConfig.gamification.levels)
  const levelFrom = levelForXp(
    state.xp.total - run.xpEarned,
    registry.appConfig.gamification.levels,
  )
  const masteryDelta = Object.fromEntries(
    Object.entries(state.mastery)
      .map(([id, value]) => [
        id,
        Math.round((value.score - (run.masteryBefore[id] ?? value.score)) * 100) / 100,
      ])
      .filter(([, delta]) => delta !== 0),
  )
  state.gamification.lastActivityResult = {
    activityKind: run.activityKind,
    activityId,
    xpEarned: run.xpEarned,
    stars:
      event.event === 'lesson_completed' ? (state.lessonProgress[event.lessonId]?.stars ?? 0) : 0,
    masteryDelta,
    rankBefore: leaderboardRank(
      { ...state, xp: { ...state.xp, weekly: run.weeklyXpBefore } },
      registry.appConfig,
    ),
    rankAfter: leaderboardRank(state, registry.appConfig),
    badgesUnlocked: Object.entries(state.badges)
      .filter(([, badge]) => badge.unlockedAt === event.occurredAt)
      .map(([badgeId]) => badgeId),
    levelFrom,
    levelTo,
    streak: state.streak.currentDays,
    revision: run.revision,
  }
  state.gamification.activeRun = null
}
