import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  applyTwoHundredPercentText,
  expectNoAxeViolations,
  expectNoDocumentHorizontalOverflow,
  expectVisibleKeyboardFocus,
} from '../helpers/accessibility'
import { installSanofiFixtures } from './helpers/fixtures'

async function activate(page: Page, locator: Locator, key = 'Enter') {
  await locator.focus()
  await page.keyboard.press(key)
}

async function advanceIntroWithKeyboard(page: Page) {
  const start = page.getByRole('button', { name: 'Start round' })
  await expect(start).toBeVisible({ timeout: 20_000 })
  await activate(page, start)
}

async function chooseFirstRadioWithKeyboard(page: Page) {
  const radio = page.getByRole('radio').first()
  await activate(page, radio, 'Space')
  await expect(radio).toBeChecked()
}

test('passes axe and 200% text checks on every static route', async ({ page }) => {
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
    await expectNoAxeViolations(page, path)
    await applyTwoHundredPercentText(page)
    await expectNoDocumentHorizontalOverflow(page, `${path} at 200% text`)
  }

  await page.goto('/you?presenter=1')
  await page.getByRole('button', { name: 'Seed returning player' }).click()
  await page.goto('/results/returning-quick-1')
  await expectNoAxeViolations(page, 'saved result')
  await applyTwoHundredPercentText(page)
  await expectNoDocumentHorizontalOverflow(page, 'saved result at 200% text')
  await expectVisibleKeyboardFocus(page)
})

test('completes all four mechanics with keyboard input only', async ({ page }) => {
  test.slow()
  await page.clock.install()
  await page.goto('/play/respiratory-challenge?difficulty=warmup&seed=2020')

  await advanceIntroWithKeyboard(page)
  const hint = page.getByRole('button', { name: 'Dismiss anatomy interaction hint' })
  if (await hint.isVisible()) await activate(page, hint)
  await expectNoAxeViolations(page, 'keyboard round one active')
  await page.locator('[data-anatomy-viewer]').focus()
  await page.keyboard.press('ArrowLeft')
  await activate(page, page.getByRole('button', { name: 'Choose my location' }))
  for (let index = 0; index < 3; index += 1) {
    await chooseFirstRadioWithKeyboard(page)
    await activate(page, page.getByRole('button', { name: index === 2 ? 'Lock in' : 'Next step' }))
  }
  await expectNoAxeViolations(page, 'keyboard round one reveal')
  await activate(page, page.getByRole('button', { name: 'Next round' }))

  await advanceIntroWithKeyboard(page)
  await expectNoAxeViolations(page, 'keyboard round two active')
  await activate(page, page.getByRole('button', { name: /^Back to / }))
  await activate(page, page.getByRole('button', { name: 'Choose my location' }))
  await chooseFirstRadioWithKeyboard(page)
  await activate(page, page.getByRole('button', { name: 'Next step' }))
  await chooseFirstRadioWithKeyboard(page)
  await activate(page, page.getByRole('button', { name: 'Lock in' }))
  await expectNoAxeViolations(page, 'keyboard round two reveal')
  await activate(page, page.getByRole('button', { name: 'Next round' }))

  await advanceIntroWithKeyboard(page)
  await expectNoAxeViolations(page, 'keyboard round three active')
  await activate(page, page.getByRole('button', { name: 'Zoom in' }))
  const imageViewer = page.getByRole('button', { name: /Interactive image viewer/ })
  await imageViewer.focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expectNoAxeViolations(page, 'keyboard round three reveal')
  await activate(page, page.getByRole('button', { name: 'Next round' }))

  await advanceIntroWithKeyboard(page)
  await expectNoAxeViolations(page, 'keyboard round four active')
  await activate(page, page.getByRole('button', { name: /Pathology image Reveal/ }))
  await expectNoAxeViolations(page, 'paid clue confirmation')
  await activate(page, page.getByRole('button', { name: /Reveal ·/ }).last())
  const clinicalAnswer = page.getByRole('radio', {
    name: 'Asthma exacerbation with type 2 inflammation',
  })
  await activate(page, clinicalAnswer, 'Space')
  await activate(page, page.getByRole('button', { name: 'Lock in' }))
  await expectNoAxeViolations(page, 'keyboard round four reveal')
  await activate(page, page.getByRole('button', { name: 'See your score' }))

  await expect(page).toHaveURL(/\/results\//)
  await expect(page.getByRole('heading', { name: /Respiratory Challenge result/ })).toBeFocused()
  await expectNoAxeViolations(page, 'keyboard result')
})

test.describe('live announcements', () => {
  test.use({ serviceWorkers: 'block' })

  test('announces timer thresholds, timeout, reveal and final score', async ({ page }) => {
    await installSanofiFixtures(page)
    await page.clock.install()
    await page.goto('/play/fixture-one-round?difficulty=challenge&seed=2020')
    await advanceIntroWithKeyboard(page)
    await expect(
      page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }),
    ).toBeVisible()

    await page.evaluate(() => {
      const scope = window as typeof window & { __announcements?: string[] }
      scope.__announcements = []
      window.addEventListener('presentation-announcement', (event) => {
        scope.__announcements?.push((event as CustomEvent<string>).detail)
      })
    })
    for (let second = 0; second < 70; second += 1) {
      if ((await page.getByRole('timer').getAttribute('aria-label'))?.startsWith('1 ')) break
      await page.clock.fastForward(1_000)
    }
    const thresholdAnnouncements = await page.evaluate(
      () => (window as typeof window & { __announcements?: string[] }).__announcements ?? [],
    )
    expect(thresholdAnnouncements).toContain('30 seconds remaining')
    await page.clock.fastForward(1_000)
    await page.clock.fastForward(500)
    await expect(page.getByRole('heading', { name: 'Not quite' })).toBeVisible()
    const timeoutAnnouncements = await page.evaluate(
      () => (window as typeof window & { __announcements?: string[] }).__announcements ?? [],
    )
    expect(timeoutAnnouncements).toContain('Time is up')
    expect(timeoutAnnouncements).toContain('Not quite')
    await activate(page, page.getByRole('button', { name: 'See your score' }))
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as typeof window & { __announcements?: string[] }).__announcements ?? [],
        ),
      )
      .toContainEqual(expect.stringMatching(/Clinical call fixture result/))
  })
})
