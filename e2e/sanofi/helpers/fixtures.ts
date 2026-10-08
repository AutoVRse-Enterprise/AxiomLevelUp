import type { Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(resolve('e2e/sanofi/fixtures', name), 'utf8'))
}

const contentBase = '/experiences/sanofi/content/'

const fixtureDocuments = new Map<string, unknown>([
  [`${contentBase}rounds/fixture-warmup-call.json`, fixture('fixture-warmup-call.json')],
  [`${contentBase}games/fixture-one-round.json`, fixture('fixture-one-round.json')],
  [`${contentBase}games/fixture-two-round.json`, fixture('fixture-two-round.json')],
  [`${contentBase}games/fixture-spatial.json`, fixture('fixture-spatial.json')],
])

export async function installSanofiFixtures(page: Page) {
  for (const [path, document] of fixtureDocuments) {
    await page.route(`**${path}`, (route) => route.fulfill({ json: document }))
  }

  await page.route(`**${contentBase}manifest.json`, async (route) => {
    const response = await route.fetch()
    const manifest = (await response.json()) as {
      rounds: string[]
      games: string[]
    }
    await route.fulfill({
      response,
      json: {
        ...manifest,
        rounds: [...manifest.rounds, 'rounds/fixture-warmup-call.json'],
        games: [
          ...manifest.games,
          'games/fixture-one-round.json',
          'games/fixture-two-round.json',
          'games/fixture-spatial.json',
        ],
      },
    })
  })
}
