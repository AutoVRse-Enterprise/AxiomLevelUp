import type { ContentRegistry } from '@/content/loader'
import { applyCaseProgressEvent, attachCaseAttemptRewardResult } from '@/engines/cases/progress'
import { applyGamificationEvent, finalizeActivityResult } from '@/engines/gamification'
import { applyLearningEvent } from '@/engines/learning/progress'
import { applyMasteryEvent } from '@/engines/mastery/mastery'
import type { LearnerEvent, LearnerEventDraft } from '@/events/types'
import type { LearnerData } from '@/state/learnerStore'

export interface LearnerPipelineResult {
  state: LearnerData
  followUps: LearnerEventDraft[]
}

export function reduceLearnerEvent(
  current: LearnerData,
  event: LearnerEvent,
  registry: ContentRegistry,
): LearnerPipelineResult {
  const state = structuredClone(current)
  const learning = applyLearningEvent(
    {
      lessonProgress: state.lessonProgress,
      challenges: state.challenges,
      stats: state.stats,
    },
    event,
    registry,
  )
  state.lessonProgress = learning.state.lessonProgress
  state.challenges = learning.state.challenges
  state.stats = learning.state.stats

  const historyLimit = registry.appConfig.caseLab?.historyLimit
  const caseAttemptAdded = historyLimit ? applyCaseProgressEvent(state, event, historyLimit) : false

  const gamificationFollowUps = applyGamificationEvent(state, current, event, registry)
  const masteryFollowUps = applyMasteryEvent(state, event, registry.appConfig.gamification.mastery)
  finalizeActivityResult(state, event, registry)
  if (caseAttemptAdded) attachCaseAttemptRewardResult(state, event)

  return {
    state,
    followUps: [...learning.followUps, ...gamificationFollowUps, ...masteryFollowUps],
  }
}
