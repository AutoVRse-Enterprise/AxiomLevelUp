import { lazy, Suspense } from 'react'

import { useLearnerStore } from '@/state/learnerStore'

const CelebrationHost = lazy(() =>
  import('@/components/rewards/CelebrationHost').then((module) => ({
    default: module.CelebrationHost,
  })),
)

export function DeferredCelebrationHost({
  suppressDuringSession = false,
}: {
  suppressDuringSession?: boolean
}) {
  const hasPendingCelebration = useLearnerStore(
    (state) => state.gamification.celebrations.length > 0,
  )
  if (!hasPendingCelebration) return null

  return (
    <Suspense fallback={null}>
      <CelebrationHost suppressDuringSession={suppressDuringSession} />
    </Suspense>
  )
}
