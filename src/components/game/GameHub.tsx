import {
  Activity,
  Brain,
  CalendarDays,
  Eye,
  Footprints,
  Play,
  RotateCcw,
  Stethoscope,
  Swords,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router'

import { useContent } from '@/app/contentContext'
import { Card, Chip } from '@/components/ui'
import { selectLeaderboard } from '@/engines/games/leaderboard'
import { planRun } from '@/engines/games/plan'
import { createRunSeed } from '@/engines/games/seed'
import { useGameSessionStore } from '@/engines/games/sessionStore'
import { subscribeToEvents } from '@/events/bus'
import { today } from '@/lib/clock'
import { versionedModelUrl } from '@/pwa/modelCache'
import { useLearnerStore } from '@/state/learnerStore'
import {
  selectDailyStatus,
  selectFormatCards,
  selectPendingIncomingChallenge,
  selectPlayerGameStats,
  selectRecentRuns,
} from '@/state/selectors/games'

const linkClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-700 px-4 font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-2'

function useHeroModelPrefetch(
  ref: RefObject<HTMLElement | null>,
  gameId: string | undefined,
  difficultyId: string,
  seed: number,
) {
  const registry = useContent()
  useEffect(() => {
    const element = ref.current
    const game = gameId ? registry.gameById.get(gameId) : undefined
    if (!element || !game) return
    let released = false
    let release: (() => void) | null = null
    let timeout = 0
    const releaseLease = () => {
      if (released) return
      released = true
      release?.()
    }
    const unsubscribe = subscribeToEvents((event) => {
      if (event.event === 'game_round_started') releaseLease()
    })
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        const run = planRun({ game, registry, difficultyId, seed })
        const first = run.rounds[0]
        const round = first ? registry.roundById.get(first.roundId) : undefined
        const map = round?.anatomyMapId
          ? registry.anatomyMapById.get(round.anatomyMapId)
          : undefined
        const asset = map ? registry.assetById.get(map.modelAssetId) : undefined
        if (asset?.type !== 'model') return
        void import('@/anatomy3d/three/createAnatomyController').then(
          async ({ prefetchAnatomyModel }) => {
            release = await prefetchAnatomyModel(versionedModelUrl(asset))
            if (released) release()
            else timeout = window.setTimeout(releaseLease, 20_000)
          },
        )
      },
      { rootMargin: '200px' },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
      unsubscribe()
      if (released) window.clearTimeout(timeout)
    }
  }, [difficultyId, gameId, ref, registry, seed])
}

function formatIcon(mechanics: readonly string[]) {
  if (mechanics.includes('spatial_explore')) return Footprints
  if (mechanics.includes('spot_finding')) return Eye
  if (mechanics.includes('clinical_call')) return Stethoscope
  return Brain
}

