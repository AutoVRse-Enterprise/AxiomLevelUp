import { expect, test } from '@playwright/test'

import type { AnatomyTestBridge } from '../src/anatomy3d/viewer/controller'
import { VERIFIED_PACKAGE_CACHE, VERSIONED_MODEL_CACHE } from '../src/pwa/cachePolicy'
import { resetDemo } from './helpers/case-driver'

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

test.describe('P12-T10 anatomy and session resilience', () => {
  test.beforeEach(async ({ page }) => {
    await resetDemo(page)
  })

  test('recovers after a WebGL context loss when the extension is available', async ({ page }) => {
    await page.goto('/learn/cases/asthma-foundation/play')
    await page.getByRole('button', { name: 'Begin stage' }).click()
    await expect(page.locator('[data-anatomy-viewer] canvas')).toBeVisible()
    const supported = await page.evaluate(
      () =>
        (
          window as typeof window & { __anatomyTest?: AnatomyTestBridge }
        ).__anatomyTest?.loseContext() ?? false,
    )
    test.skip(!supported, 'WEBGL_lose_context is unavailable in this Chromium renderer.')

    await expect(page.getByText('3D anatomy unavailable')).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          (
            window as typeof window & { __anatomyTest?: AnatomyTestBridge }
          ).__anatomyTest?.restoreContext() ?? false,
      ),
    ).toBe(true)
    await expect(page.getByText('3D anatomy unavailable')).toHaveCount(0)
    await expect(page.locator('[data-anatomy-viewer] canvas')).toBeVisible()
  })

  test('retries the model after a deterministic request failure', async ({ page }) => {
    let failed = false
    let modelRequests = 0
    await page.route('**/assets/models/**/*.glb*', async (route) => {
      modelRequests += 1
      if (!failed) {
        failed = true
        await route.fulfill({
          status: 503,
          headers: { 'cache-control': 'no-store' },
          body: 'Deterministic model failure',
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/learn/cases/asthma-foundation/play')
    await page.getByRole('button', { name: 'Begin stage' }).click()
    await expect(page.getByText('3D anatomy unavailable')).toBeVisible()
    await page.getByRole('button', { name: 'Retry' }).click()

    await expect.poll(() => modelRequests).toBeGreaterThanOrEqual(2)
    await expect(page.locator('[data-anatomy-viewer] canvas')).toBeVisible({ timeout: 15_000 })
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            ((
              window as typeof window & { __anatomyTest?: AnatomyTestBridge }
            ).__anatomyTest?.snapshot().structures.length ?? 0) > 0,
        ),
      )
      .toBe(true)
  })

  test('resumes the same stage and pinned evidence after navigation', async ({ page }) => {
    await page.goto('/learn/cases/asthma-foundation/play')
    await page.getByRole('button', { name: 'Begin stage' }).click()
    await page.getByText('Choose from list').click()
    await page.getByRole('button', { name: 'Right upper lobe', exact: true }).click()
    await page.getByText('Inspect findings').click()
    await page.getByRole('button', { name: 'Illustrative upper-lobe region' }).click()

    await page.getByRole('button', { name: /^Clues/ }).click()
    const notesTab = page.getByRole('tab', { name: 'Notes' })
    if (await notesTab.isVisible()) {
      await notesTab.click()
    } else {
      await page.getByRole('button', { name: 'Close' }).click()
      await page.getByRole('button', { name: 'Notes', exact: true }).click()
    }
    const finding = page.locator('li').filter({ hasText: 'Illustrative upper-lobe region' })
    await finding.getByRole('button', { name: 'Pin finding' }).click()
    const close = page.getByRole('button', { name: 'Close' })
    if (await close.isVisible()) await close.click()

    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await page.getByText('Choose from list').click()
    await page.getByRole('button', { name: 'Right upper lobe', exact: true }).click()
    await page.getByRole('button', { name: 'Next level' }).click()
    await expect(page.getByText('Level 2 of 3')).toBeVisible()

    await page.goto('/learn')
    await page.goto('/learn/cases/asthma-foundation/play')
    await expect(page.getByText('Stage 1 of 4')).toBeVisible()
    await expect(page.getByText('Task 2 of 2')).toBeVisible()
    await page.getByRole('button', { name: /^Clues/ }).click()
    if (await notesTab.isVisible()) {
      await notesTab.click()
    } else {
      await page.getByRole('button', { name: 'Close' }).click()
      await page.getByRole('button', { name: 'Notes', exact: true }).click()
    }
    await expect(
      page
        .locator('li')
        .filter({ hasText: 'Illustrative upper-lobe region' })
        .getByRole('button', { name: 'Unpin finding' }),
    ).toBeVisible()
  })
})
