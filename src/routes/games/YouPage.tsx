import { Award, CalendarDays, Gamepad2, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { CreditsSheet } from '@/components/game/CreditsSheet'
import { Button, Card } from '@/components/ui'
import { learnerSeedSchema } from '@/content/schema'
import { collectRunCredits } from '@/engines/games/credits'
import { useGameSessionStore } from '@/engines/games/sessionStore'
import { useLearnerStore } from '@/state/learnerStore'
import {
  selectBestByFormatAndDifficulty,
  selectPlayerGameStats,
  selectRecentRuns,
} from '@/state/selectors/games'

export function YouPage() {
  const registry = useContent()
  const config = registry.appConfig.games
  const games = useLearnerStore((state) => state.games)
  const gameDaily = useLearnerStore((state) => state.gameDaily)
  const player = useLearnerStore((state) => state.player)
  const replaceWithSeed = useLearnerStore((state) => state.replaceWithSeed)
  const setPlayerDisplayName = useLearnerStore((state) => state.setPlayerDisplayName)
  const [search] = useSearchParams()
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(player.displayName ?? '')
  const [status, setStatus] = useState('')
  const stats = selectPlayerGameStats({ games, gameDaily })
  const recent = selectRecentRuns(games, registry, 10)
  const bests = selectBestByFormatAndDifficulty(games, registry)
  const credits = useMemo(() => {
    const roundIds = [
      ...new Set(
        (config?.formats ?? [])
          .filter(({ status, gameId }) => status === 'playable' && gameId)
          .flatMap(
            ({ gameId }) => registry.gameById.get(gameId!)?.slots.flatMap(({ pool }) => pool) ?? [],
          ),
      ),
    ]
    return collectRunCredits(roundIds, registry)
  }, [config?.formats, registry])
  if (!config?.you || !config.copy) return null
  const copy = config.you
  const presenter = Boolean(registry.appConfig.demo?.enabled && search.get('presenter') === '1')

  const applyProfile = async (seedProfile: 'fresh' | 'advanced') => {
    const seedPath = registry.manifest.seeds[seedProfile]
    if (!seedPath) return
    const response = await fetch(`${registry.contentBaseUrl ?? '/content'}/${seedPath}`)
    if (!response.ok) throw new Error(`Seed request failed with ${response.status}.`)
    replaceWithSeed(learnerSeedSchema.parse(await response.json()))
    await useGameSessionStore.persist.rehydrate()
    await useGameSessionStore.persist.clearStorage()
    useGameSessionStore.getState().clear()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="text-display font-bold">{copy.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <UserRound aria-hidden="true" className="text-brand-700" />
          {editingName ? (
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                setPlayerDisplayName(name)
                setEditingName(false)
              }}
            >
              <label className="sr-only" htmlFor="you-display-name">
                {copy.displayName}
              </label>
              <input
                className="min-h-11 rounded-md border border-neutral-300 px-3"
                id="you-display-name"
                maxLength={40}
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
              <Button disabled={!name.trim()} type="submit">
                {copy.saveName}
              </Button>
            </form>
          ) : (
            <>
              <strong>{player.displayName ?? 'You'}</strong>
              <Button onClick={() => setEditingName(true)} size="sm" variant="secondary">
                {copy.editName}
              </Button>
            </>
          )}
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: copy.gamesPlayed, value: stats.gamesPlayed, Icon: Gamepad2 },
          { label: copy.dailyStreak, value: stats.dailyStreak, Icon: CalendarDays },
          { label: config.hub.bestScoreLabel, value: stats.bestScore, Icon: Award },
        ].map(({ label, value, Icon }) => (
          <Card className="p-4" key={label}>
            <Icon aria-hidden="true" className="text-brand-700" size={20} />
            <dt className="mt-2 text-caption text-neutral-600">{label}</dt>
            <dd className="mt-1 text-2xl font-black">{value}</dd>
          </Card>
        ))}
      </dl>

      <section>
        <h2 className="text-heading font-bold">{copy.bestScores}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {bests.map(({ format, scores }) => (
            <Card key={format.id}>
              <h3 className="font-bold">{format.title}</h3>
              <dl className="mt-3 space-y-2">
                {scores.map(({ difficulty, score }) => (
                  <div className="flex justify-between gap-3" key={difficulty.id}>
                    <dt className="text-neutral-600">{difficulty.label}</dt>
                    <dd className="font-bold">{score.toLocaleString()}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-heading font-bold">{copy.recentGames}</h2>
        {recent.length ? (
          <ol className="mt-4 divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {recent.map(({ gameTitle, record }) => (
              <li key={record.runId}>
                <Link
                  className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-3 px-4 hover:bg-brand-50"
                  to={`/results/${record.runId}`}
                >
                  <span>
                    <strong className="block">{gameTitle}</strong>
                    <span className="text-caption text-neutral-600">
                      {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                        new Date(record.completedAt),
                      )}{' '}
                      ·{' '}
                      {config.difficulties.find(({ id }) => id === record.difficulty)?.label ??
                        record.difficulty}
                    </span>
                  </span>
                  <strong>{record.total.toLocaleString()}</strong>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <Card className="mt-4 text-neutral-600">{copy.noRecentGames}</Card>
        )}
      </section>

      <div>
        <CreditsSheet copy={config.copy} credits={credits} />
      </div>

      {presenter ? (
        <Card>
          <h2 className="text-heading font-bold">{copy.presenterTitle}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                await applyProfile('fresh')
                setStatus(copy.resetComplete)
              }}
              variant="danger"
            >
              {copy.resetProgress}
            </Button>
            <Button
              onClick={async () => {
                await applyProfile('advanced')
                setStatus(copy.seedComplete)
              }}
              variant="secondary"
            >
              {copy.seedReturning}
            </Button>
          </div>
          {status ? (
            <p aria-live="polite" className="mt-3 text-small text-neutral-700">
              {status}
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}
