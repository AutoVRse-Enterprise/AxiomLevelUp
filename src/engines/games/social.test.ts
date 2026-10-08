import { describe, expect, it } from 'vitest'

import { compareWithOpponent } from '@/engines/games/comparison'
import { CHALLENGE_LINK_VERSION, decodeChallenge, encodeChallenge } from '@/engines/games/links'
import { buildChallengeUrl, formatShareMessage, shareChannelUrls } from '@/engines/games/share'

const payload = {
  v: CHALLENGE_LINK_VERSION,
  g: 'respiratory-challenge',
  gv: '1',
  d: 'challenge',
  s: 42,
  f: 'Asha',
  sc: 3420,
} as const

describe('game social helpers', () => {
  it('builds a replayable challenge URL and share copy', () => {
    const url = buildChallengeUrl('https://example.test', payload)
    const token = url.split('/c/')[1]!
    expect(decodeChallenge(token)).toEqual({ ok: true, payload })
    expect(
      formatShareMessage('I scored {score} on the {gameTitle}.', {
        score: 3420,
        gameTitle: 'Respiratory Challenge',
      }),
    ).toBe('I scored 3,420 on the Respiratory Challenge.')
    expect(shareChannelUrls('Message', url).email).toContain('mailto:')
  })

  it('rejects challenge display names longer than the link contract', () => {
    expect(() => encodeChallenge({ ...payload, f: 'x'.repeat(41) })).toThrow('Invalid')
  })

  it('compares wins, losses and ties', () => {
    expect(compareWithOpponent(3600, { name: 'Asha', score: 3420 })).toMatchObject({
      outcome: 'win',
      margin: 180,
    })
    expect(compareWithOpponent(3000, { name: 'Asha', score: 3420 })).toMatchObject({
      outcome: 'loss',
      margin: 420,
    })
    expect(compareWithOpponent(3420, { name: 'Asha', score: 3420 }).outcome).toBe('tie')
  })
})
