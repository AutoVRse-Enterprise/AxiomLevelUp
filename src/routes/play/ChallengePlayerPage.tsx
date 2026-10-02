import { Puzzle, WifiOff } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { buildActivityPlan, challengeActivity } from '@/engines/learning/plan'
import { challengePackage } from '@/offline/package'
import { isChallengeOfflineReady } from '@/offline/readiness'
import { ActivityPlayer } from '@/player/ActivityPlayer'
import { useConnectivity } from '@/pwa/connectivity'
import { useLearnerStore } from '@/state/learnerStore'

export function ChallengePlayerPage() {
  const { challengeId } = useParams()
  const registry = useContent()
  const { appConfig } = registry
  const { online } = useConnectivity()
  const challengeProgress = useLearnerStore((state) => state.challenges)
  const challenge = appConfig.challenges.find(({ id }) => id === challengeId)
  const plan = useMemo(
    () =>
      challenge
        ? buildActivityPlan(challengeActivity(challenge), {
            environment: import.meta.env.DEV ? 'development' : 'production',
            player: appConfig.product.player,
          })
        : null,
    [appConfig.product.player, challenge],
  )

  if (!challenge || !plan) {
    return (
      <EmptyState
        title="Challenge not found"
        message="This challenge is not configured."
        action={<Link to="/challenge">Return to challenges</Link>}
      />
    )
  }

  if (!plan.playable) {
    return (
      <EmptyState
        icon={<Puzzle aria-hidden="true" size={30} />}
        title="Challenge unavailable"
        message={plan.unavailableReason ?? 'This challenge is not playable yet.'}
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
