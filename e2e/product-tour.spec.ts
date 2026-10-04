import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

import { dismissCelebrations, resetDemo, reviewClue } from './helpers/case-driver'
import { capturePhase12Evidence } from './helpers/evidence'

const rehearsalPauseMs = Number(process.env.P12_REHEARSAL_PACE_MS ?? 0)

async function presenterPause(page: Page) {
  if (rehearsalPauseMs > 0) await page.waitForTimeout(rehearsalPauseMs)
}

async function waitForDicom(viewer: Locator) {
  await expect(viewer.getByRole('slider', { name: 'DICOM image viewport' })).toBeVisible({
    timeout: 30_000,
  })
  await expect(viewer.locator('canvas').first()).toBeVisible({ timeout: 30_000 })
  await expect(viewer.getByText('Preparing imaging study')).toHaveCount(0, { timeout: 30_000 })
  await expect(viewer.getByRole('slider', { name: 'Current DICOM slice' })).toBeEnabled({
    timeout: 30_000,
  })
}

async function clickDicomImagePoint(page: Page, viewer: Locator, x: number, y: number) {
  const viewport = viewer.getByRole('slider', { name: 'DICOM image viewport' })
  const box = await viewport.boundingBox()
  expect(box).not.toBeNull()
  const size = Math.min(box!.width, box!.height)
  const left = box!.x + (box!.width - size) / 2
  const top = box!.y + (box!.height - size) / 2
  await page.mouse.click(left + size * x, top + size * y)
}

async function dragDicomImageLine(
  page: Page,
  viewer: Locator,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const viewport = viewer.getByRole('slider', { name: 'DICOM image viewport' })
  const box = await viewport.boundingBox()
  expect(box).not.toBeNull()
  const size = Math.min(box!.width, box!.height)
  const left = box!.x + (box!.width - size) / 2
  const top = box!.y + (box!.height - size) / 2
  await page.mouse.move(left + size * start.x, top + size * start.y)
  await page.mouse.down()
  await page.mouse.move(left + size * end.x, top + size * end.y, { steps: 12 })
  await page.mouse.up()
}

async function createTargetMeasurement(page: Page, viewer: Locator) {
  const center = 0.502
  const normalizedWidth = (page.viewportSize()?.width ?? 1440) <= 500 ? 0.037 : 0.0395
  await dragDicomImageLine(
    page,
    viewer,
    { x: center - normalizedWidth / 2, y: 0.466797 },
    { x: center + normalizedWidth / 2, y: 0.466797 },
  )
}

async function continueCurrentStep(page: Page) {
  const button = page.getByRole('button', { name: 'Continue', exact: true })
  if (!(await button.isVisible())) {
    const openInstructions = page.getByRole('button', { name: 'Open activity instructions' })
    if (await openInstructions.isVisible()) await openInstructions.click()
  }
  await expect(button).toBeVisible()
  await button.click()
}

async function revealDicomInstructions(page: Page, action: Locator) {
  if (await action.isVisible()) return
  await page.getByRole('button', { name: 'Open activity instructions' }).click()
  await expect(action).toBeVisible()
}

async function completeThoracicLesson(page: Page, testInfo: TestInfo) {
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Inspect before interpreting' })).toBeVisible()
  await continueCurrentStep(page)
  await expect(
    page.getByRole('heading', {
      name: /Interpreting Thoracic CT: Image — Use bilateral comparison/,
    }),
  ).toBeVisible()
  await continueCurrentStep(page)

  await page
    .getByRole('radio', { name: 'Confirm the display window and image quality', exact: true })
    .check()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await continueCurrentStep(page)

  const viewer = page.locator('[data-dicom-viewer]')
  await waitForDicom(viewer)
  await viewer.getByRole('button', { name: 'Mediastinal', exact: true }).click()
  await viewer.getByRole('button', { name: 'Lung', exact: true }).click()
  const viewport = viewer.getByRole('slider', { name: 'Current DICOM slice' })
  await viewport.fill('82')
  await expect(viewport).toHaveValue('82')
  await presenterPause(page)
  await capturePhase12Evidence(page, testInfo, 'tour-lesson-dicom', false)
  await continueCurrentStep(page)

  await expect(page.getByText('Activity complete')).toBeVisible()
  await expect(page.getByLabel('Completion outcomes')).toContainText('XP awarded')
  await expect(page.getByLabel('Completion outcomes')).toContainText('stars')
  await expect(page.getByLabel('Completion outcomes')).toContainText('mastery')
  await capturePhase12Evidence(page, testInfo, 'tour-lesson-complete')
  console.log(`[phase-12-tour] ${testInfo.project.name} lesson complete`)
}

