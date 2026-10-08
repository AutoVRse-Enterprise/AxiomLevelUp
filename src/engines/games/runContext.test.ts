import { describe, expect, it } from 'vitest'

import type { ContentRegistry } from '@/content/loader'
import type { GameDocument } from '@/content/schema/game'
import { CHALLENGE_LINK_VERSION, encodeChallenge } from '@/engines/games/links'
import { resolveRunContext } from '@/engines/games/runContext'
import { dailySeed } from '@/engines/games/seed'

const game = {
  id: 'respiratory-challenge',
  gameVersion: '1',
  defaultDifficulty: 'challenge',
  difficulties: ['warmup', 'challenge', 'expert'],
} as GameDocument

const registry = {
  gameById: new Map([[game.id, game]]),
  appConfig: {
    games: {
      difficulties: [
        { id: 'warmup', label: 'Warm-up' },
        { id: 'challenge', label: 'Challenge' },
        { id: 'expert', label: 'Expert' },
      ],
      daily: { gameId: game.id, difficulty: 'challenge' },
      expertRuns: [
        {
          id: 'expert-one',
          gameId: game.id,
          difficulty: 'expert',
          seed: 91,
          targetScore: 3200,
          persona: { name: 'Dr Test', role: 'Specialist', initials: 'DT' },
          title: 'Expert run',
        },
      ],
    },
  },
} as unknown as ContentRegistry

describe('game run context', () => {
  it('resolves challenge, expert and daily runs deterministically', () => {
    const token = encodeChallenge({
      v: CHALLENGE_LINK_VERSION,
      g: game.id,
      gv: game.gameVersion,
      d: 'warmup',
      s: 42,
      f: 'Asha',
      sc: 2500,
    })
    expect(
      resolveRunContext({
        search: new URLSearchParams({ challenge: token }),
        registry,
        game,
        localDate: '2026-10-07',
      }),
    ).toMatchObject({
      mode: 'challenge',
      difficultyId: 'warmup',
      seed: 42,
      opponent: { name: 'Asha', score: 2500 },
    })
    expect(
      resolveRunContext({
        search: new URLSearchParams({ expert: 'expert-one' }),
        registry,
        game,
        localDate: '2026-10-07',
      }),
    ).toMatchObject({
      mode: 'expert',
      difficultyId: 'expert',
      seed: 91,
      opponent: { name: 'Dr Test', score: 3200 },
    })
    expect(
      resolveRunContext({
        search: new URLSearchParams({ daily: '1' }),
        registry,
        game,
        localDate: '2026-10-07',
      }),
    ).toMatchObject({
      mode: 'daily',
      difficultyId: 'challenge',
      seed: dailySeed(game.id, '2026-10-07'),
    })
  })

  it('falls back safely when a challenge token is invalid', () => {
    expect(
      resolveRunContext({
        search: new URLSearchParams({ challenge: 'invalid', difficulty: 'expert', seed: '7' }),
        registry,
        game,
        localDate: '2026-10-07',
      }),
    ).toMatchObject({ mode: 'standard', difficultyId: 'expert', seed: 7 })
  })
})
