import { CheckCircle2, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui'
import { RewardSummary } from '@/components/rewards/RewardSummary'
import type { LearnerSeed } from '@/content/schema'
import type { ActivitySummary } from '@/engines/learning/session'

interface CompletionSummaryProps {
  title: string
  summary: ActivitySummary
  personalBest: boolean
  rewards: LearnerSeed['gamification']['lastActivityResult']
  onContinue: () => void
  onReplay: () => void
}

export function CompletionSummary({
  title,
  summary,
  personalBest,
  rewards,
  onContinue,
  onReplay,
}: CompletionSummaryProps) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10 sm:py-16">
      <CheckCircle2 aria-hidden="true" className="text-success-600" size={40} />
      <p className="mt-4 text-small font-semibold text-success-700">Activity complete</p>
      <h1 className="mt-2 text-display font-bold text-neutral-950">{title}</h1>
      <dl className="mt-8 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-neutral-100 p-4">
          <dt className="text-small text-neutral-600">Accuracy</dt>
          <dd className="mt-1 text-title font-bold">{summary.accuracy}%</dd>
        </div>
        <div className="rounded-lg bg-neutral-100 p-4">
          <dt className="text-small text-neutral-600">Score</dt>
          <dd className="mt-1 text-title font-bold">{summary.score}%</dd>
        </div>
      </dl>
      {summary.scoredCount ? (
        <p className="mt-3 text-small text-neutral-600">
          {summary.correctCount} of {summary.scoredCount} correct on the first attempt
        </p>
      ) : null}
      {personalBest ? <p className="mt-4 font-semibold text-brand-700">New personal best</p> : null}
      {summary.missed.length ? (
        <section className="mt-8">
          <h2 className="text-heading font-bold">Review</h2>
          <ul className="mt-3 space-y-3">
            {summary.missed.map((item) => (
              <li key={item.primitiveId} className="rounded-lg border border-neutral-200 p-4">
                <p className="font-semibold text-neutral-900">{item.prompt}</p>
                {item.explanation ? (
                  <p className="mt-2 text-small text-neutral-700">{item.explanation}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {rewards ? (
        <div className="mt-8">
          <RewardSummary result={rewards} />
        </div>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" onClick={onContinue}>
          Continue
        </Button>
        <Button
          size="lg"
          variant="secondary"
          leadingIcon={<RotateCcw aria-hidden="true" size={18} />}
          onClick={onReplay}
        >
          Replay
        </Button>
      </div>
    </section>
  )
}
