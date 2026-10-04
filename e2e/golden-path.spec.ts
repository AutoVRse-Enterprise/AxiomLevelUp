import path from 'node:path'

import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import type { AnatomyTestSnapshot } from '../src/anatomy3d/viewer/controller'
import { capturePhase12Evidence } from './helpers/evidence'
import { loadCase, runCaseThroughEveryState } from './helpers/case-driver'

const goldenCasePath = '/learn/cases/exacerbation-advanced'
const evidenceDirectory = path.resolve('docs/qa/evidence/phase-11')
const rehearsalPauseMs = Number(process.env.P12_REHEARSAL_PACE_MS ?? 0)

async function presenterPause(page: Page) {
  if (rehearsalPauseMs > 0) await page.waitForTimeout(rehearsalPauseMs)
}

async function applyDeterministicSeed(page: Page) {
  await page.goto('/dev')
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.getByText('Advanced seed applied.')).toBeVisible()
}

async function startCase(page: Page, casePath = goldenCasePath) {
  await page.goto(casePath)
  await page.getByRole('link', { name: 'Start case' }).click()
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toHaveCount(0)
}

async function expectPointerHitTarget(locator: Locator) {
  await locator.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'center' }))
  await expect
    .poll(() =>
      locator.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        )
        return Boolean(hit && (hit === element || element.contains(hit)))
      }),
    )
    .toBe(true)
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
      { timeout: 15_000 },
    )
    .toBe(true)

  return page.evaluate(() => {
    const bridge = (
      globalThis as typeof globalThis & {
        __anatomyTest?: { snapshot(): AnatomyTestSnapshot }
      }
    ).__anatomyTest
    if (!bridge) throw new Error('The VITE_E2E anatomy bridge is unavailable.')
    return bridge.snapshot()
  })
}

async function chooseStructure(page: Page, label: string) {
  const list = page.getByText('Choose from list')
  if ((await list.locator('xpath=..').getAttribute('open')) === null) await list.click()
  await page.getByRole('button', { name: label, exact: true }).click()
}

async function completeFoundationExploration(page: Page) {
  await chooseStructure(page, 'Right upper lobe')
  await page.getByText('Inspect spatial findings').click()
  await page.getByRole('button', { name: 'Diffuse airway-wall change' }).click()
  await page.getByRole('button', { name: 'Illustrative upper-lobe region' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
}

async function captureEvidence(page: Page, testInfo: TestInfo, name: string) {
  const viewport = testInfo.project.name === 'touch-phone-chromium' ? '375px' : 'desktop'
  await page.screenshot({
    path: path.join(evidenceDirectory, `${viewport}-${name}.png`),
    fullPage: true,
  })
}

test.beforeEach(async ({ page }) => {
  await applyDeterministicSeed(page)
})

test('opens the golden case with real WebGL and deterministic state', async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  await page.goto(goldenCasePath)
  await expect(page.getByRole('heading', { name: 'Respiratory Case Review' })).toBeVisible()
  await expect(page.getByText('Case C — synthetic patient')).toBeVisible()

  await startCase(page)
  const snapshot = await anatomySnapshot(page)

  expect(snapshot.renderer.webglVersion).toBeGreaterThanOrEqual(1)
  expect(snapshot.renderer.renderer).not.toHaveLength(0)
  expect(snapshot.performance.sampleCount).toBeGreaterThan(0)
  expect(snapshot.performance.medianFrameMs).toBeGreaterThan(0)
  expect(snapshot.performance.medianFps).toBeGreaterThan(0)
  expect(snapshot.structures.length).toBeGreaterThan(0)
  expect(snapshot.findings.some(({ id }) => id === 'exac-posterior-basal-plug')).toBe(true)
  console.log(`[phase-11-qa] ${testInfo.project.name} ${JSON.stringify(snapshot.renderer)}`)
  await expect(page.locator('[data-anatomy-viewer] canvas')).toBeVisible()
  expect(await context.serviceWorkers()).toEqual([])
  expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations())).toEqual([])

  const screenshot = testInfo.outputPath('golden-path-webgl.png')
  await page.locator('[data-anatomy-viewer]').screenshot({ path: screenshot })
  await testInfo.attach('golden-path-webgl', { path: screenshot, contentType: 'image/png' })
})