async function completeDicomLab(page: Page, testInfo: TestInfo) {
  await page.goto('/learn/courses/scientific-imaging/lessons/dicom-lab')
  await expect(page.getByRole('heading', { name: 'Imaging Lab' })).toBeVisible()
  await page.getByRole('button', { name: 'Start', exact: true }).click()

  let viewer = page.locator('[data-dicom-viewer]')
  await waitForDicom(viewer)
  await viewer.getByRole('button', { name: 'Mediastinal', exact: true }).click()
  const slice = viewer.getByRole('slider', { name: 'Current DICOM slice' })
  await slice.fill('81')
  await expect(slice).toHaveValue('81')
  await page.waitForTimeout(350)
  const done = page.getByRole('button', { name: 'Done', exact: true })
  await revealDicomInstructions(page, done)
  await done.click()
  await page.getByRole('radio', { name: 'Trachea', exact: true }).click()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await continueCurrentStep(page)

  viewer = page.locator('[data-dicom-viewer]')
  await waitForDicom(viewer)
  await clickDicomImagePoint(page, viewer, 0.5009, 0.4668)
  const checkLocation = page.getByRole('button', { name: 'Check location' })
  await capturePhase12Evidence(page, testInfo, 'tour-dicom-region', false)
  await revealDicomInstructions(page, checkLocation)
  await expect(page.getByText('Marker placed on slice 81').last()).toBeVisible()
  await checkLocation.click()
  await continueCurrentStep(page)

  viewer = page.locator('[data-dicom-viewer]')
  await waitForDicom(viewer)
  await viewer.getByRole('button', { name: 'Measure', exact: true }).click()
  await createTargetMeasurement(page, viewer)
  const checkMeasurement = page.getByRole('button', { name: 'Check measurement' })
  await revealDicomInstructions(page, checkMeasurement)
  await expect(page.getByText(/Current measurement:.*mm/).last()).toBeVisible()
  await checkMeasurement.focus()
  await page.keyboard.press('Enter')
  await continueCurrentStep(page)

  await expect(page.getByText('Activity complete')).toBeVisible()
  const outcomes = page.getByLabel('Completion outcomes')
  await expect(outcomes).toContainText('XP awarded')
  await expect(outcomes).toContainText('stars')
  await expect(outcomes).toContainText('mastery')
  await expect(outcomes).not.toContainText('No badge unlocked')
  await presenterPause(page)
  await capturePhase12Evidence(page, testInfo, 'tour-dicom-complete')
  console.log(`[phase-12-tour] ${testInfo.project.name} DICOM lab complete`)
  const badgeDialog = page.getByRole('dialog')
  await expect(badgeDialog.getByText('Imaging Explorer', { exact: true })).toBeVisible({
    timeout: 15_000,
  })
  console.log(`[phase-12-tour] ${testInfo.project.name} badge visible`)
  await badgeDialog.getByRole('button', { name: 'Continue' }).click({ force: true })
  console.log(`[phase-12-tour] ${testInfo.project.name} badge dismissed`)
}

