import { expect, type Page } from '@playwright/test'

import type { AnatomyTestSnapshot } from '../../../src/anatomy3d/viewer/controller'

export async function advanceRoundIntro(page: Page) {
  const intro = page.getByRole('button').filter({ has: page.getByText('Round', { exact: true }) })
  if (await intro.isVisible()) await intro.click()
}

export async function startRound(page: Page, expectedControl = 'I know where I am') {
  await advanceRoundIntro(page)
  await expect(page.getByRole('button', { name: expectedControl })).toBeVisible({
    timeout: 20_000,
  })
}

export async function dismissSpatialHint(page: Page) {
  const dismiss = page.getByRole('button', { name: 'Dismiss anatomy interaction hint' })
  if (await dismiss.isVisible()) await dismiss.click()
}

export async function chooseRadioWithKeyboard(page: Page, name: string) {
  const radio = page.getByRole('radio', { name, exact: true })
  await radio.focus()
  await page.keyboard.press('Space')
  await expect(radio).toBeChecked()
}

export async function answerLookRound(page: Page) {
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

export async function chooseFirstListedStructure(page: Page) {
  const summary = page.getByText('Choose from list', { exact: true })
  const details = summary.locator('..')
  if ((await details.getAttribute('open')) === null) await summary.click()
  await details.getByRole('button').first().click()
}

export async function answerExploreRound(page: Page, expectedMoves = 5) {
  await expect(page.getByText(`Moves left: ${expectedMoves}`)).toBeVisible()
  await page.getByRole('button', { name: /^Back to / }).click()
  await expect(page.getByText(`Moves left: ${expectedMoves - 1}`)).toBeVisible()
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

export async function anatomySnapshot(page: Page): Promise<AnatomyTestSnapshot> {
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
