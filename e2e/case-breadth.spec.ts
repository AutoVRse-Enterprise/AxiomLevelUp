import { expect, test, type Page, type TestInfo } from '@playwright/test'

import type { AnatomyTestSnapshot } from '../src/anatomy3d/viewer/controller'
import {
  completeCaseStep,
  dismissCelebrations,
  loadCase,
  resetDemo,
  type CaseDocumentFixture,
  type CaseStep,
} from './helpers/case-driver'
import { capturePhase12Evidence } from './helpers/evidence'

const breadthCaseIds = ['asthma-foundation', 'copd-intermediate', 'wheeze-quick'] as const

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

async function activateProjectedStructure(page: Page, testInfo: TestInfo, structureId: string) {
  let target: { clientX: number; clientY: number } | undefined
  await expect
    .poll(
      async () => {
        target = (await anatomySnapshot(page)).structures.find(
          ({ id, visible }) => id === structureId && visible,
        )
        return Boolean(target)
      },
      { intervals: [150, 250, 400, 600], timeout: 15_000 },
    )
    .toBe(true)
  if (testInfo.project.name === 'touch-phone-chromium') {
    await page.touchscreen.tap(target!.clientX, target!.clientY)
  } else {
    await page.mouse.click(target!.clientX, target!.clientY)
  }
}

async function chooseFromList(page: Page, label: string) {
  const summary = page.getByText('Choose from list')
  const details = summary.locator('xpath=..')
  if ((await details.getAttribute('open')) === null) await summary.click()
  await page.getByRole('button', { name: label, exact: true }).click()
}

async function inspectFinding(page: Page, label: string) {
  const summary = page.getByText('Inspect spatial findings')
  const details = summary.locator('xpath=..')
  if ((await details.getAttribute('open')) === null) await summary.click()
  await page.getByRole('button', { name: label, exact: true }).click()
}

async function completeBreadthExplore(page: Page, caseDoc: CaseDocumentFixture) {
  const requirements = caseDoc.stages[0]?.steps[0]?.content
  const structureId = requirements?.requiredStructureIds?.[0]
  const findingId = requirements?.requiredFindingIds?.[0]
  if (!structureId || !findingId) throw new Error(`${caseDoc.id} lacks exploration requirements.`)

  const snapshot = await anatomySnapshot(page)
  expect(snapshot.renderer.webglVersion).toBeGreaterThanOrEqual(1)
  expect(snapshot.renderer.renderer).not.toHaveLength(0)
  if (caseDoc.entry.mode === 'overview_marker') {
    expect(snapshot.markers.some(({ visible }) => visible)).toBe(true)
  }
  const structureLabel = structureId === 'left-upper-lobe' ? 'Left upper lobe' : 'Right upper lobe'
  await chooseFromList(page, structureLabel)

  const finding = caseDoc.findings?.find(({ id }) => id === findingId)
  await inspectFinding(page, finding?.label ?? findingId)
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible()
}

async function completeFoundationLocalisation(page: Page, testInfo: TestInfo) {
  await activateProjectedStructure(page, testInfo, 'right-upper-lobe')
  await page.getByRole('button', { name: 'Next level' }).click()
  await activateProjectedStructure(page, testInfo, 'right-upper-apical-segment')
  await expect(page.getByText('Apical segment selected')).toBeAttached()
  await capturePhase12Evidence(page, testInfo, 'case-foundation-state')
  await page.getByRole('button', { name: 'Next level' }).click()
  await page.getByRole('radio', { name: 'Bronchiole', exact: true }).check()
  await page.getByRole('button', { name: 'Commit your localisation' }).click()
}

async function completeBreadthCase(page: Page, testInfo: TestInfo, caseDoc: CaseDocumentFixture) {
  const startedAt = Date.now()
  await page.goto(`/learn/cases/${caseDoc.id}`)
  await expect(page.getByRole('heading', { name: caseDoc.title })).toBeVisible()
  await page.getByRole('link', { name: 'Start case' }).click()

  for (const [stageIndex, stage] of caseDoc.stages.entries()) {
    if (stageIndex === 0 && caseDoc.entry.mode === 'clue_first') {
      await expect(
        page.getByText('Distal air-space architecture', { exact: true }).first(),
      ).toBeVisible()
      await expect(
        page.getByRole('img', {
          name: 'Illustrative histology showing enlarged distal air spaces and reduced alveolar walls.',
        }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Close' }).click()
    }

    for (const step of stage.steps) {
      if (step.type === 'anatomy_explore') {
        await completeBreadthExplore(page, caseDoc)
        if (caseDoc.id === 'wheeze-quick') {
          await capturePhase12Evidence(page, testInfo, 'case-quick-state')
        }
      } else if (caseDoc.id === 'asthma-foundation' && step.id === 'foundation-localise') {
        await completeFoundationLocalisation(page, testInfo)
      } else {
        if (step.id === 'intermediate-differential') {
          await expect(
            page.getByText(
              'COPD is best supported, while asthma, bronchiectasis and heart failure',
            ),
          ).toBeVisible()
          await expect(page.getByText('Wheeze alone proves asthma')).toBeVisible()
          await capturePhase12Evidence(page, testInfo, 'case-intermediate-state')
        }
        await completeCaseStep(page, caseDoc, step as CaseStep, async () => undefined)
      }
      await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Continue', exact: true }).click()
    }
  }

  await expect(page.getByText('Case complete')).toBeVisible()
  await dismissCelebrations(page)
  const evidenceName =
    caseDoc.id === 'asthma-foundation'
      ? 'foundation'
      : caseDoc.id === 'copd-intermediate'
        ? 'intermediate'
        : 'quick'
  await capturePhase12Evidence(page, testInfo, `case-${evidenceName}-results`)
  await page.getByRole('button', { name: 'Compare' }).click()
  await expect(page.getByText('Attempt comparison')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'You versus Authored respiratory-educator benchmark' }),
  ).toBeVisible()
  await capturePhase12Evidence(page, testInfo, `case-${evidenceName}-compare`)
  console.log(
    `[phase-12-breadth] ${testInfo.project.name} ${caseDoc.id}: ${Date.now() - startedAt} ms`,
  )
}

test.beforeEach(async ({ page }) => {
  await resetDemo(page)
})

for (const caseId of breadthCaseIds) {
  test(`P12-T11: completes ${caseId} through configured breadth`, async ({ page }, testInfo) => {
    test.setTimeout(180_000)
    await completeBreadthCase(page, testInfo, loadCase(caseId))
  })
}
