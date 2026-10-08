import { expect, test, type Page } from '@playwright/test'

import { installSanofiFixtures } from './helpers/fixtures'
import { startRound } from './helpers/rounds'

test.use({ serviceWorkers: 'block' })

async function answerFixture(page: Page) {
  await startRound(page, 'Lock in')
  await page.getByRole('radio', { name: 'Obstructive pattern' }).click()
  await page.getByRole('button', { name: 'Lock in' }).click()
  await page.getByRole('button', { name: 'Next round' }).click()
  await startRound(page, 'Lock in')
  await page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }).click()
  await page.getByRole('button', { name: 'Lock in' }).click()
  await page.getByRole('button', { name: 'See your score' }).click()
  await expect(page).toHaveURL(/\/results\//)
}

async function storedRoundIds(page: Page, key: 'learner' | 'game-session') {
  return page.evaluate(async (storageKey) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('keyval-store')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const raw = await new Promise<string>((resolve, reject) => {
      const request = database
        .transaction('keyval')
        .objectStore('keyval')
        .get(`axiom-runtime:sanofi:${storageKey}`)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    const parsed = JSON.parse(raw)
    if (storageKey === 'game-session') {
      return parsed.state.session.plan.rounds.map((round: { roundId: string }) => round.roundId)
    }
    const histories = Object.values(parsed.state.games) as Array<{
      history: Array<{ roundResults: Array<{ roundId: string }> }>
    }>
    return (
      histories
        .at(-1)
        ?.history.at(-1)
        ?.roundResults.map((round) => round.roundId) ?? []
    )
  }, key)
}

test('shares a seeded run and replays identical rounds in a fresh context', async ({
  browser,
  page,
}) => {
  await installSanofiFixtures(page)
  await page.goto('/play/fixture-two-round?seed=42')
  await answerFixture(page)
  const sourceRounds = await storedRoundIds(page, 'learner')

  await page.getByRole('button', { name: 'Challenge a colleague' }).click()
  await page.getByRole('button', { name: 'Skip for now' }).click()
  const challengeUrl = await page.locator('p.break-all').textContent()
  expect(challengeUrl).toContain('/c/')

  const rivalContext = await browser.newContext()
  const rival = await rivalContext.newPage()
  await installSanofiFixtures(rival)
  await rival.goto(challengeUrl!)
  await expect(rival.getByRole('heading', { name: 'Two-round fixture' })).toBeVisible({
    timeout: 15_000,
  })
  await rival.getByRole('button', { name: 'Accept challenge' }).click()
  await expect(rival.getByRole('button', { name: 'Start round' })).toBeVisible()
  const rivalRounds = await storedRoundIds(rival, 'game-session')
  expect(rivalRounds).toEqual(sourceRounds)
  await answerFixture(rival)
  await expect(rival.getByText(/matched|beat|short of/i)).toBeVisible()
  await rivalContext.close()
})

test('filters the demo leaderboard and gates presenter controls', async ({ page }) => {
  await page.goto('/leaderboard')
  await expect(page.getByText('Demo leaderboard')).toBeVisible()
  await page.getByLabel('Game').selectOption('anatomy-hunt')
  await page.getByLabel('Difficulty').selectOption('expert')
  await page.getByRole('tab', { name: 'All time' }).click()
  await expect(page.locator('ol li')).toHaveCount(8)

  await page.goto('/you')
  await expect(page.getByRole('heading', { name: 'Presenter controls' })).toHaveCount(0)
  await page.goto('/you?presenter=1')
  await expect(page.getByRole('heading', { name: 'Presenter controls' })).toBeVisible()
  await page.getByRole('button', { name: 'Seed returning player' }).click()
  await expect(page.getByText('Returning-player history ready.')).toBeVisible()
  await expect(page.getByText('Respiratory Challenge').first()).toBeVisible()

  const activeRunUrl = '/play/respiratory-challenge?difficulty=warmup&seed=1904'
  await page.goto(activeRunUrl)
  await expect(page.getByRole('button', { name: 'Start round' })).toBeVisible()
  await page.goto('/you?presenter=1')
  await page.getByRole('button', { name: 'Reset progress' }).click()
  await expect(page.getByText('Progress reset.')).toBeVisible()
  await page.goto(activeRunUrl)
  await expect(page.getByRole('heading', { name: 'Game in progress' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Start round' })).toBeVisible()
})
