import { Award, Brain, Flame, Star, Trophy } from 'lucide-react'

import type { LearnerSeed } from '@/content/schema'

type ActivityResult = LearnerSeed['gamification']['lastActivityResult']

export function RewardSummary({ result }: { result: NonNullable<ActivityResult> }) {
  const masteryGain = Object.values(result.masteryDelta).reduce((total, delta) => total + delta, 0)
  const rankGain = result.rankBefore && result.rankAfter ? result.rankBefore - result.rankAfter : 0

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-lg bg-brand-50 p-4">
        <dt className="flex items-center gap-2 text-small text-brand-800">
          <Award aria-hidden="true" size={17} /> XP earned
        </dt>
        <dd className="mt-1 text-title font-bold text-brand-950">+{result.xpEarned}</dd>
      </div>
      <div className="rounded-lg bg-neutral-100 p-4">
        <dt className="flex items-center gap-2 text-small text-neutral-600">
          <Star aria-hidden="true" size={17} /> Stars
        </dt>
        <dd
          aria-label={`${result.stars} of 3 stars`}
          className="mt-1 text-title font-bold text-star"
        >
          {'★'.repeat(result.stars)}
          <span className="text-neutral-300">{'★'.repeat(3 - result.stars)}</span>
        </dd>
      </div>
      <div className="rounded-lg bg-neutral-100 p-4">
        <dt className="flex items-center gap-2 text-small text-neutral-600">
          <Brain aria-hidden="true" size={17} /> Mastery
        </dt>
        <dd className="mt-1 text-title font-bold">
          {masteryGain >= 0 ? '+' : ''}
          {Math.round(masteryGain * 100) / 100}
        </dd>
      </div>
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
      <div className="col-span-2 flex items-center gap-2 rounded-lg bg-warning-50 p-4 text-small font-semibold text-warning-800 sm:col-span-4">
        <Flame aria-hidden="true" size={18} /> {result.streak} day streak
        {result.revision ? ' · Revision complete' : ''}
      </div>
    </dl>
  )
}
