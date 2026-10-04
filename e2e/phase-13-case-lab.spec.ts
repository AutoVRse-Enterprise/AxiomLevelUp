import { expect, test } from '@playwright/test'

import {
  loadCase,
  resetDemo,
  runCaseThroughEveryState,
} from './helpers/case-driver'

const advancedCase = loadCase('exacerbation-advanced')

test.beforeEach(async ({ page }) => {
  await resetDemo(page)
})

test('P13-T14: completes the advanced case through visible controls without the anatomy bridge', async ({
  page,
}) => {
  test.slow()
  test.setTimeout(180_000)
  let checkedSteps = 0

  await runCaseThroughEveryState(page, advancedCase, async (state) => {
    if (state.includes(':step-') && !state.endsWith('-complete') && !state.includes(':level-')) {
      checkedSteps += 1
    }
  })

  expect(checkedSteps).toBe(9)
  await expect(page.getByRole('heading', { name: 'You versus Model answer' })).toBeVisible()
})

test('P13-T14: matches the desktop guided-case golden route', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop golden baselines only.')
  test.slow()
  test.setTimeout(180_000)

  const goldenStates = new Map([
    ['exacerbation-advanced:intro', '01-mission-briefing.png'],
    ['exacerbation-advanced:step-exac-explore-airway', '02-spatial-reconstruction.png'],
    ['exacerbation-advanced:step-exac-explore-airway-complete', '03-finding-feedback.png'],
    ['exacerbation-advanced:step-exac-localise', '04-localisation.png'],
    ['exacerbation-advanced:step-exac-differential-observe', '05-differential.png'],
    ['exacerbation-advanced:step-exac-cite-evidence', '06-evidence-citation.png'],
    ['exacerbation-advanced:results', '07-prioritized-debrief.png'],
    ['exacerbation-advanced:compare', '08-model-answer.png'],
  ])

  await runCaseThroughEveryState(page, advancedCase, async (state) => {
    const name = goldenStates.get(state)
    if (!name) return
    await expect(page).toHaveScreenshot(name, {
      animations: 'disabled',
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    })
  }, { caseSeed: 13 })
})
