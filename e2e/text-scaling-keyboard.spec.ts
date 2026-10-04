import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  applyTwoHundredPercentText,
  expectNoDocumentHorizontalOverflow,
  expectReachable,
  expectVisibleKeyboardFocus,
} from './helpers/accessibility'
import { resetDemo } from './helpers/case-driver'

async function keyboardActivate(page: Page, locator: Locator, key: 'Enter' | 'Space' = 'Enter') {
  await locator.focus()
  await expect(locator).toBeFocused()
  await page.keyboard.press(key)
}

test.beforeEach(async ({ page }) => {
  await resetDemo(page)
})

test('P12-T10: CasePlayer, results and comparison support 200% text', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/learn/cases/asthma-foundation')
  await applyTwoHundredPercentText(page)
  await page.getByRole('link', { name: 'Start case' }).click()
  await expect(page.locator('[data-anatomy-viewer]')).toBeVisible()
  await expectNoDocumentHorizontalOverflow(page, 'CasePlayer viewer at 200% text')

  await page.getByRole('tab', { name: 'Clues', exact: true }).click()
  await expectNoDocumentHorizontalOverflow(page, 'CasePlayer Clues at 200% text')
  const notesTab = page.getByRole('tab', { name: 'Case notes' })
  await notesTab.click()
  await expectNoDocumentHorizontalOverflow(page, 'CasePlayer Notes at 200% text')
  const taskTab = page.getByRole('tab', { name: 'Task', exact: true })
  if (await taskTab.isVisible()) await taskTab.click()
  await page.getByText('Choose from list').click()
  await page.getByRole('button', { name: 'Right upper lobe', exact: true }).click()
  await page.getByText('Inspect spatial findings').click()
  await page.getByRole('button', { name: 'Diffuse airway-wall change' }).click()
  await page.getByRole('button', { name: 'Illustrative upper-lobe region' }).click()
  await expectReachable(page.getByRole('button', { name: 'Continue', exact: true }))

  await page.goto('/learn/cases/asthma-foundation/attempts/seed-asthma-foundation-1')
  await applyTwoHundredPercentText(page)
  await expect(page.getByText('Case complete')).toBeVisible()
  await expectNoDocumentHorizontalOverflow(page, 'CaseResults at 200% text')
  await expectReachable(page.getByRole('button', { name: 'Compare with model answer' }))
  await page.getByRole('button', { name: 'Compare with model answer' }).click()
  await expect(page.getByRole('heading', { name: 'You versus Model answer' })).toBeVisible()
  await expectNoDocumentHorizontalOverflow(page, 'CaseCompare at 200% text')
  await expectReachable(page.getByRole('button', { name: 'Continue', exact: true }))
})

test('P12-T10: keyboard-only learner path reaches case completion', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/learn/cases/wheeze-quick')
  await expect(page.getByRole('link', { name: 'Start case' })).toBeVisible()
  await expectVisibleKeyboardFocus(page)
  await keyboardActivate(page, page.getByRole('link', { name: 'Start case' }))

  await keyboardActivate(page, page.getByText('Choose from list'))
  await keyboardActivate(page, page.getByRole('button', { name: 'Left upper lobe', exact: true }))
  await keyboardActivate(page, page.getByText('Inspect spatial findings'))
  await keyboardActivate(
    page,
    page.getByRole('button', { name: 'Diffuse airway-wall change', exact: true }),
  )
  await keyboardActivate(page, page.getByRole('button', { name: 'Continue', exact: true }))

  await keyboardActivate(page, page.getByRole('radio', { name: 'Conducting airway' }), 'Space')
  await keyboardActivate(page, page.getByRole('button', { name: 'Check answer' }))
  await keyboardActivate(page, page.getByRole('button', { name: 'Continue', exact: true }))

  await keyboardActivate(page, page.getByRole('tab', { name: 'Clues', exact: true }))
  for (const clue of ['Trigger pattern', 'Before-and-after flow']) {
    await keyboardActivate(page, page.getByRole('button', { name: new RegExp(clue) }))
    await page.waitForTimeout(1_300)
  }
  const taskTab = page.getByRole('tab', { name: 'Task', exact: true })
  if (await taskTab.isVisible()) await keyboardActivate(page, taskTab)
  await keyboardActivate(page, page.getByRole('checkbox', { name: /Trigger pattern/ }), 'Space')
  await keyboardActivate(
    page,
    page.getByRole('checkbox', { name: /Before-and-after flow/ }),
    'Space',
  )
  await keyboardActivate(page, page.getByRole('button', { name: 'Cite evidence', exact: true }))
  await keyboardActivate(page, page.getByRole('button', { name: 'Continue', exact: true }))
  await keyboardActivate(page, page.getByRole('button', { name: 'Continue', exact: true }))
  await keyboardActivate(
    page,
    page.getByRole('button', {
      name: 'Variable airflow obstruction compatible with asthma',
    }),
  )
  await keyboardActivate(page, page.getByRole('button', { name: 'Continue', exact: true }))
  await keyboardActivate(
    page,
    page.getByRole('button', {
      name: 'It is the best-supported hypothesis for this synthetic case',
    }),
  )
  await keyboardActivate(page, page.getByRole('button', { name: 'Continue', exact: true }))
  await keyboardActivate(page, page.getByRole('button', { name: 'Complete scenario' }))
  await keyboardActivate(page, page.getByRole('button', { name: 'Continue', exact: true }))

  await expect(page.getByText('Case complete')).toBeVisible()
})
