import { Swords } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { Button, Card, Chip } from '@/components/ui'
import { decodeChallenge, resolveChallenge } from '@/engines/games/links'
import { emitEvent } from '@/events/bus'

export function ChallengeLandingPage() {
  const { token = '' } = useParams()
  const registry = useContent()
  const navigate = useNavigate()
  const emitted = useRef(false)
  const config = registry.appConfig.games
  const decoded = decodeChallenge(token)
  const resolution = decoded.ok ? resolveChallenge(decoded.payload, registry) : null
  const valid = resolution?.status === 'ok' ? resolution : null
  const copy = config?.challengeLanding

  useEffect(() => {
    if (!valid || emitted.current) return
    emitted.current = true
    emitEvent({
      event: 'game_challenge_opened',
      token,
      gameId: valid.game.id,
      fromName: valid.payload.f,
      targetScore: valid.payload.sc,
    })
  }, [token, valid])

  if (!config || !copy) return null
  const primary = config.formats.find(({ id }) => id === config.hub.primaryFormatId)

  if (!valid) {
    return (
      <Card className="mx-auto max-w-xl p-7 text-center sm:p-10">
        <h1 className="text-heading font-bold">{copy.fallbackTitle}</h1>
        <p className="mt-3 text-neutral-600">{copy.fallbackMessage}</p>
        <Button
          className="mt-6"
          disabled={!primary?.gameId}
          onClick={() => primary?.gameId && navigate(`/play/${primary.gameId}`)}
        >
          {copy.start}
        </Button>
      </Card>
    )
  }

  const difficulty =
    valid.difficulty?.label ??
    config.difficulties.find(({ id }) => id === valid.payload.d)?.label ??
    valid.payload.d
  const summary = copy.summaryTemplate
    .replace('{from}', valid.payload.f)
    .replace('{score}', valid.payload.sc.toLocaleString())
    .replace('{gameTitle}', valid.game.title)
    .replace('{difficulty}', difficulty)

  return (
    <Card className="mx-auto max-w-xl overflow-hidden bg-gradient-to-br from-brand-950 to-brand-700 p-7 text-center text-white sm:p-10">
      <Swords aria-hidden="true" className="mx-auto" size={36} />
      <Chip className="mt-4 bg-white/15 text-white">{copy.title}</Chip>
      <h1 className="mt-5 text-heading font-bold">{valid.game.title}</h1>
      <p className="mt-4 text-lg text-brand-100">{summary}</p>
      <Button
        className="mt-7"
        onClick={() => navigate(`/play/${valid.game.id}?challenge=${encodeURIComponent(token)}`)}
        size="lg"
      >
        {copy.accept}
      </Button>
    </Card>
  )
}