async function completeDailyChallenge(page: Page, testInfo: TestInfo) {
  await page.goto('/challenge', { waitUntil: 'domcontentloaded' })
  console.log(`[phase-12-tour] ${testInfo.project.name} challenge page`)
  await expect(page.getByRole('link', { name: 'Start challenge' })).toBeVisible()
  await page.goto('/challenge/daily-imaging-interpretation/play', {
    waitUntil: 'domcontentloaded',
  })
  await expect(page.getByRole('heading', { name: 'Daily Respiratory Review' })).toBeVisible()
  await page.getByRole('button', { name: 'Start', exact: true }).click()

  await page.getByText('Choose from list').click()
  await page.getByRole('button', { name: 'Left upper lobe', exact: true }).click()
  await page.getByText('Inspect spatial findings').click()
  await page.getByRole('button', { name: 'Diffuse airway-wall change', exact: true }).click()
  await continueCurrentStep(page)
  await page.getByRole('radio', { name: 'Conducting airway', exact: true }).check()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await continueCurrentStep(page)

  for (const clue of ['Trigger pattern', 'Before-and-after flow']) {
    await reviewClue(page, clue)
  }
  await page.getByRole('checkbox', { name: /Trigger pattern/ }).check()
  await page.getByRole('checkbox', { name: /Before-and-after flow/ }).check()
  await page.getByRole('button', { name: 'Cite evidence', exact: true }).click()
  await continueCurrentStep(page)
  await continueCurrentStep(page)
  await page
    .getByRole('button', { name: 'Variable airflow obstruction compatible with asthma' })
    .click()
  await continueCurrentStep(page)
  await page
    .getByRole('button', {
      name: 'It is the best-supported hypothesis for this synthetic case',
    })
    .click()
  await continueCurrentStep(page)
  await page.getByRole('button', { name: 'Complete scenario' }).click()
  await continueCurrentStep(page)

  await expect(page.getByText('Case complete')).toBeVisible()
  await dismissCelebrations(page)
  await expect(page.getByLabel('Completion outcomes')).toContainText('XP awarded')
  await presenterPause(page)
  await capturePhase12Evidence(page, testInfo, 'tour-daily-challenge')
  console.log(`[phase-12-tour] ${testInfo.project.name} daily challenge complete`)
}

test.beforeEach(async ({ page }) => {
  await resetDemo(page)
})

test('P12-T11: PRD section 80 product tour learning and DICOM sequence', async ({
  page,
}, testInfo) => {
  test.setTimeout(rehearsalPauseMs > 0 ? 900_000 : 240_000)
  const startedAt = Date.now()

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Ready for your next discovery?' })).toBeVisible()
  await expect(page.getByText(/Level 7.*4,820 XP/)).toBeVisible()
  await expect(page.getByText('Daily streak')).toBeVisible()
  await presenterPause(page)
  await capturePhase12Evidence(page, testInfo, 'tour-home')

  await page.getByRole('link', { name: 'View pathway' }).click()
  await expect(page.getByRole('heading', { name: 'Translational Science' })).toBeVisible()
  await expect(
    page.getByRole('list', { name: 'Translational Science learning journey' }),
  ).toBeVisible()
  await presenterPause(page)
  await capturePhase12Evidence(page, testInfo, 'tour-pathway')

  await page.getByRole('link').filter({ hasText: 'Interpreting Thoracic CT' }).click()
  await completeThoracicLesson(page, testInfo)
  await presenterPause(page)
  await completeDicomLab(page, testInfo)

  console.log(
    `[phase-12-tour] ${testInfo.project.name} learning sequence ${rehearsalPauseMs > 0 ? 'scripted rehearsal' : 'automated'}: ${Date.now() - startedAt} ms`,
  )
})

test('P12-T11: PRD section 80 product tour engagement sequence', async ({ page }, testInfo) => {
  test.setTimeout(rehearsalPauseMs > 0 ? 900_000 : 240_000)
  page.setDefaultTimeout(15_000)
  const startedAt = Date.now()

  await completeDailyChallenge(page, testInfo)

  await page.goto('/leaderboard')
  await expect(page.getByRole('heading', { name: 'This week' })).toBeVisible()
  await page.getByRole('tab', { name: 'Monthly' }).click()
  await expect(page.getByRole('heading', { name: 'This month' })).toBeVisible()
  await page.getByRole('tab', { name: 'All time' }).click()
  await expect(page.getByRole('heading', { name: 'All-time ranking' })).toBeVisible()
  await presenterPause(page)
  await capturePhase12Evidence(page, testInfo, 'tour-leaderboard')

  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Maya Chen' })).toBeVisible()
  await expect(page.getByText('Level 7')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mastery', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Achievements', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Activity', exact: true })).toBeVisible()
  await expect(
    page
      .locator('div')
      .filter({ hasText: 'Imaging Fundamentals' })
      .filter({ hasText: 'Unlocked' })
      .last(),
  ).toBeVisible()
  await presenterPause(page)
  await capturePhase12Evidence(page, testInfo, 'tour-profile')

  console.log(
    `[phase-12-tour] ${testInfo.project.name} engagement sequence ${rehearsalPauseMs > 0 ? 'scripted rehearsal' : 'automated'}: ${Date.now() - startedAt} ms`,
  )
})
