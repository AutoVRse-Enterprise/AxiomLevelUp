import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/ui'
import { createRunSeed } from '@/engines/games/seed'
import type { GameSession } from '@/engines/games/session'
import { useGameSessionStore } from '@/engines/games/sessionStore'
import { emitEvent } from '@/events/bus'
import { GamePlayer } from '@/player/game/GamePlayer'

function parseSeed(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) return createRunSeed()
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 0xffffffff
    ? parsed >>> 0
    : createRunSeed()
}

export function PlayGamePage() {
  const registry = useContent()
  const { gameId = '' } = useParams()
  const [search] = useSearchParams()
  const [hydrated, setHydrated] = useState(false)
  const [resumable, setResumable] = useState<GameSession | null>(null)
  const game = registry.gameById.get(gameId)
  const copy = registry.appConfig.games?.copy

  useEffect(() => {
    if (game) emitEvent({ event: 'game_opened', gameId: game.id, source: 'hub' })
  }, [game])

  useEffect(() => {
    void Promise.resolve(useGameSessionStore.persist.rehydrate()).then(() => {
      if (game) {
        setResumable(useGameSessionStore.getState().loadForGame(game.id, game.gameVersion))
      }
      setHydrated(true)
    })
  }, [game])

  if (!game || !copy) {
    return (
      <ErrorState
        message={copy?.gameNotFound ?? 'Game not found'}
        title={copy?.gameUnavailableTitle ?? 'Game unavailable'}
      />
    )
  }
  if (!hydrated) return <LoadingState message={copy.loadingRound} title={copy.loadingRound} />
  const requestedDifficulty = search.get('difficulty')
  const difficultyId =
    requestedDifficulty && game.difficulties.includes(requestedDifficulty)
      ? requestedDifficulty
      : game.defaultDifficulty
  return (
    <GamePlayer
      difficultyId={difficultyId}
      game={game}
      resumable={resumable}
      seed={parseSeed(search.get('seed'))}
    />
  )
}
