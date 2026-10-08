import type { ContentRegistry } from '@/content/loader'
import type { GameDifficulty, GameDocument } from '@/content/schema/game'

export const CHALLENGE_LINK_VERSION = 1 as const
export const MAX_CHALLENGE_TOKEN_LENGTH = 2048

export interface ChallengePayload {
  v: typeof CHALLENGE_LINK_VERSION
  g: string
  gv: string
  d: string
  s: number
  f: string
  sc: number
}

export type ChallengeDecodeFailureReason = 'malformed' | 'checksum' | 'version' | 'invalid'

export type ChallengeDecodeResult =
  { ok: true; payload: ChallengePayload } | { ok: false; reason: ChallengeDecodeFailureReason }

export type ChallengeResolution =
  | {
      status: 'ok'
      payload: ChallengePayload
      game: GameDocument
      difficulty: GameDifficulty | null
    }
  | { status: 'unknown_game'; payload: ChallengePayload }
  | { status: 'outdated'; payload: ChallengePayload; game: GameDocument }
  | { status: 'unknown_difficulty'; payload: ChallengePayload; game: GameDocument }

const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function fallbackBase64Encode(bytes: Uint8Array): string {
  let encoded = ''

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]!
    const second = bytes[index + 1]
    const third = bytes[index + 2]
    const value = (first << 16) | ((second ?? 0) << 8) | (third ?? 0)

    encoded += base64Alphabet[(value >>> 18) & 63]
    encoded += base64Alphabet[(value >>> 12) & 63]
    encoded += second === undefined ? '=' : base64Alphabet[(value >>> 6) & 63]
    encoded += third === undefined ? '=' : base64Alphabet[value & 63]
  }

  return encoded
}

function fallbackBase64Decode(encoded: string): Uint8Array {
  const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0
  const bytes = new Uint8Array((encoded.length / 4) * 3 - padding)
  let offset = 0

  for (let index = 0; index < encoded.length; index += 4) {
    const first = base64Alphabet.indexOf(encoded[index]!)
    const second = base64Alphabet.indexOf(encoded[index + 1]!)
    const third = encoded[index + 2] === '=' ? 0 : base64Alphabet.indexOf(encoded[index + 2]!)
    const fourth = encoded[index + 3] === '=' ? 0 : base64Alphabet.indexOf(encoded[index + 3]!)
    if (first < 0 || second < 0 || third < 0 || fourth < 0) throw new Error('Invalid base64')

    const value = (first << 18) | (second << 12) | (third << 6) | fourth
    if (offset < bytes.length) bytes[offset++] = (value >>> 16) & 255
    if (offset < bytes.length) bytes[offset++] = (value >>> 8) & 255
    if (offset < bytes.length) bytes[offset++] = value & 255
  }

  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof globalThis.btoa !== 'function') return fallbackBase64Encode(bytes)

  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return globalThis.btoa(binary)
}

function base64ToBytes(encoded: string): Uint8Array {
  const binary =
    typeof globalThis.atob === 'function' ? globalThis.atob(encoded) : fallbackBase64Decode(encoded)
  if (binary instanceof Uint8Array) return binary

  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

function base64UrlToBytes(encoded: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/u.test(encoded) || encoded.length % 4 === 1) {
    throw new Error('Invalid base64url')
  }

  const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const bytes = base64ToBytes(padded)
  if (bytesToBase64Url(bytes) !== encoded) throw new Error('Non-canonical base64url')
  return bytes
}

function checksum(bytes: Uint8Array): string {
  let hash = 0x811c9dc5
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0
  return hash.toString(16).padStart(8, '0')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactPayloadKeys(value: Record<string, unknown>): boolean {
  const expected = ['d', 'f', 'g', 'gv', 's', 'sc', 'v']
  return (
    Object.keys(value)
      .sort()
      .every((key, index) => key === expected[index]) &&
    Object.keys(value).length === expected.length
  )
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function payloadIsValid(value: unknown): value is ChallengePayload {
  if (!isRecord(value)) return false

  return (
    hasExactPayloadKeys(value) &&
    value.v === CHALLENGE_LINK_VERSION &&
    isNonEmptyString(value.g) &&
    isNonEmptyString(value.gv) &&
    isNonEmptyString(value.d) &&
    isNonNegativeSafeInteger(value.s) &&
    isNonEmptyString(value.f) &&
    value.f.length <= 40 &&
    isNonNegativeSafeInteger(value.sc)
  )
}

export function encodeChallenge(payload: ChallengePayload): string {
  if (!payloadIsValid(payload)) throw new TypeError('Invalid challenge payload')

  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  const token = `${bytesToBase64Url(bytes)}.${checksum(bytes)}`
  if (token.length > MAX_CHALLENGE_TOKEN_LENGTH) {
    throw new RangeError('Challenge token exceeds the maximum length')
  }
  return token
}

export const encodeChallengeToken = encodeChallenge

export function decodeChallenge(token: string): ChallengeDecodeResult {
  if (
    token.length === 0 ||
    token.length > MAX_CHALLENGE_TOKEN_LENGTH ||
    !/^[A-Za-z0-9_-]+\.[0-9a-fA-F]{8}$/u.test(token)
  ) {
    return { ok: false, reason: 'malformed' }
  }

  const [encoded, suppliedChecksum] = token.split('.')
  let bytes: Uint8Array
  try {
    bytes = base64UrlToBytes(encoded!)
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (checksum(bytes) !== suppliedChecksum!.toLowerCase()) {
    return { ok: false, reason: 'checksum' }
  }

  let value: unknown
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (!isRecord(value)) return { ok: false, reason: 'invalid' }
  if (typeof value.v === 'number' && value.v !== CHALLENGE_LINK_VERSION) {
    return { ok: false, reason: 'version' }
  }
  if (!payloadIsValid(value)) return { ok: false, reason: 'invalid' }
  return { ok: true, payload: value }
}

export const decodeChallengeToken = decodeChallenge

export function resolveChallenge(
  payload: ChallengePayload,
  registry: ContentRegistry,
): ChallengeResolution {
  const game = registry.gameById.get(payload.g)
  if (!game) return { status: 'unknown_game', payload }
  if (game.gameVersion !== payload.gv) return { status: 'outdated', payload, game }
  if (!game.difficulties.includes(payload.d)) {
    return { status: 'unknown_difficulty', payload, game }
  }

  const difficulty =
    registry.appConfig.games?.difficulties.find(({ id }) => id === payload.d) ?? null
  return { status: 'ok', payload, game, difficulty }
}
