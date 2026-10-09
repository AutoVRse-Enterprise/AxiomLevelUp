import { expect, test, type Page } from '@playwright/test'

import { encodeChallenge } from '../../src/engines/games/links'
import {
  answerChallengeCtRound,
  answerChallengeFindingRound,
  answerChallengeLookRound,
} from './helpers/challengeFlow'
import { installSanofiFixtures } from './helpers/fixtures'
import {
  advanceRoundIntro,
  anatomySnapshot,
  answerExploreRound,
  dismissSpatialHint,
  startRound,
} from './helpers/rounds'

test.use({ reducedMotion: 'reduce', serviceWorkers: 'block' })

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-07T12:00:00Z'))
})

async function readyForSnapshot(page: Page) {
  await page.addStyleTag({
    content:
      'p[title="Application build identifier"] { visibility: hidden !important; } * { caret-color: transparent !important; }',
  })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(150)
}

async function snapshot(page: Page, name: string) {
  await readyForSnapshot(page)
  await expect(page).toHaveScreenshot(`${name}.png`, {
    animations: 'disabled',
    caret: 'hide',
    fullPage: true,
    maxDiffPixelRatio: 0.005,
    timeout: 15_000,
  })
}

test('visual: hub', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Respiratory Challenge' })).toBeVisible()
  await snapshot(page, 'hub')
})

test('visual: round intro', async ({ page }) => {
  await page.goto('/play/respiratory-challenge?difficulty=warmup&seed=2020')
  await expect(page.getByRole('button', { name: 'Start round' })).toBeVisible()
  await page.waitForTimeout(1_500)
  await expect(page.getByText('Round 1 of 5')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start round' })).toBeVisible()
  await snapshot(page, 'round-intro')
})

test('visual: accepted outside-in round one', async ({ page }) => {
  await page.goto('/play/respiratory-challenge?difficulty=warmup&seed=2020')
  await startRound(page)
  await dismissSpatialHint(page)
  const anatomy = await anatomySnapshot(page)
  expect(anatomy.markers).toHaveLength(1)
  expect(anatomy.markers[0]?.visible).toBe(true)
  await snapshot(page, 'round-one-active')
})

test('visual: later quick challenge rounds', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/play/respiratory-challenge?difficulty=warmup&seed=2020')
  await startRound(page)
  await dismissSpatialHint(page)
  await answerChallengeLookRound(page)
  await page.getByRole('button', { name: 'Next round' }).click()

  await startRound(page)
  const anatomy = await anatomySnapshot(page)
  expect(anatomy.markers).toHaveLength(1)
  expect(anatomy.markers[0]?.visible).toBe(true)
  await expect(page.getByRole('button', { name: 'Airway' })).toHaveCount(0)
  await expect(page.getByText('Current position', { exact: true })).toHaveCount(0)
  await snapshot(page, 'round-two-active')
  await answerExploreRound(page)
  await page.getByRole('button', { name: 'Next round' }).click()

  await startRound(page, 'Lock in location')
  await snapshot(page, 'round-three-active')
  await answerChallengeFindingRound(page)
  await page.getByRole('button', { name: 'Next round' }).click()

  await startRound(page, 'Lock in')
  await answerChallengeCtRound(page)
  await page.getByRole('button', { name: 'Next round' }).click()

  await advanceRoundIntro(page)
  await expect(
    page.getByRole('radio', {
      name: 'Asthma exacerbation with type 2 inflammation',
    }),
  ).toBeVisible({ timeout: 20_000 })
  await snapshot(page, 'round-four-active')
})

test('visual: correct reveal', async ({ page }) => {
  await installSanofiFixtures(page)
  await page.goto('/play/fixture-one-round?difficulty=challenge&seed=2020')
  await startRound(page, 'Lock in')
  await page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }).click()
  await page.getByRole('button', { name: 'Lock in' }).click()
  await expect(page.getByRole('heading', { name: 'Correct' })).toBeVisible()
  await snapshot(page, 'correct-reveal')
})

test('visual: incorrect reveal', async ({ page }) => {
  await page.goto('/play/respiratory-challenge?difficulty=warmup&seed=2020')
  await startRound(page)
  await dismissSpatialHint(page)
  await answerChallengeLookRound(page)
  await expect(page.getByRole('heading', { name: 'Not quite' })).toBeVisible()
  await snapshot(page, 'incorrect-reveal')
})

test('visual: result', async ({ page }) => {
  await page.goto('/you?presenter=1')
  await page.getByRole('button', { name: 'Seed returning player' }).click()
  await expect(page.getByText('Returning-player history ready.')).toBeVisible()
  await page.goto('/results/returning-quick-1')
  await expect(page.getByRole('heading', { name: /Respiratory Challenge result/ })).toBeAttached()
  await snapshot(page, 'result')
})

test('visual: challenge landing', async ({ page }) => {
  const token = encodeChallenge({
    v: 1,
    g: 'respiratory-challenge',
    gv: '1',
    d: 'challenge',
    s: 2020,
    f: 'Dr Morgan',
    sc: 2840,
  })
  await page.goto(`/c/${token}`)
  await expect(page.getByRole('button', { name: 'Accept challenge' })).toBeVisible()
  await snapshot(page, 'challenge-landing')
})
