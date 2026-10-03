import path from 'node:path'

import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import type { AnatomyTestSnapshot } from '../src/anatomy3d/viewer/controller'

const goldenCasePath = '/learn/cases/exacerbation-advanced'
const evidenceDirectory = path.resolve('docs/qa/evidence/phase-11')

async function applyDeterministicSeed(page: Page) {
  await page.goto('/dev')
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.getByText('Advanced seed applied.')).toBeVisible()
}

async function startCase(page: Page, casePath = goldenCasePath) {
  await page.goto(casePath)
  await page.getByRole('link', { name: 'Start case' }).click()
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Begin stage' }).click()
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

async function activateProjectedPoint(
  page: Page,
  testInfo: TestInfo,
  point: { clientX: number; clientY: number },
) {
  if (testInfo.project.name === 'touch-phone-chromium') {
    await page.touchscreen.tap(point.clientX, point.clientY)
  } else {
    await page.mouse.click(point.clientX, point.clientY)
  }
}

async function stableFindingPoint(page: Page, findingId: string) {
  let previous: { clientX: number; clientY: number } | undefined
  let current: { clientX: number; clientY: number } | undefined
  await expect
    .poll(
      async () => {
        const snapshot = await anatomySnapshot(page)
        const finding = snapshot.findings.find(({ id, visible }) => id === findingId && visible)
        if (!finding) return false
        current = finding
        const stable =
          previous !== undefined &&
          Math.hypot(finding.clientX - previous.clientX, finding.clientY - previous.clientY) < 1
        previous = finding
        return stable
      },
      { intervals: [150, 250, 400, 600], timeout: 15_000 },
    )
    .toBe(true)
  return current!
}

async function projectedStructurePoint(page: Page, structureId: string) {
  let current: { clientX: number; clientY: number } | undefined
  await expect
    .poll(
      async () => {
        const snapshot = await anatomySnapshot(page)
        const structure = snapshot.structures.find(
          ({ id, visible }) => id === structureId && visible,
        )
        if (!structure) return false
        current = structure
        return true
      },
      { intervals: [150, 250, 400, 600], timeout: 15_000 },
    )
    .toBe(true)
  return current!
}

async function completeFoundationExploration(page: Page) {
  await page.getByText('Choose from list').click()
  await page.getByRole('button', { name: 'Right upper lobe', exact: true }).click()
  await page.getByText('Inspect findings').click()
  await page.getByRole('button', { name: 'Illustrative upper-lobe region' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
}

async function dismissCelebrations(page: Page) {
  for (let index = 0; index < 5; index += 1) {
    const dialog = page.getByRole('dialog')
    const appeared = await dialog
      .waitFor({ state: 'visible', timeout: index === 0 ? 2_000 : 500 })
      .then(() => true)
      .catch(() => false)
    if (!appeared) return
    const continueButton = dialog.getByRole('button', { name: 'Continue' })
    await continueButton.click()
  }
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
  const beginStage = page.getByRole('button', { name: 'Begin stage' })
  await expectPointerHitTarget(beginStage)
  await beginStage.click()

  await expectPointerHitTarget(page.locator('[data-anatomy-viewer] canvas'))
  await expectPointerHitTarget(page.getByRole('button', { name: 'Carina' }))
  await expectPointerHitTarget(page.getByRole('button', { name: /^Clues/ }))
})

test('P11-T03: selects the intended lobe through the rendered canvas', async ({
  page,
}, testInfo) => {
  test.slow()
  await startCase(page, '/learn/cases/asthma-foundation')
  await completeFoundationExploration(page)
  const snapshot = await anatomySnapshot(page)
  const target = snapshot.structures.find(({ id, visible }) => id === 'right-upper-lobe' && visible)
  expect(target, 'right-upper-lobe must have a visible projected point').toBeDefined()

  await activateProjectedPoint(page, testInfo, target!)
  await expect(page.getByRole('button', { name: 'Next level' })).toBeEnabled()
})

test('P12-T03: selects a procedural segment through real WebGL', async ({ page }, testInfo) => {
  test.slow()
  await startCase(page, '/learn/cases/asthma-foundation')
  await completeFoundationExploration(page)
  await page.locator('[data-anatomy-viewer] canvas').scrollIntoViewIfNeeded()

  const lobe = await projectedStructurePoint(page, 'right-upper-lobe')
  await activateProjectedPoint(page, testInfo, lobe)
  await expect(page.getByRole('button', { name: 'Next level' })).toBeEnabled()
  await page.getByRole('button', { name: 'Next level' }).click()

  const segment = await projectedStructurePoint(page, 'right-upper-apical-segment')
  await activateProjectedPoint(page, testInfo, segment)
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

test('P11-T05: traverses the authored airway branch and returns', async ({ page }) => {
  test.slow()
  await startCase(page)
  await page.getByRole('button', { name: 'Carina' }).click()
  await expect(page.getByText('Carina reached')).toBeAttached()
  await page.getByRole('button', { name: 'Right main airway' }).click()
  await expect(page.getByText('Right main airway reached')).toBeAttached()
  await page.getByRole('button', { name: 'Back to Carina' }).click()
  await expect(page.getByText('Carina reached')).toBeAttached()
})

test('P11-T06: projects and activates the patient-specific finding', async ({ page }, testInfo) => {
  test.slow()
  await startCase(page)
  await page.getByRole('button', { name: 'Carina' }).click()
  await page.getByRole('button', { name: 'Right main airway' }).click()
  await page.getByRole('button', { name: 'Right lower lobar airway' }).click()
  await page.getByRole('button', { name: 'Posterior basal segmental airway' }).click()
  await page.locator('[data-anatomy-viewer] canvas').scrollIntoViewIfNeeded()
  const finding = await stableFindingPoint(page, 'exac-posterior-basal-plug')

  await activateProjectedPoint(page, testInfo, finding)
  await expect(
    page.getByRole('status').filter({ hasText: 'Dominant posterior basal mucus plug' }),
  ).toBeVisible()
})

test('P11-T11: completes the five-minute golden path', async ({ page }, testInfo) => {
  test.slow()
  const startedAt = Date.now()
  await startCase(page)

  await page.getByRole('button', { name: 'Carina' }).click()
  await page.getByRole('button', { name: 'Right main airway' }).click()
  await page.getByRole('button', { name: 'Right lower lobar airway' }).click()
  await page.getByRole('button', { name: 'Posterior basal segmental airway' }).click()
  await page.locator('[data-anatomy-viewer] canvas').scrollIntoViewIfNeeded()
  const plug = await stableFindingPoint(page, 'exac-posterior-basal-plug')
  await activateProjectedPoint(page, testInfo, plug)
  await expect(
    page.getByRole('status').filter({ hasText: 'Dominant posterior basal mucus plug' }),
  ).toBeVisible()
  await captureEvidence(page, testInfo, 'endoscopic-finding')
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByText('Choose from list').click()
  await page.getByRole('button', { name: 'Right lower lobe' }).click()
  await page.getByRole('button', { name: 'Next level' }).click()
  await page.getByRole('radio', { name: 'Posterior basal segment' }).click()
  await page.getByRole('button', { name: 'Next level' }).click()
  await page.getByRole('radio', { name: 'Segmental bronchus' }).click()
  await page.getByRole('button', { name: 'Check locations' }).click()
  await captureEvidence(page, testInfo, 'localisation')
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('button', { name: 'Begin stage' }).click()
  for (const label of [
    'Difficulty completing sentences',
    'Peak expiratory flow falling to 170 L/min',
    'Oxygen saturation of 91% on room air and falling',
    'PaCO₂ rising from 4.1 to 5.8 kPa during ongoing distress',
  ]) {
    await page.getByRole('checkbox', { name: label }).click()
  }
  await page.getByRole('button', { name: 'Check answer' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('button', { name: 'Begin stage' }).click()
  await page
    .getByRole('radio', {
      name: 'It may indicate that ventilation is failing to keep pace with the work of breathing',
    })
    .click()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('button', { name: 'Begin stage' }).click()
  await page
    .getByRole('radio', {
      name: 'Severe asthma exacerbation with deteriorating ventilatory reserve',
    })
    .click()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page
    .getByRole('radio', {
      name: 'Treat the pattern as high-risk deterioration and activate urgent escalation under the local emergency pathway',
    })
    .click()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByText('Case complete')).toBeVisible()
  await dismissCelebrations(page)
  await expect(page.getByRole('button', { name: 'Compare' })).toBeVisible()
  await captureEvidence(page, testInfo, 'results')
  await page.getByRole('button', { name: 'Compare' }).click()
  await expect(
    page.getByRole('heading', { name: 'You versus Authored respiratory-educator benchmark' }),
  ).toBeVisible()
  await expect(page.getByRole('list', { name: 'Recent case attempts' })).toBeVisible()
  await captureEvidence(page, testInfo, 'compare')
  console.log(
    `[phase-11-qa] ${testInfo.project.name} automated golden path: ${Date.now() - startedAt} ms`,
  )
})
