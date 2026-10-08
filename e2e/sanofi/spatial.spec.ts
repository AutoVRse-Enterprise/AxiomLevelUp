import { expect, test } from '@playwright/test'

import {
  anatomySnapshot,
  answerExploreRound,
  answerLookRound,
  dismissSpatialHint,
  startRound,
} from './helpers/rounds'
import { installSanofiFixtures } from './helpers/fixtures'

test.use({ serviceWorkers: 'block' })

test.beforeEach(async ({ page }) => {
  await installSanofiFixtures(page)
})

test('completes both spatial rounds through visible and keyboard controls', async ({ page }) => {
  test.slow()
  await page.goto('/play/fixture-spatial?difficulty=warmup&seed=1701')
  await startRound(page)
  await dismissSpatialHint(page)
  await answerLookRound(page)
  await page.getByRole('button', { name: 'Next round' }).click()

  await startRound(page)
  await answerExploreRound(page)
  await page.getByRole('button', { name: 'See your score' }).click()
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
})

test('offers explicit lobe choices after spatial exploration', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'One renderer picking check is sufficient.',
  )
  test.slow()
  await page.goto('/play/fixture-spatial?seed=1702')
  await startRound(page)
  await dismissSpatialHint(page)
  await answerLookRound(page)
  await page.getByRole('button', { name: 'Next round' }).click()
  await startRound(page)
  await page.getByRole('button', { name: 'Choose my location' }).click()

  const lobe = page.getByRole('radio', { name: 'Right upper lobe' })
  await expect(lobe).toBeVisible()
  await lobe.click()
  await expect(page.getByRole('button', { name: 'Next step' })).toBeEnabled()
})

test('offers a zero-point skip when the spatial viewer fails', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'One WebGL failure path is sufficient.')
  test.slow()
  await page.goto('/play/fixture-spatial?seed=1703')
  await startRound(page)
  await anatomySnapshot(page)
  const lost = await page.evaluate(
    () =>
      (
        globalThis as typeof globalThis & {
          __anatomyTest?: { loseContext(): boolean }
        }
      ).__anatomyTest?.loseContext() ?? false,
  )
  expect(lost).toBe(true)
  await expect(page.getByRole('heading', { name: '3D view unavailable' })).toBeVisible()
  await page.getByRole('button', { name: 'Skip round' }).click()
  await expect(page.getByRole('heading', { name: 'Skipped' })).toBeVisible()
  await expect(page.getByText('This round was skipped and scored zero points.')).toBeVisible()
})
