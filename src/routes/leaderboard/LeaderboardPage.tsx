import { Minus, TrendingDown, TrendingUp, Trophy } from 'lucide-react'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LeaderboardRow, StatTile } from '@/components/learning'
import { Card } from '@/components/ui'
import { useLearnerStore } from '@/state/learnerStore'
import { selectLeaderboardView } from '@/state/selectors'

export function LeaderboardPage() {
  const { appConfig } = useContent()
  const learner = useLearnerStore((state) => state.learner)
  const xp = useLearnerStore((state) => state.xp)
  const view = selectLeaderboardView(
    { learner, xp },
    appConfig.leaderboard.entries,
    appConfig.product.leaderboard.visibleWindow,
  )

  if (!appConfig.leaderboard.entries.length) {
    return (
      <EmptyState
        icon={<Trophy aria-hidden="true" size={30} />}
        message="Cohort rankings will appear after participation begins."
        title="No leaderboard entries"
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header className="text-center">
        <Trophy aria-hidden="true" className="mx-auto text-star" size={34} />
        <h1 className="mt-3 text-display font-bold">{appConfig.leaderboard.scope}</h1>
        <p className="mt-2 text-neutral-600">See how this week's learning momentum compares.</p>
      </header>

      <div className="flex justify-center gap-2" aria-label="Leaderboard period">
        <button
          aria-pressed="true"
          className="min-h-10 rounded-full bg-brand-700 px-4 text-small font-semibold text-white"
          type="button"
        >
          Weekly
        </button>
        {['Monthly', 'All time'].map((period) => (
          <button
            aria-disabled="true"
            className="min-h-10 cursor-not-allowed rounded-full border border-neutral-200 bg-neutral-100 px-4 text-small font-semibold text-neutral-600"
            disabled
            key={period}
            title={`${period} rankings are coming soon`}
            type="button"
          >
            {period}
          </button>
        ))}
      </div>

      <Card className="grid grid-cols-2 gap-3">
        <StatTile
          icon={<Trophy aria-hidden="true" size={17} />}
          label="Your position"
          value={view.rank ? `#${view.rank}` : 'Unranked'}
        />
        <StatTile
          icon={
            view.movement > 0 ? (
              <TrendingUp aria-hidden="true" size={17} />
            ) : view.movement < 0 ? (
              <TrendingDown aria-hidden="true" size={17} />
            ) : (
              <Minus aria-hidden="true" size={17} />
            )
          }
          label="Movement"
          value={view.movement === 0 ? 'No change' : `${view.movement > 0 ? '+' : ''}${view.movement}`}
        />
      </Card>

      <section aria-labelledby="weekly-ranking-heading">
        <h2 className="text-heading font-bold" id="weekly-ranking-heading">This week</h2>
        <ol className="mt-4 divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-card">
          {view.rows.map((row) => (
            <LeaderboardRow
              current={row.isCurrentLearner}
              key={row.id}
              movement={row.movement}
              name={row.name}
              rank={row.rank}
              xp={row.weeklyXp}
            />
          ))}
        </ol>
      </section>

      {view.rank === null ? (
        <p className="text-center text-small text-neutral-600">
          Earn weekly XP to join the cohort ranking.
        </p>
      ) : null}
    </div>
  )
}
