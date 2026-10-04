import { Minus, TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LeaderboardRow, StatTile } from '@/components/learning'
import { Button, Card, Chip } from '@/components/ui'
import { useLearnerStore } from '@/state/learnerStore'
import { selectLeaderboardView, type LeaderboardPeriod } from '@/state/selectors'

const periods: Array<{
  id: LeaderboardPeriod
  label: string
  heading: string
  description: string
}> = [
  {
    id: 'weekly',
    label: 'Weekly',
    heading: 'This week',
    description: "See how this week's learning momentum compares.",
  },
  {
    id: 'monthly',
    label: 'Monthly',
    heading: 'This month',
    description: "See how this month's learning momentum compares.",
  },
  {
    id: 'all_time',
    label: 'All time',
    heading: 'All-time ranking',
    description: 'See how your total learning progress compares.',
  },
]

export function LeaderboardPage() {
  const { appConfig } = useContent()
  const learner = useLearnerStore((state) => state.learner)
  const xp = useLearnerStore((state) => state.xp)
  const [period, setPeriod] = useState<LeaderboardPeriod>(appConfig.leaderboard.period)
  const [segments, setSegments] = useState({
    country: '',
    specialty: '',
    institution: '',
  })
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activePeriod = periods.find(({ id }) => id === period) ?? periods[0]!
  const segmentOptions = {
    country: [...new Set(appConfig.leaderboard.entries.flatMap(({ country }) => country ?? []))],
    specialty: [
      ...new Set(appConfig.leaderboard.entries.flatMap(({ specialty }) => specialty ?? [])),
    ],
    institution: [
      ...new Set(appConfig.leaderboard.entries.flatMap(({ institution }) => institution ?? [])),
    ],
  }
  const filteredEntries = appConfig.leaderboard.entries.filter(
    (entry) =>
      (!segments.country || entry.country === segments.country) &&
      (!segments.specialty || entry.specialty === segments.specialty) &&
      (!segments.institution || entry.institution === segments.institution),
  )
  const view = selectLeaderboardView(
    { learner, xp },
    filteredEntries,
    appConfig.product.leaderboard.visibleWindow,
    period,
  )

  const selectAdjacentTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % periods.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + periods.length) % periods.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = periods.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    const nextPeriod = periods[nextIndex]!
    setPeriod(nextPeriod.id)
    tabRefs.current[nextIndex]?.focus()
  }

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
        <p className="mt-2 text-neutral-600">{activePeriod.description}</p>
        {appConfig.leaderboard.simulated ? (
          <div className="mt-3">
            <Chip tone="brand">Simulated data</Chip>
          </div>
        ) : null}
      </header>

      {appConfig.leaderboard.simulated ? (
        <Card>
          <div className="flex flex-wrap items-end gap-3">
            {(
              [
                ['country', 'Country'],
                ['specialty', 'Specialty'],
                ['institution', 'Institution'],
              ] as const
            ).map(([field, label]) => (
              <label className="min-w-40 flex-1 text-small font-semibold text-neutral-800" key={field}>
                {label}
                <select
                  className="mt-1 min-h-11 w-full rounded-md border border-neutral-300 bg-white px-3 font-normal text-neutral-900 focus-visible:outline-2"
                  value={segments[field]}
                  onChange={(event) =>
                    setSegments((current) => ({ ...current, [field]: event.target.value }))
                  }
                >
                  <option value="">All {label.toLowerCase()}s</option>
                  {segmentOptions[field].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <Button
              disabled={!Object.values(segments).some(Boolean)}
              size="sm"
              variant="secondary"
              onClick={() => setSegments({ country: '', specialty: '', institution: '' })}
            >
              Clear filters
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="flex justify-center gap-2" aria-label="Leaderboard period" role="tablist">
        {periods.map((option, index) => (
          <button
            aria-controls="leaderboard-ranking"
            aria-selected={period === option.id}
            className={
              period === option.id
                ? 'min-h-10 rounded-full bg-brand-700 px-4 text-small font-semibold text-white focus-visible:outline-2'
                : 'min-h-10 rounded-full border border-neutral-200 bg-white px-4 text-small font-semibold text-neutral-700 hover:border-brand-300 focus-visible:outline-2'
            }
            id={`leaderboard-tab-${option.id}`}
            key={option.id}
            onClick={() => setPeriod(option.id)}
            onKeyDown={(event) => selectAdjacentTab(event, index)}
            ref={(element) => {
              tabRefs.current[index] = element
            }}
            role="tab"
            tabIndex={period === option.id ? 0 : -1}
            type="button"
          >
            {option.label}
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
            period !== 'weekly' ? (
              <Minus aria-hidden="true" size={17} />
            ) : view.movement > 0 ? (
              <TrendingUp aria-hidden="true" size={17} />
            ) : view.movement < 0 ? (
              <TrendingDown aria-hidden="true" size={17} />
            ) : (
              <Minus aria-hidden="true" size={17} />
            )
          }
          label={period === 'weekly' ? 'Weekly movement' : 'Rank history'}
          value={
            period === 'weekly'
              ? view.movement === 0
                ? 'No change'
                : `${view.movement > 0 ? '+' : ''}${view.movement}`
              : 'Not tracked'
          }
        />
      </Card>

      <section
        aria-labelledby={`leaderboard-tab-${period} leaderboard-ranking-heading`}
        id="leaderboard-ranking"
        role="tabpanel"
      >
        <h2 className="text-heading font-bold" id="leaderboard-ranking-heading">
          {activePeriod.heading}
        </h2>
        {view.rows.length ? (
          <ol className="mt-4 divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-card">
            {view.rows.map((row) => (
              <LeaderboardRow
                current={row.isCurrentLearner}
                key={row.id}
                movement={row.movement}
                name={row.name}
                rank={row.rank}
                showMovement={period === 'weekly'}
                xp={row.periodXp}
              />
            ))}
          </ol>
        ) : (
          <p className="mt-4 rounded-lg border border-neutral-200 bg-white p-5 text-neutral-600">
            No sample learners match these filters.
          </p>
        )}
      </section>

      {view.rank === null ? (
        <p className="text-center text-small text-neutral-600">
          Earn XP to join the cohort ranking.
        </p>
      ) : null}
    </div>
  )
}
