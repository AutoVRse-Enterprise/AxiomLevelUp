import sanofiConfig from '../../public/experiences/sanofi/content/app-config.json'
import clinicalRound from '../../public/experiences/sanofi/content/rounds/clinical-call-t2.json'
import warmupRound from '../../public/experiences/sanofi/content/rounds/fixture-warmup-call.json'
import fixtureGame from '../../public/experiences/sanofi/content/games/fixture-two-round.json'

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
    ;(appConfig.games as { formats: unknown[] }).formats = []
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
