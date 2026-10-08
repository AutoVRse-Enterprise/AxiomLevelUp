import { expect, test } from '@playwright/test'

import { completeRespiratoryChallenge } from './helpers/challengeFlow'

test('loads the scoped shell and completes a challenge offline', async ({
  context,
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'One worker-enabled project is enough.')
  test.slow()

  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Start a quick challenge' })).toBeVisible()
  await expect(page.getByText(/install app/i)).toHaveCount(0)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true)

  const cacheNames = await page.evaluate(() => caches.keys())
  expect(cacheNames.some((name) => name.startsWith('sanofi-'))).toBe(true)
  expect(cacheNames.some((name) => name.startsWith('workbox-precache'))).toBe(false)

  await context.setOffline(true)
  await page.goto('/play/respiratory-challenge?difficulty=warmup&seed=2020')
  await completeRespiratoryChallenge(page, 5)
  await expect(page).toHaveURL(/\/results\//)
})
