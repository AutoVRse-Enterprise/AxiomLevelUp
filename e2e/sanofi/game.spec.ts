import { expect, test, type Page } from '@playwright/test'

import { expectNoAxeViolations, expectNoDocumentHorizontalOverflow } from '../helpers/accessibility'

const forbiddenVocabulary =
  /\b(?:sanofi|course|lesson|learning path|training module|curriculum|learning objective|complete lesson|certification|course progress|continue learning|assessment|pass|fail|grade|learning outcome|course completed|xp)\b/i

async function answer(page: Page, option: string, nextLabel: string) {
  await page.getByRole('radio', { name: option }).click()
  await page.getByRole('button', { name: 'Lock in' }).click()
  await expect(page.getByRole('heading', { name: 'Correct' })).toBeVisible()
  await page.getByRole('button', { name: nextLabel }).click()
}

test('completes the two-round fixture and shows a final score', async ({ page }) => {
  await page.goto('/play/fixture-two-round?seed=42')
  await answer(page, 'Obstructive pattern', 'Next round')
  await page.getByRole('button', { name: /Inflammatory markers Reveal/ }).click()
  await expect(page.getByRole('heading', { name: 'Reveal this clue?' })).toBeVisible()
  await page
    .getByRole('button', { name: /Reveal ·/ })
    .last()
    .click()
  await expect(page.getByText('620 cells/µL')).toBeVisible()
  await answer(page, 'Asthma exacerbation with type 2 inflammation', 'See your score')

  await expect(page.getByText('Sharp eye. Strong finish.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible()
  await expectNoDocumentHorizontalOverflow(page, 'game final')
  await expectNoAxeViolations(page, 'game final')
  expect(await page.locator('body').innerText()).not.toMatch(forbiddenVocabulary)
})

test('times out a one-round fixture', async ({ page }) => {
  await page.clock.install()
  await page.goto('/play/fixture-one-round?seed=7')
  await page.clock.fastForward(2_000)
  await expect(
    page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }),
  ).toBeVisible()
  await page.clock.fastForward(61_000)
  await expect(page.getByRole('heading', { name: 'Not quite' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'See your score' })).toBeVisible()
})

test('offers to resume an active round after reload', async ({ page }) => {
  await page.goto('/play/fixture-one-round?seed=9')
  await expect(
    page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }),
  ).toBeVisible()
  await page.waitForTimeout(500)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Game in progress' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue game' }).click()
  await expect(
    page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }),
  ).toBeVisible()
})
