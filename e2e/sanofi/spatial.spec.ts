import { expect, test, type Page } from '@playwright/test'

import type { AnatomyTestSnapshot } from '../../src/anatomy3d/viewer/controller'

async function startRound(page: Page) {
  const intro = page.getByRole('button').filter({ has: page.getByText('Round', { exact: true }) })
  if (await intro.isVisible()) await intro.click()
  await expect(page.getByRole('button', { name: 'I know where I am' })).toBeVisible({
    timeout: 20_000,
  })
}

async function dismissSpatialHint(page: Page) {
  const dismiss = page.getByRole('button', { name: 'Dismiss anatomy interaction hint' })
  if (await dismiss.isVisible()) await dismiss.click()
}

async function chooseRadioWithKeyboard(page: Page, name: string) {
  const radio = page.getByRole('radio', { name, exact: true })
  await radio.focus()
  await page.keyboard.press('Space')
  await expect(radio).toBeChecked()
}

async function answerLookRound(page: Page) {
  await page.locator('[data-anatomy-viewer]').focus()
  await page.keyboard.press('ArrowLeft')
  await page.getByRole('button', { name: 'I know where I am' }).click()
  await chooseRadioWithKeyboard(page, 'Right')
  await page.getByRole('button', { name: 'Next step' }).click()
  await chooseRadioWithKeyboard(page, 'Lower')
  await page.getByRole('button', { name: 'Next step' }).click()
  await chooseRadioWithKeyboard(page, 'Lobar bronchus')
  await page.getByRole('button', { name: 'Lock in' }).click()
  await expect(page.getByRole('button', { name: 'Next round' })).toBeVisible()
}

async function chooseFirstListedStructure(page: Page) {
  const summary = page.getByText('Choose from list', { exact: true })
  const details = summary.locator('..')
  if ((await details.getAttribute('open')) === null) await summary.click()
  await details.getByRole('button').first().click()
}

async function answerExploreRound(page: Page) {
  await expect(page.getByText('Moves left: 5')).toBeVisible()
  await page.getByRole('button', { name: /^Back to / }).click()
  await expect(page.getByText('Moves left: 4')).toBeVisible()
  await page.getByRole('button', { name: 'I know where I am' }).click()
  await chooseFirstListedStructure(page)
  await page.getByRole('button', { name: 'Next step' }).click()
  const segment = page.getByRole('radio').first()
  await segment.focus()
  await page.keyboard.press('Space')
  await expect(segment).toBeChecked()
  await page.getByRole('button', { name: 'Lock in' }).click()
  await expect(page.getByText('Compare your pin with the actual location.')).toBeVisible({
    timeout: 20_000,
  })
}

async function anatomySnapshot(page: Page): Promise<AnatomyTestSnapshot> {
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Boolean(
            (
              globalThis as typeof globalThis & {
                __anatomyTest?: { snapshot(): unknown }
              }
            ).__anatomyTest,
          ),
        ),
      { timeout: 20_000 },
    )
    .toBe(true)
  return page.evaluate(() => {
    const bridge = (
      globalThis as typeof globalThis & {
        __anatomyTest?: { snapshot(): AnatomyTestSnapshot }
      }
    ).__anatomyTest
    if (!bridge) throw new Error('The anatomy test bridge is unavailable.')
    return bridge.snapshot()
  })
}

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
  await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible()
})

test('selects a lobe by picking the rendered canvas', async ({ page }, testInfo) => {
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
  await page.getByRole('button', { name: 'I know where I am' }).click()

  const snapshot = await anatomySnapshot(page)
  const lobe = snapshot.structures.find(
    ({ id, visible }) => visible && /-(?:upper|middle|lower)-lobe$/.test(id),
  )
  expect(lobe).toBeDefined()
  await page.mouse.click(lobe!.clientX, lobe!.clientY)
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
