import { expect, test } from '@playwright/test'

import { VERSIONED_MODEL_CACHE } from '../src/pwa/cachePolicy'

test.describe('P11-T12 model preflight', () => {
  test.use({ serviceWorkers: 'allow' })

  test('activates the current build and caches the exact featured model', async ({ page }) => {
    test.slow()
    await page.goto('/')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await expect
      .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
      .toBe(true)

    const modelResponse = page.waitForResponse((response) =>
      /\/assets\/models\/lung-map\/model\.glb\?v=[a-f0-9]{64}$/.test(response.url()),
    )
    await page.goto('/learn/cases/exacerbation-advanced')
    const response = await modelResponse

    await expect(page.getByText('3D model preloaded for this session.')).toBeVisible()
    expect(response.ok()).toBe(true)
    await expect(page.getByText(/^Build 0\.1\.0\+[a-f0-9]{12}$/)).toBeAttached()
    expect(
      await page.evaluate(
        async ({ cacheName, modelUrl }) => {
          const cache = await caches.open(cacheName)
          return Boolean(await cache.match(modelUrl))
        },
        { cacheName: VERSIONED_MODEL_CACHE, modelUrl: response.url() },
      ),
    ).toBe(true)
  })
})