test('P11-T09: starts once and keeps primary case controls hit-testable', async ({ page }) => {
  await page.goto(goldenCasePath)
  const start = page.getByRole('link', { name: 'Start case' })
  await expectPointerHitTarget(start)
  await start.click()

  await expect(page).toHaveURL(`${goldenCasePath}/play`)
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toHaveCount(0)
  await expectPointerHitTarget(page.getByRole('button', { name: 'Replay how this case works' }))

  await expectPointerHitTarget(page.locator('[data-anatomy-viewer] canvas'))
  await expectPointerHitTarget(page.getByRole('button', { name: /^Back to / }))
  await expectPointerHitTarget(page.getByRole('tab', { name: 'Clues', exact: true }))
})

test('P11-T03: selects the intended lobe with rendered anatomy available', async ({ page }) => {
  test.slow()
  await startCase(page, '/learn/cases/asthma-foundation')
  await completeFoundationExploration(page)
  await expect(page.locator('[data-anatomy-viewer] canvas')).toBeVisible()
  await chooseStructure(page, 'Right upper lobe')
  await expect(page.getByRole('button', { name: 'Next level' })).toBeEnabled()
})

test('P12-T03: selects a procedural segment with real WebGL active', async ({ page }) => {
  test.slow()
  await startCase(page, '/learn/cases/asthma-foundation')
  await completeFoundationExploration(page)
  await page.locator('[data-anatomy-viewer] canvas').scrollIntoViewIfNeeded()

  await chooseStructure(page, 'Right upper lobe')
  await expect(page.getByRole('button', { name: 'Next level' })).toBeEnabled()
  await page.getByRole('button', { name: 'Next level' }).click()

  await chooseStructure(page, 'Apical segment')
  await expect(page.getByRole('button', { name: 'Next level' })).toBeEnabled()
  await expect(page.getByText('Apical segment selected')).toBeAttached()
})

test('P11-T04: retains the configured overview marker across reset', async ({ page }) => {
  test.slow()
  await startCase(page, '/learn/cases/asthma-foundation')
  const beforeReset = await anatomySnapshot(page)
  expect(beforeReset.markers.some(({ visible }) => visible)).toBe(true)
  await page.getByRole('button', { name: 'Reset' }).click()
  const afterReset = await anatomySnapshot(page)
  expect(afterReset.markers.some(({ visible }) => visible)).toBe(true)
})

test('P11-T05: traverses the seeded airway branch', async ({ page }) => {
  test.slow()
  await startCase(page)
  const navigation = page
    .getByRole('button', { name: /^(Back to|Distal branch|Forward branch)/ })
    .first()
  const destination = (await navigation.innerText()).replace(/^Back to /, '')
  await navigation.click()
  await expect(
    page.getByRole('status').filter({ hasText: `You are now in ${destination}.` }),
  ).toBeVisible()
})

test('P11-T06: exposes and activates the patient-specific finding', async ({ page }) => {
  test.slow()
  await startCase(page)
  await page.getByText('Inspect spatial findings').click()
  await page.getByRole('button', { name: 'Dominant mucus obstruction' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Dominant mucus obstruction' }),
  ).toBeVisible()
})

test('P11-T11: completes the five-minute golden path', async ({ page }, testInfo) => {
  test.slow()
  test.setTimeout(rehearsalPauseMs > 0 ? 900_000 : 90_000)
  const startedAt = Date.now()
  await runCaseThroughEveryState(
    page,
    loadCase('exacerbation-advanced'),
    async (state) => {
      if (state === 'exacerbation-advanced:step-exac-explore-airway-complete') {
        await captureEvidence(page, testInfo, 'endoscopic-finding')
        await capturePhase12Evidence(page, testInfo, 'case-advanced-state')
      }
      if (state === 'exacerbation-advanced:step-exac-localise-complete') {
        await captureEvidence(page, testInfo, 'localisation')
      }
      if (state === 'exacerbation-advanced:results') {
        await captureEvidence(page, testInfo, 'results')
        await capturePhase12Evidence(page, testInfo, 'case-advanced-results')
      }
      if (state === 'exacerbation-advanced:compare') {
        await captureEvidence(page, testInfo, 'compare')
        await capturePhase12Evidence(page, testInfo, 'case-advanced-compare')
      }
      await presenterPause(page)
    },
  )
  console.log(
    `[phase-12-case] ${testInfo.project.name} ${rehearsalPauseMs > 0 ? 'scripted rehearsal' : 'automated'} golden path: ${Date.now() - startedAt} ms`,
  )
})
