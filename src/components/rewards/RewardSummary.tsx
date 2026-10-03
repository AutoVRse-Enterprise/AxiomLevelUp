import { Flame, Trophy } from 'lucide-react'

import { useContent } from '@/app/contentContext'
import { CompletionMetrics } from '@/components/rewards/CompletionMetrics'
import type { LearnerSeed } from '@/content/schema'

type ActivityResult = LearnerSeed['gamification']['lastActivityResult']

export function RewardSummary({ result }: { result: NonNullable<ActivityResult> }) {
  const { appConfig } = useContent()
  const rankGain = result.rankBefore && result.rankAfter ? result.rankBefore - result.rankAfter : 0
  const badgeLabels = result.badgesUnlocked.map(
    (id) => appConfig.badges.find((badge) => badge.id === id)?.title ?? 'Awarded badge',
  )

  return (
    <div className="space-y-3">
      <CompletionMetrics
        awardedXp={result.xpEarned}
        badgeLabels={badgeLabels}
        masteryDelta={result.masteryDelta}
        stars={result.stars}
      />
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-neutral-100 p-4">
          <dt className="flex items-center gap-2 text-small text-neutral-600">
            <Trophy aria-hidden="true" size={17} /> Rank
          </dt>
          <dd className="mt-1 text-title font-bold">
            {result.rankAfter ? `#${result.rankAfter}` : 'Unranked'}
            {rankGain > 0 ? (
              <span className="ml-1 text-small text-success-700">↑ {rankGain}</span>
            ) : null}
          </dd>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-warning-50 p-4 text-small font-semibold text-warning-800">
          <Flame aria-hidden="true" size={18} /> {result.streak} day streak
          {result.revision ? ' · Revision complete' : ''}
        </div>
      </dl>
    </div>
  )
}
