import { expect, test } from '@playwright/test'

import { VERIFIED_PACKAGE_CACHE, VERSIONED_MODEL_CACHE } from '../src/pwa/cachePolicy'

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

test.describe('P12-T09 offline case package', () => {
  test.use({ serviceWorkers: 'allow' })

  test('downloads and plays a case with verified assets while offline', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'One service-worker project is enough.')
    test.slow()

    await page.goto('/')
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()
    await expect
      .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
      .toBe(true)

    await page.goto('/learn/cases/asthma-foundation')
    await page.getByRole('button', { name: /Download for offline/ }).click()
    await expect(page.getByText(/Available offline ·/)).toBeVisible({ timeout: 30_000 })
    expect(
      await page.evaluate(
        async ({ runtimeCache, verifiedCache }) => {
          const runtime = await caches.open(runtimeCache)
          const verified = await caches.open(verifiedCache)
          const modelRequest = (await verified.keys()).find(({ url }) =>
            url.includes('/assets/models/lung-map/model.glb?v='),
          )
          if (!modelRequest) return false
          await runtime.delete(modelRequest)
          return Boolean(await verified.match(modelRequest))
        },
        { runtimeCache: VERSIONED_MODEL_CACHE, verifiedCache: VERIFIED_PACKAGE_CACHE },
      ),
    ).toBe(true)

    await page.goto('/dev')
    await page.getByRole('button', { name: 'Simulate offline' }).click()
    await expect(page.getByRole('button', { name: 'Restore network' })).toBeVisible()

    await page.goto('/learn/cases/asthma-foundation')
    await page.getByRole('link', { name: 'Start case' }).click()
    await page.getByRole('button', { name: 'Begin stage' }).click()

    await expect(page.locator('[data-anatomy-viewer] canvas')).toBeVisible()
    await expect
      .poll(() =>
        page.evaluate(() => {
          const bridge = (
            globalThis as typeof globalThis & {
              __anatomyTest?: { snapshot(): { structures: unknown[] } }
            }
          ).__anatomyTest
          return (bridge?.snapshot().structures.length ?? 0) > 0
        }),
      )
      .toBe(true)

    await page.getByRole('button', { name: /^Clues/ }).click()
    await page.getByRole('button', { name: /Conducting-airway reference/ }).click()
    const clueImage = page.getByRole('img', {
      name: 'Illustration of a bronchiole leading to alveolar ducts and alveoli.',
    })
    await expect(clueImage).toBeVisible()
    await expect
      .poll(() => clueImage.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBe(1200)
  })
})
