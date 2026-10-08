import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/ui'
import { resolveRunContext } from '@/engines/games/runContext'
import type { GameSession } from '@/engines/games/session'
import { useGameSessionStore } from '@/engines/games/sessionStore'
import { emitEvent } from '@/events/bus'
import { today } from '@/lib/clock'
import { GamePlayer } from '@/player/game/GamePlayer'

export function PlayGamePage() {
  const registry = useContent()
  const { gameId = '' } = useParams()
  const [search] = useSearchParams()
  const [hydrated, setHydrated] = useState(false)
  const [resumable, setResumable] = useState<GameSession | null>(null)
  const game = registry.gameById.get(gameId)
  const copy = registry.appConfig.games?.copy
  const runContext = useMemo(
    () => (game ? resolveRunContext({ search, registry, game, localDate: today() }) : null),
    [game, registry, search],
  )

  useEffect(() => {
    if (game && runContext) {
      emitEvent({ event: 'game_opened', gameId: game.id, source: runContext.source })
    }
  }, [game, runContext])

  useEffect(() => {
    void Promise.resolve(useGameSessionStore.persist.rehydrate()).then(() => {
      if (game) {
        const candidate = useGameSessionStore.getState().loadForGame(game.id, game.gameVersion)
        setResumable(
          candidate &&
            runContext &&
            candidate.mode === runContext.mode &&
            candidate.challengeToken === runContext.challengeToken
            ? candidate
            : null,
        )
      }
      setHydrated(true)
    })
  }, [game, runContext])

  if (!game || !copy || !runContext) {
    return (
      <ErrorState
        message={copy?.gameNotFound ?? 'Game not found'}
        title={copy?.gameUnavailableTitle ?? 'Game unavailable'}
      />
    )
  }
  if (!hydrated) return <LoadingState message={copy.loadingRound} title={copy.loadingRound} />
  return (
    <GamePlayer
      difficultyId={runContext.difficultyId}
      game={game}
      runContext={runContext}
      resumable={resumable}
      seed={runContext.seed}
    />
  )
}
