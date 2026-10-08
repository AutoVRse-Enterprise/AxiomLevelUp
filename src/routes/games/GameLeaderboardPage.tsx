import { Trophy } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'

import { useContent } from '@/app/contentContext'
import { DisplayNamePrompt } from '@/components/game/DisplayNamePrompt'
import { Button, Card, Chip } from '@/components/ui'
import { selectLeaderboard, type GameLeaderboardPeriod } from '@/engines/games/leaderboard'
import { useLearnerStore } from '@/state/learnerStore'

export function GameLeaderboardPage() {
  const registry = useContent()
  const config = registry.appConfig.games
  const games = useLearnerStore((state) => state.games)
  const player = useLearnerStore((state) => state.player)
  const setPlayerDisplayName = useLearnerStore((state) => state.setPlayerDisplayName)
  const skipName = useLearnerStore((state) => state.skipShareNamePrompt)
  const [nameOpen, setNameOpen] = useState(false)
  const playable = config?.formats.filter(({ status, gameId }) => status === 'playable' && gameId)
  const [gameId, setGameId] = useState(playable?.[0]?.gameId ?? '')
  const [difficulty, setDifficulty] = useState(config?.difficulties[1]?.id ?? '')
  const [period, setPeriod] = useState<GameLeaderboardPeriod>('today')
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  if (!config?.leaderboard.copy || !config.share) return null
  const copy = config.leaderboard.copy
  const periods: Array<{ id: GameLeaderboardPeriod; label: string }> = [
    { id: 'today', label: copy.today },
    { id: 'week', label: copy.week },
    { id: 'all_time', label: copy.allTime },
  ]
  const history = Object.entries(games).flatMap(([id, progress]) =>
    progress.history.map((record) => ({
      gameId: id,
      difficulty: record.difficulty,
      score: record.total,
      completedAt: record.completedAt,
    })),
  )
  const view = selectLeaderboard({
    entries: config.leaderboard.entries,
    playerHistory: history,
    gameId,
    difficulty,
    period,
    visibleWindow: registry.appConfig.product.leaderboard.visibleWindow,
    playerName: player.displayName,
  })
  const moveTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    const explicit = event.key === 'Home' ? 0 : event.key === 'End' ? periods.length - 1 : null
    if (!delta && explicit === null) return
    event.preventDefault()
    const next = explicit ?? (index + delta + periods.length) % periods.length
    setPeriod(periods[next]!.id)
    tabs.current[next]?.focus()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="text-center">
        <Trophy aria-hidden="true" className="mx-auto text-brand-700" size={34} />
        <h1 className="mt-3 text-display font-bold">{copy.title}</h1>
        <Chip className="mt-3">{config.leaderboard.disclosure}</Chip>
      </header>

      <Card className="grid gap-3 sm:grid-cols-2">
        <label className="text-small font-semibold">
          {copy.game}
          <select
            className="mt-1 min-h-11 w-full rounded-md border border-neutral-300 bg-white px-3 font-normal"
            onChange={(event) => setGameId(event.target.value)}
            value={gameId}
          >
            {playable?.map((format) => (
              <option key={format.id} value={format.gameId}>
                {format.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-small font-semibold">
          {copy.difficulty}
          <select
            className="mt-1 min-h-11 w-full rounded-md border border-neutral-300 bg-white px-3 font-normal"
            onChange={(event) => setDifficulty(event.target.value)}
            value={difficulty}
          >
            {config.difficulties.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <div aria-label="Leaderboard period" className="flex justify-center gap-2" role="tablist">
        {periods.map((option, index) => (
          <button
            aria-selected={period === option.id}
            className={
              period === option.id
                ? 'min-h-10 rounded-full bg-brand-700 px-4 text-small font-semibold text-white'
                : 'min-h-10 rounded-full border border-neutral-200 bg-white px-4 text-small font-semibold'
            }
            key={option.id}
            onClick={() => setPeriod(option.id)}
            onKeyDown={(event) => moveTab(event, index)}
            ref={(element) => {
              tabs.current[index] = element
            }}
            role="tab"
            tabIndex={period === option.id ? 0 : -1}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold">
            {copy.yourPosition}: {view.playerRank ? `#${view.playerRank}` : copy.unranked}
          </p>
          {!player.displayName ? (
            <Button onClick={() => setNameOpen(true)} size="sm" variant="secondary">
              {copy.addName}
            </Button>
          ) : null}
        </div>
        {view.rows.length ? (
          <ol className="divide-y divide-neutral-100">
            {view.rows.map((row) => (
              <li
                className={`flex min-h-14 items-center gap-3 px-2 ${
                  row.isPlayer ? 'rounded-md bg-brand-50 font-bold text-brand-900' : ''
                }`}
                key={row.id}
              >
                <span className="w-9">#{row.rank}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{row.name}</span>
                  <span className="block truncate text-caption font-normal text-neutral-500">
                    {[row.specialty, row.country].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <strong>{row.score.toLocaleString()}</strong>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-neutral-600">{copy.empty}</p>
        )}
        {view.pinnedPlayer ? (
          <div className="mt-4 flex items-center gap-3 rounded-md border border-brand-200 bg-brand-50 p-3 font-bold">
            <span>#{view.pinnedPlayer.rank}</span>
            <span className="flex-1">{view.pinnedPlayer.name}</span>
            <span>{view.pinnedPlayer.score.toLocaleString()}</span>
          </div>
        ) : null}
      </Card>

      <DisplayNamePrompt
        copy={config.share}
        onOpenChange={setNameOpen}
        onSave={(name) => {
          setPlayerDisplayName(name)
          setNameOpen(false)
        }}
        onSkip={() => {
          skipName()
          setNameOpen(false)
        }}
        open={nameOpen}
      />
    </div>
  )
}
