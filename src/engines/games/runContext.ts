import type { ContentRegistry } from '@/content/loader'
import type { GameDocument } from '@/content/schema/game'
import {
  CHALLENGE_LINK_VERSION,
  decodeChallenge,
  encodeChallenge,
  resolveChallenge,
} from '@/engines/games/links'
import { createRunSeed, dailySeed } from '@/engines/games/seed'
import type { GameRunMode } from '@/events/types'

export interface GameOpponent {
  name: string
  score: number
}

export interface GameRunContext {
  mode: GameRunMode
  source: 'hub' | 'link' | 'expert' | 'daily'
  difficultyId: string
  seed: number
  challengeToken?: string
  opponent?: GameOpponent
}

function parseSeed(value: string | null): number {
  if (value === null || !/^\d+$/u.test(value)) return createRunSeed()
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 0xffffffff
    ? parsed >>> 0
    : createRunSeed()
}

export function resolveRunContext({
  search,
  registry,
  game,
  localDate,
}: {
  search: URLSearchParams
  registry: ContentRegistry
  game: GameDocument
  localDate: string
}): GameRunContext {
  const challengeToken = search.get('challenge')
  if (challengeToken) {
    const decoded = decodeChallenge(challengeToken)
    if (decoded.ok) {
      const resolution = resolveChallenge(decoded.payload, registry)
      if (resolution.status === 'ok' && resolution.game.id === game.id) {
        return {
          mode: 'challenge',
          source: 'link',
          difficultyId: decoded.payload.d,
          seed: decoded.payload.s,
          challengeToken,
          opponent: { name: decoded.payload.f, score: decoded.payload.sc },
        }
      }
    }
  }

  const expertId = search.get('expert')
  const expert = registry.appConfig.games?.expertRuns.find(({ id }) => id === expertId)
  if (expert && expert.gameId === game.id) {
    const token = encodeChallenge({
      v: CHALLENGE_LINK_VERSION,
      g: game.id,
      gv: game.gameVersion,
      d: expert.difficulty,
      s: expert.seed,
      f: expert.persona.name,
      sc: expert.targetScore,
    })
    return {
      mode: 'expert',
      source: 'expert',
      difficultyId: expert.difficulty,
      seed: expert.seed,
      challengeToken: token,
      opponent: { name: expert.persona.name, score: expert.targetScore },
    }
  }

  const daily = registry.appConfig.games?.daily
  if (search.get('daily') === '1' && daily?.gameId === game.id) {
    return {
      mode: 'daily',
      source: 'daily',
      difficultyId: daily.difficulty,
      seed: dailySeed(game.id, localDate),
    }
  }

  const requestedDifficulty = search.get('difficulty')
  return {
    mode: 'standard',
    source: 'hub',
    difficultyId:
      requestedDifficulty && game.difficulties.includes(requestedDifficulty)
        ? requestedDifficulty
        : game.defaultDifficulty,
    seed: parseSeed(search.get('seed')),
  }
}
