import { expect, test, type Page } from '@playwright/test'

import { expectNoAxeViolations, expectNoDocumentHorizontalOverflow } from '../helpers/accessibility'
import { installSanofiFixtures } from './helpers/fixtures'
import { startRound } from './helpers/rounds'

const forbiddenVocabulary =
  /\b(?:sanofi|course|lesson|learning path|training module|curriculum|learning objective|complete lesson|certification|course progress|continue learning|assessment|pass|fail|grade|learning outcome|course completed|xp)\b/i

test.use({ serviceWorkers: 'block' })

test.beforeEach(async ({ page }) => {
  await installSanofiFixtures(page)
})

async function answer(page: Page, option: string, nextLabel: string, roundStarted = false) {
  if (!roundStarted) await startRound(page, 'Lock in')
  await page.getByRole('radio', { name: option }).click()
  await page.getByRole('button', { name: 'Lock in' }).click()
  await expect(page.getByRole('heading', { name: 'Correct' })).toBeVisible()
  await page.getByRole('button', { name: nextLabel }).click()
}

async function storedEventCount(page: Page, eventName: string) {
  return page.evaluate(async (event) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('keyval-store')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const raw = await new Promise<string | undefined>((resolve, reject) => {
      const request = database
        .transaction('keyval')
        .objectStore('keyval')
        .get('axiom-runtime:sanofi:event-log')
      request.onsuccess = () => resolve(request.result as string | undefined)
      request.onerror = () => reject(request.error)
    })
    database.close()
    if (!raw) return 0
    const stored = JSON.parse(raw) as { state?: { events?: Array<{ event?: string }> } }
    return stored.state?.events?.filter((entry) => entry.event === event).length ?? 0
  }, eventName)
}

async function storedGamePhase(page: Page) {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('keyval-store')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const raw = await new Promise<string | undefined>((resolve, reject) => {
      const request = database
        .transaction('keyval')
        .objectStore('keyval')
        .get('axiom-runtime:sanofi:game-session')
      request.onsuccess = () => resolve(request.result as string | undefined)
      request.onerror = () => reject(request.error)
    })
    database.close()
    if (!raw) return null
    const stored = JSON.parse(raw) as { state?: { session?: { phase?: string } } }
    return stored.state?.session?.phase ?? null
  })
}

test('completes the two-round fixture and shows a final score', async ({ page }) => {
  await page.goto('/play/fixture-two-round?seed=42')
  await answer(page, 'Obstructive pattern', 'Next round')
  await startRound(page, 'Lock in')
  await page.getByRole('button', { name: /Inflammatory markers Reveal/ }).click()
  await expect(page.getByRole('heading', { name: 'Reveal this clue?' })).toBeVisible()
  await page
    .getByRole('button', { name: /Reveal ·/ })
    .last()
    .click()
  await expect(page.getByText('620 cells/µL')).toBeVisible()
  await answer(page, 'Asthma exacerbation with type 2 inflammation', 'See your score', true)

  await expect(page.getByText('Sharp eye. Strong finish.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  await expectNoDocumentHorizontalOverflow(page, 'game final')
  await expectNoAxeViolations(page, 'game final')
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenVocabulary)
})

test('records one answer event for an ordinary round submission', async ({ page }) => {
  await page.goto('/play/fixture-one-round?seed=8')
  await startRound(page, 'Lock in')
  await page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }).click()
  await page.getByRole('button', { name: 'Lock in' }).click()
  await expect(page.getByRole('heading', { name: 'Correct' })).toBeVisible()
  await page.waitForTimeout(500)

  await expect.poll(() => storedEventCount(page, 'game_round_answered')).toBe(1)
})

test('resumes a persisted locked round and reveals it once', async ({ page }) => {
  await page.clock.install()
  await page.goto('/play/fixture-one-round?seed=10')
  await startRound(page, 'Lock in')
  await page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }).click()
  await page.getByRole('button', { name: 'Lock in' }).click()
  await expect.poll(() => storedGamePhase(page)).toBe('locked')

  await page.reload()
  await page.getByRole('button', { name: 'Continue game' }).click()
  await page.clock.fastForward(10_000)
  await expect(page.getByRole('heading', { name: 'Correct' })).toBeVisible()
  await expect.poll(() => storedEventCount(page, 'game_round_answered')).toBe(1)
})

test('times out a one-round fixture', async ({ page }) => {
  await page.clock.install()
  await page.goto('/play/fixture-one-round?seed=7')
  await startRound(page, 'Lock in')
  await page.clock.fastForward(71_000)
  await expect(page.getByRole('heading', { name: 'Not quite' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'See your score' })).toBeVisible()
})

test('offers to resume an active round after reload', async ({ page }) => {
  await page.goto('/play/fixture-one-round?seed=9')
  await startRound(page, 'Lock in')
  await page.waitForTimeout(500)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Game in progress' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue game' }).click()
  await expect(
    page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }),
  ).toBeVisible()
})