export function GameHub() {
  const registry = useContent()
  const config = registry.appConfig.games!
  const games = useLearnerStore((state) => state.games)
  const gameDaily = useLearnerStore((state) => state.gameDaily)
  const gameChallenges = useLearnerStore((state) => state.gameChallenges)
  const playerName = useLearnerStore((state) => state.player.displayName)
  const [seed] = useState(createRunSeed)
  const primaryFormat = config.formats.find(({ id }) => id === config.hub.primaryFormatId)
  const primaryGame = primaryFormat?.gameId
    ? registry.gameById.get(primaryFormat.gameId)
    : undefined
  const [difficulty, setDifficulty] = useState(
    primaryGame?.defaultDifficulty ?? config.difficulties[0]?.id ?? '',
  )
  const heroRef = useRef<HTMLElement>(null)
  useHeroModelPrefetch(heroRef, primaryGame?.id, difficulty, seed)
  const [sessionReady, setSessionReady] = useState(false)
  const session = useGameSessionStore((state) => state.session)

  useEffect(() => {
    void Promise.resolve(useGameSessionStore.persist.rehydrate()).then(() => setSessionReady(true))
  }, [])

  const cards = useMemo(() => selectFormatCards(registry), [registry])
  const stats = selectPlayerGameStats({ games, gameDaily })
  const recent = selectRecentRuns(games, registry, 3)
  const incoming = selectPendingIncomingChallenge({ gameChallenges })
  const daily = config.daily
  const dailyGame = daily ? registry.gameById.get(daily.gameId) : undefined
  const dailyStatus = daily ? selectDailyStatus(games[daily.gameId], today()) : null
  const preview = primaryGame
    ? selectLeaderboard({
        entries: config.leaderboard.entries,
        playerHistory: Object.entries(games).flatMap(([gameId, progress]) =>
          progress.history.map((record) => ({
            gameId,
            difficulty: record.difficulty,
            score: record.total,
            completedAt: record.completedAt,
          })),
        ),
        gameId: primaryGame.id,
        difficulty,
        period: 'all_time',
        visibleWindow: 3,
        playerName,
      })
    : null

  return (
    <div className="space-y-8">
      <section
        className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-6 text-white shadow-card sm:p-10"
        ref={heroRef}
      >
        <Chip className="border-white/20 bg-white/10 text-white">Quick play</Chip>
        <h1 className="mt-4 max-w-2xl text-display font-bold text-balance">{config.hub.title}</h1>
        <p className="mt-3 max-w-xl text-lg text-brand-100">{config.hub.tagline}</p>
        <fieldset className="mt-5">
          <legend className="text-small font-semibold text-brand-100">
            {config.hub.difficultyLabel}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {config.difficulties.map((option) => (
              <label
                className={`cursor-pointer rounded-full px-4 py-2 text-small font-semibold ${
                  difficulty === option.id ? 'bg-white text-brand-900' : 'bg-white/10 text-white'
                }`}
                key={option.id}
              >
                <input
                  checked={difficulty === option.id}
                  className="sr-only"
                  name="difficulty"
                  onChange={() => setDifficulty(option.id)}
                  type="radio"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        {primaryGame ? (
          <Link
            className={`${linkClass} mt-6 bg-white text-brand-900 hover:bg-brand-50`}
            to={`/play/${primaryGame.id}?difficulty=${difficulty}&seed=${seed}`}
          >
            <Play aria-hidden="true" size={19} />
            {config.hub.startLabel}
          </Link>
        ) : null}
      </section>

      {sessionReady && session && session.phase !== 'complete' ? (
        <Card className="flex flex-wrap items-center gap-4">
          <RotateCcw aria-hidden="true" className="text-brand-700" />
          <div className="min-w-0 flex-1">
            <h2 className="font-bold">{config.hub.continueTitle}</h2>
            <p className="text-small text-neutral-600">
              {registry.gameById.get(session.gameId)?.title ?? session.gameId}
            </p>
          </div>
          <Link className={linkClass} to={`/play/${session.gameId}`}>
            {config.hub.resumeLabel}
          </Link>
        </Card>
      ) : null}

      {incoming ? (
        <Card className="flex flex-wrap items-center gap-4 border-brand-200 bg-brand-50">
          <Swords aria-hidden="true" className="text-brand-700" />
          <div className="min-w-0 flex-1">
            <h2 className="font-bold">{config.hub.incomingTitle}</h2>
            <p className="text-small text-neutral-700">
              {config.hub.incomingTemplate
                .replace('{from}', incoming.from)
                .replace('{score}', incoming.score.toLocaleString())}
            </p>
          </div>
          <Link className={linkClass} to={`/c/${incoming.token}`}>
            {config.challengeLanding?.accept ?? config.hub.playLabel}
          </Link>
        </Card>
      ) : null}

      {daily && dailyGame ? (
        <Card className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <CalendarDays aria-hidden="true" className="text-brand-700" size={28} />
          <div>
            <h2 className="text-heading font-bold">{config.hub.dailyTitle}</h2>
            <p className="text-neutral-600">
              {dailyStatus?.completed
                ? config.hub.dailyComplete.replace(
                    '{score}',
                    (dailyStatus.score ?? 0).toLocaleString(),
                  )
                : config.hub.dailyDescription}
            </p>
            <p className="mt-1 text-caption font-semibold text-brand-700">
              {config.hub.dailyStreakLabel}: {stats.dailyStreak}
            </p>
          </div>
          <Link className={linkClass} to={`/play/${daily.gameId}?daily=1`}>
            {config.hub.playLabel}
          </Link>
        </Card>
      ) : null}

      <section>
        <h2 className="text-heading font-bold">{config.hub.formatsTitle}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {cards.map((format) => {
            const Icon = formatIcon(format.mechanics)
            return (
              <Card className="flex flex-col" key={format.id}>
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-brand-100 p-2 text-brand-800">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <div>
                    <h3 className="font-bold">{format.title}</h3>
                    <p className="mt-1 text-small text-neutral-600">{format.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-caption text-neutral-600">
                  {format.game ? (
                    <>
                      <Chip>
                        {config.hub.roundsTemplate.replace('{count}', String(format.roundCount))}
                      </Chip>
                      <Chip>
                        {config.hub.minutesTemplate.replace('{minutes}', String(format.minutes))}
                      </Chip>
                    </>
                  ) : null}
                  <Chip tone={format.status === 'playable' ? 'brand' : 'neutral'}>
                    {format.statusLabel ??
                      (format.status === 'playable'
                        ? config.hub.playLabel
                        : config.hub.previewLabel)}
                  </Chip>
                </div>
                {format.game ? (
                  <Link
                    className={`${linkClass} mt-5 self-start`}
                    to={`/play/${format.game.id}?difficulty=${format.game.defaultDifficulty}`}
                  >
                    {config.hub.playLabel}
                  </Link>
                ) : null}
              </Card>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-heading font-bold">{config.hub.statsTitle}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [config.hub.bestScoreLabel, stats.bestScore],
            [config.hub.lastScoreLabel, stats.lastScore],
            [config.hub.gamesPlayedLabel, stats.gamesPlayed],
            [config.hub.dailyStreakLabel, stats.dailyStreak],
          ].map(([label, value]) => (
            <Card className="p-4" key={String(label)}>
              <dt className="text-caption text-neutral-600">{label}</dt>
              <dd className="mt-1 text-2xl font-black tabular-nums">{value}</dd>
            </Card>
          ))}
        </dl>
      </section>

      {preview ? (
        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-heading font-bold">{config.hub.leaderboardTitle}</h2>
            <Link className="font-semibold text-brand-700" to="/leaderboard">
              {config.hub.viewLeaderboard}
            </Link>
          </div>
          <Card className="mt-4">
            <ol className="space-y-3">
              {preview.rows.map((row) => (
                <li className="flex items-center gap-3" key={row.id}>
                  <span className="w-8 font-bold">#{row.rank}</span>
                  <span className="min-w-0 flex-1 truncate">{row.name}</span>
                  <strong>{row.score.toLocaleString()}</strong>
                </li>
              ))}
            </ol>
            {preview.pinnedPlayer ? (
              <p className="mt-4 border-t border-neutral-200 pt-3 font-semibold">
                #{preview.pinnedPlayer.rank} {preview.pinnedPlayer.name} ·{' '}
                {preview.pinnedPlayer.score.toLocaleString()}
              </p>
            ) : null}
          </Card>
        </section>
      ) : null}

      <section>
        <h2 className="text-heading font-bold">{config.hub.expertsTitle}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {config.expertRuns.map((expert) => (
            <Card className="flex flex-col" key={expert.id}>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">
                  {expert.persona.initials}
                </span>
                <div>
                  <h3 className="font-bold">{expert.title}</h3>
                  <p className="text-caption text-neutral-600">{expert.persona.role}</p>
                </div>
              </div>
              <p className="mt-4 font-semibold">
                {config.hub.scoreToBeat.replace('{score}', expert.targetScore.toLocaleString())}
              </p>
              <Link
                className={`${linkClass} mt-5 self-start`}
                to={`/play/${expert.gameId}?expert=${expert.id}`}
              >
                {config.hub.playLabel}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-heading font-bold">{config.hub.recentTitle}</h2>
        {recent.length ? (
          <div className="mt-4 grid gap-3">
            {recent.map(({ gameTitle, record }) => (
              <Link
                className="flex min-h-14 items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-card hover:border-brand-300"
                key={record.runId}
                to={`/results/${record.runId}`}
              >
                <Activity aria-hidden="true" className="text-brand-700" />
                <span className="min-w-0 flex-1 truncate font-semibold">{gameTitle}</span>
                <strong>{record.total.toLocaleString()}</strong>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="mt-4 text-neutral-600">{config.hub.noRecent}</Card>
        )}
      </section>
    </div>
  )
}
