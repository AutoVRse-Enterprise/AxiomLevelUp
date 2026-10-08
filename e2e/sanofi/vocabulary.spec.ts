import { expect, test, type Page } from '@playwright/test'

import {
  answerChallengeClinicalRound,
  answerChallengeFindingRound,
  answerChallengeLookRound,
} from './helpers/challengeFlow'
import { answerExploreRound, dismissSpatialHint, startRound } from './helpers/rounds'

const forbiddenVocabulary =
  /\b(?:sanofi|course|lesson|learning path|training module|curriculum|learning objective|complete lesson|certification|course progress|continue learning|assessment|pass|fail|grade|learning outcome|course completed|xp)\b/i
const internalVocabulary =
  /\b(?:spatial_look|spatial_explore|spot_finding|clinical_call|respiratory-game-map|lung-model|fixture-[a-z0-9-]+|(?:airway|histology)-(?:drop|explore|mucus|destruction|fibrosis)[a-z0-9-]*)\b/i

async function expectCleanVocabulary(page: Page, state: string) {
  const visibleText = await page.locator('body').innerText()
  expect(visibleText, `${state} contains learning-platform vocabulary`).not.toMatch(
    forbiddenVocabulary,
  )
  expect(visibleText, `${state} exposes an internal content identifier`).not.toMatch(
    internalVocabulary,
  )
}

test('keeps every static route in the game vocabulary', async ({ page }) => {
  for (const path of [
    '/',
    '/leaderboard',
    '/you',
    '/you?presenter=1',
    '/c/invalid',
    '/not-a-route',
  ]) {
    await page.goto(path)
    await expect(page.locator('main')).toBeVisible()
    await expectCleanVocabulary(page, path)
  }

  await page.goto('/you?presenter=1')
  await page.getByRole('button', { name: 'Seed returning player' }).click()
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Respiratory Challenge' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Play', exact: true }).first()).toBeVisible()
  await expect(page.getByText('Best score', { exact: true }).first()).toBeVisible()
  await expectCleanVocabulary(page, 'returning hub')
})

test('keeps active, reveal, result and sharing states in the game vocabulary', async ({ page }) => {
  test.slow()
  await page.goto('/play/respiratory-challenge?difficulty=warmup&seed=2020')
  await expect(page.getByText(/Round 1 of 4/)).toBeVisible()
  await expectCleanVocabulary(page, 'round one intro')

  await startRound(page)
  await dismissSpatialHint(page)
  await expectCleanVocabulary(page, 'round one active')
  await answerChallengeLookRound(page)
  await expectCleanVocabulary(page, 'round one reveal')
  await page.getByRole('button', { name: 'Next round' }).click()

  await startRound(page)
  await expectCleanVocabulary(page, 'round two active')
  await answerExploreRound(page, 5)
  await expectCleanVocabulary(page, 'round two reveal')
  await page.getByRole('button', { name: 'Next round' }).click()

  await startRound(page, 'Lock in location')
  await expectCleanVocabulary(page, 'round three active')
  await answerChallengeFindingRound(page)
  await expectCleanVocabulary(page, 'round three reveal')
  await page.getByRole('button', { name: 'Next round' }).click()

  await answerChallengeClinicalRound(page)
  await expectCleanVocabulary(page, 'round four reveal')
  await page.getByRole('button', { name: 'See your score' }).click()
  await expect(page.getByText('points', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Challenge a colleague' })).toBeVisible()
  await expectCleanVocabulary(page, 'result')

  await page.getByRole('button', { name: 'Challenge a colleague' }).click()
  await expectCleanVocabulary(page, 'share name prompt')
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await expectCleanVocabulary(page, 'share sheet')
  const challengeUrl = await page.locator('p.break-all').textContent()
  expect(challengeUrl).toContain('/c/')
  await page.goto(challengeUrl!)
  await expect(page.getByRole('button', { name: 'Accept challenge' })).toBeVisible()
  await expectCleanVocabulary(page, 'challenge landing')
})
