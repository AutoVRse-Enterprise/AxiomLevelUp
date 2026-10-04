import { expect, test, type Page, type TestInfo } from '@playwright/test'

import {
  loadCase,
  resetDemo,
  runCaseThroughEveryState,
  type CaseDocumentFixture,
} from './helpers/case-driver'
import { capturePhase12Evidence } from './helpers/evidence'

const breadthCaseIds = ['asthma-foundation', 'copd-intermediate', 'wheeze-quick'] as const

async function completeBreadthCase(page: Page, testInfo: TestInfo, caseDoc: CaseDocumentFixture) {
  const startedAt = Date.now()
  const evidenceName =
    caseDoc.id === 'asthma-foundation'
      ? 'foundation'
      : caseDoc.id === 'copd-intermediate'
        ? 'intermediate'
        : 'quick'
  await runCaseThroughEveryState(page, caseDoc, async (state) => {
    if (state === 'foundation-localise:level-3') {
      await capturePhase12Evidence(page, testInfo, 'case-foundation-state')
    }
    if (state === 'copd-intermediate:step-intermediate-differential') {
      await expect(
        page.getByText('COPD is best supported, while asthma, bronchiectasis and heart failure'),
      ).toBeVisible()
      await expect(page.getByText('Wheeze alone proves asthma')).toBeVisible()
      await capturePhase12Evidence(page, testInfo, 'case-intermediate-state')
    }
    if (state === 'wheeze-quick:step-quick-explore-complete') {
      await capturePhase12Evidence(page, testInfo, 'case-quick-state')
    }
    if (state === `${caseDoc.id}:results`) {
      await capturePhase12Evidence(page, testInfo, `case-${evidenceName}-results`)
    }
    if (state === `${caseDoc.id}:compare`) {
      await capturePhase12Evidence(page, testInfo, `case-${evidenceName}-compare`)
    }
  })
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
