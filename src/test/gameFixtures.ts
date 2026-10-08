import sanofiConfig from '../../public/experiences/sanofi/content/app-config.json'
import clinicalRound from '../../public/experiences/sanofi/content/rounds/clinical-call-t2.json'
import fixtureGame from '../../e2e/sanofi/fixtures/fixture-two-round.json'
import warmupRound from '../../e2e/sanofi/fixtures/fixture-warmup-call.json'

import { appConfigSchema, gameDocumentSchema, roundDocumentSchema } from '@/content/schema'
import type { ContentBundleInput } from '@/content/loader'
import { makeValidContentBundle } from '@/test/contentFixtures'

export const fixtureRounds = [
  roundDocumentSchema.parse(warmupRound),
  roundDocumentSchema.parse(clinicalRound),
]
export const twoRoundFixtureGame = gameDocumentSchema.parse(fixtureGame)

export function makeGameContentBundle(): ContentBundleInput {
  const input = makeValidContentBundle()
  const manifest = structuredClone(input.manifest) as Record<string, unknown>
  manifest.rounds = ['rounds/warmup.json', 'rounds/clinical.json']
  manifest.games = ['games/fixture.json']
  const appConfig = structuredClone(input.appConfig) as Record<string, unknown>
  appConfig.games = appConfigSchema.parse(sanofiConfig).games
  if (appConfig.games && typeof appConfig.games === 'object') {
    const games = appConfig.games as {
      formats: unknown[]
      leaderboard: { entries: unknown[] }
      expertRuns: unknown[]
      daily?: unknown
      hub: { primaryFormatId?: string }
    }
    games.formats = []
    games.leaderboard.entries = []
    games.expertRuns = []
    delete games.daily
    delete games.hub.primaryFormatId
  }
  return {
    ...input,
    manifest,
    appConfig,
    roundFiles: fixtureRounds.map((round, index) => ({
      file: `rounds/${index}.json`,
      data: round,
    })),
    gameFiles: [{ file: 'games/fixture.json', data: twoRoundFixtureGame }],
  }
}
