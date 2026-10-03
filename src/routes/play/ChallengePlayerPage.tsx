import { Puzzle, WifiOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { buildActivityPlan, challengeActivity } from '@/engines/learning/plan'
import { challengePackage } from '@/offline/package'
import { isChallengeOfflineReady } from '@/offline/readiness'
import { ActivityPlayer } from '@/player/ActivityPlayer'
import { CasePlayer } from '@/player/case/CasePlayer'
import { useConnectivity } from '@/pwa/connectivity'
import { useLearnerStore } from '@/state/learnerStore'

export function ChallengePlayerPage() {
  const { challengeId } = useParams()
  const registry = useContent()
  const { appConfig } = registry
  const { online } = useConnectivity()
  const challengeProgress = useLearnerStore((state) => state.challenges)
  const caseProgress = useLearnerStore((state) => state.caseProgress)
  const caseAttempts = useLearnerStore((state) => state.caseAttempts)
  const [completedCaseAttemptId, setCompletedCaseAttemptId] = useState<string | null>(null)
  const challenge = appConfig.challenges.find(({ id }) => id === challengeId)
  const plan = useMemo(
    () =>
      challenge?.items
        ? buildActivityPlan(challengeActivity(challenge), {
            environment: import.meta.env.DEV ? 'development' : 'production',
            player: appConfig.product.player,
          })
        : null,
    [appConfig.product.player, challenge],
  )

  if (!challenge) {
    return (
      <EmptyState
        title="Challenge not found"
        message="This challenge is unavailable or may have moved."
        action={<Link to="/challenge">Return to challenges</Link>}
      />
    )
  }

  if (challenge.items === undefined) {
    const caseDoc = registry.caseById.get(challenge.caseId)
    if (!caseDoc || !appConfig.caseLab) {
      return (
        <EmptyState
          title="Challenge unavailable"
          message="The case for this challenge is currently unavailable."
          action={<Link to="/challenge">Return to challenges</Link>}
        />
      )
    }

    const progress = caseProgress[caseDoc.id]
    return (
      <CasePlayer
        anatomyMap={registry.anatomyMapById.get(caseDoc.anatomyMapId)}
        attemptHistory={(caseAttempts[caseDoc.id] ?? []).filter(
          ({ attemptId }) => attemptId !== completedCaseAttemptId,
        )}
        caseDoc={caseDoc}
        challengeId={challenge.id}
        config={appConfig}
        continuePath="/challenge"
        exitPath="/challenge"
        previousAttempts={progress?.completions ?? 0}
        previousBestScore={progress?.bestTotal ?? null}
        onComplete={({ attemptId }) => setCompletedCaseAttemptId(attemptId)}
      />
    )
  }

  if (!plan) {
    return (
      <EmptyState
        title="Challenge unavailable"
        message="This challenge is completed through its linked learning goals."
        action={<Link to="/challenge">Return to challenges</Link>}
      />
    )
  }

  if (challenge.type === 'weekly' && challenge.items.length === 0) {
    return (
      <EmptyState
        icon={<Puzzle aria-hidden="true" size={30} />}
        title="Weekly goal"
        message="Continue this goal through its linked learning activities."
        action={<Link to="/challenge">Return to challenges</Link>}
      />
    )
  }

  if (!plan.playable) {
    return (
      <EmptyState
        icon={<Puzzle aria-hidden="true" size={30} />}
        title="Challenge unavailable"
        message={plan.unavailableReason ?? 'This challenge is currently unavailable.'}
        action={<Link to="/challenge">Return to challenges</Link>}
      />
    )
  }

  const offlinePackage = challengePackage(
    challenge.id,
    registry,
    import.meta.env.VITE_DICOM_BASE_URL?.trim() || '/assets/dicom/',
  )
  if (!online && offlinePackage && !isChallengeOfflineReady(offlinePackage)) {
    return (
      <EmptyState
        icon={<WifiOff aria-hidden="true" size={30} />}
        title="This challenge is not available offline"
        message="Connect to the internet or choose an offline lesson."
        action={<Link to="/challenge">Return to challenges</Link>}
      />
    )
  }

  const progress = challengeProgress[challenge.id]
  return (
    <ActivityPlayer
      plan={plan}
      previousAttempts={progress?.completed ? 1 : 0}
      previousBestScore={progress?.bestScore ?? null}
      continuePath="/challenge"
      exitPath="/challenge"
    />
  )
}
