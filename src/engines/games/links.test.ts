import { describe, expect, it } from 'vitest'

import type { ContentRegistry } from '@/content/loader'
import { gameDocumentSchema } from '@/content/schema/game'

import {
  MAX_CHALLENGE_TOKEN_LENGTH,
  decodeChallenge,
  encodeChallenge,
  resolveChallenge,
  type ChallengePayload,
} from './links'

const payload: ChallengePayload = {
  v: 1,
  g: 'respiratory-challenge',
  gv: '2',
  d: 'challenge',
  s: 42,
  f: 'Dr Élodie 🫁',
  sc: 3420,
}

function fnv1a(bytes: Uint8Array): string {
  let hash = 0x811c9dc5
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0
  return hash.toString(16).padStart(8, '0')
}

function tokenForText(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  const encoded = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
  return `${encoded}.${fnv1a(bytes)}`
}

function tokenFor(value: unknown): string {
  return tokenForText(JSON.stringify(value))
}

const game = gameDocumentSchema.parse({
  schemaVersion: '0.1',
  gameVersion: '2',
  id: 'respiratory-challenge',
  title: 'Respiratory Challenge',
  tagline: 'Four rounds.',
  organSystem: 'respiratory',
  estimatedSeconds: 180,
  slots: [{ id: 'slot', pool: ['round'] }],
  difficulties: ['challenge'],
  defaultDifficulty: 'challenge',
})

const registry = {
  gameById: new Map([[game.id, game]]),
  appConfig: {
    games: {
      difficulties: [
        {
          id: 'challenge',
          label: 'Challenge',
          timeMultiplier: 1,
          maxMoves: 3,
          freeClues: 2,
          clueCostPoints: 100,
          speedBonus: true,
          optionSet: 'standard',
        },
      ],
    },
  },
} as unknown as ContentRegistry

describe('challenge links', () => {
  it('round-trips a UTF-8 payload as base64url without Node-only APIs', () => {
    const token = encodeChallenge(payload)

    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[0-9a-f]{8}$/u)
    expect(decodeChallenge(token)).toEqual({ ok: true, payload })
  })

  it('rejects malformed, oversized and checksum-mismatched tokens distinctly', () => {
    expect(decodeChallenge('not-a-token')).toEqual({ ok: false, reason: 'malformed' })
    expect(decodeChallenge(`a.${'0'.repeat(8)}`)).toEqual({
      ok: false,
      reason: 'malformed',
    })
    expect(decodeChallenge('x'.repeat(MAX_CHALLENGE_TOKEN_LENGTH + 1))).toEqual({
      ok: false,
      reason: 'malformed',
    })

    const token = encodeChallenge(payload)
    const corrupted = `${token.slice(0, -1)}${token.endsWith('0') ? '1' : '0'}`
    expect(decodeChallenge(corrupted)).toEqual({ ok: false, reason: 'checksum' })
  })

  it('distinguishes unsupported versions, invalid payloads and malformed JSON', () => {
    expect(decodeChallenge(tokenFor({ ...payload, v: 2 }))).toEqual({
      ok: false,
      reason: 'version',
    })
    expect(decodeChallenge(tokenFor({ ...payload, unexpected: true }))).toEqual({
      ok: false,
      reason: 'invalid',
    })
    expect(decodeChallenge(tokenForText('{'))).toEqual({
      ok: false,
      reason: 'malformed',
    })
  })

  it('resolves games, versions and playable difficulties against content', () => {
    expect(resolveChallenge(payload, registry)).toMatchObject({
      status: 'ok',
      game: { id: 'respiratory-challenge' },
      difficulty: { id: 'challenge' },
    })
    expect(resolveChallenge({ ...payload, g: 'missing' }, registry)).toEqual({
      status: 'unknown_game',
      payload: { ...payload, g: 'missing' },
    })
    expect(resolveChallenge({ ...payload, gv: '1' }, registry)).toMatchObject({
      status: 'outdated',
    })
    expect(resolveChallenge({ ...payload, d: 'expert' }, registry)).toMatchObject({
      status: 'unknown_difficulty',
    })
  })
})
