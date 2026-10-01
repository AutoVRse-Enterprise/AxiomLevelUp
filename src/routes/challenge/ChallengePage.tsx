import { ArrowRight, CalendarDays, CheckCircle2, Clock, Target, Trophy } from 'lucide-react'
import { Link } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { SectionHeader } from '@/components/learning'
import { Card, Chip, ProgressBar } from '@/components/ui'
import { emitEvent } from '@/events/bus'
import { today } from '@/lib/clock'
import { useLearnerStore } from '@/state/learnerStore'
import { selectChallengePeriod } from '@/state/selectors'

export function ChallengePage() {
  const { appConfig } = useContent()
  const challengeProgress = useLearnerStore((state) => state.challenges)
  const gamification = useLearnerStore((state) => state.gamification)
  const daily = appConfig.challenges.filter(({ type }) => type === 'daily')
  const weekly = appConfig.challenges.filter(({ type }) => type === 'weekly')

  if (!appConfig.challenges.length) {
    return (
      <EmptyState
        icon={<Target aria-hidden="true" size={30} />}
        message="Check back when a challenge has been configured."
        title="No challenges available"
      />
    )
  }

  return (
    <div className="space-y-9">
      <header>
        <Chip tone="brand">Quick practice</Chip>
        <h1 className="mt-3 text-display font-bold">Challenge yourself</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          Focused activities help reinforce concepts and build consistent learning habits.
        </p>
      </header>

      <section aria-label="Daily challenges">
        <SectionHeader
          description="A short set of focused questions for today."
          title="Daily challenge"
        />
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {daily.map((challenge) => {
            const progress = challengeProgress[challenge.id]
            const period = selectChallengePeriod(
              { gamification },
              challenge,
              today(),
              appConfig.product.weekStartsOn,
            )
            return (
              <Card className="relative overflow-hidden" key={challenge.id}>
                <div className="absolute right-0 top-0 size-28 -translate-y-8 translate-x-8 rounded-full bg-brand-100" />
                <Target aria-hidden="true" className="relative text-brand-700" size={30} />
                <div className="relative mt-4 flex flex-wrap gap-2">
                  <Chip tone={period.completed ? 'success' : 'brand'}>
                    {period.completed ? 'Completed today' : 'Ready'}
                  </Chip>
                  {progress?.bestScore !== null && progress?.bestScore !== undefined ? (
                    <Chip>Best {progress.bestScore}%</Chip>
                  ) : null}
                </div>
                <h2 className="relative mt-4 text-title font-bold">{challenge.title}</h2>
                <p className="relative mt-2 text-neutral-600">{challenge.description}</p>
                <div className="relative mt-5 flex flex-wrap gap-4 text-small font-medium text-neutral-600">
                  <span className="flex items-center gap-1.5">
                    <Target aria-hidden="true" size={16} /> {challenge.itemCount} questions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock aria-hidden="true" size={16} /> ~{challenge.estimatedMinutes} min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Trophy aria-hidden="true" size={16} /> +{challenge.rewardXp} XP
                  </span>
                </div>
                <Link
                  className="relative mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800 focus-visible:outline-2"
                  onClick={() =>
                    emitEvent({ event: 'challenge_opened', challengeId: challenge.id })
                  }
                  to={`/challenge/${challenge.id}/play`}
                >
                  {period.completed ? 'Review challenge' : 'Start challenge'}
                  <ArrowRight aria-hidden="true" size={17} />
                </Link>
              </Card>
            )
          })}
        </div>
      </section>

      <section aria-label="Weekly challenges">
        <SectionHeader
          description="Longer goals that reward sustained practice."
          title="Weekly challenge"
        />
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {weekly.map((challenge) => {
            const period = selectChallengePeriod(
              { gamification },
              challenge,
              today(),
              appConfig.product.weekStartsOn,
            )
            const target = challenge.target ?? challenge.itemCount
            const value = Math.min(period.progress, target)
            return (
              <Card key={challenge.id}>
                <div className="flex items-start justify-between gap-4">
                  <CalendarDays aria-hidden="true" className="text-brand-700" size={28} />
                  {period.completed ? (
                    <span className="flex items-center gap-1 text-small font-semibold text-success-700">
                      <CheckCircle2 aria-hidden="true" size={16} /> Complete
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 text-heading font-bold">{challenge.title}</h2>
                <p className="mt-2 text-neutral-600">{challenge.description}</p>
                <ProgressBar
                  className="mt-5"
                  label={`${value} of ${target} activities`}
                  max={target}
                  value={value}
                />
                <p className="mt-4 text-small font-medium text-neutral-600">
                  {challenge.estimatedMinutes} min · +{challenge.rewardXp} XP on completion
                </p>
              </Card>
            )
          })}
          {!weekly.length ? (
            <Card>
              <p className="text-neutral-600">No weekly challenge is configured.</p>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  )
}
