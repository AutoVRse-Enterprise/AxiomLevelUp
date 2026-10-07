import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { expectNoAxeViolations, expectNoDocumentHorizontalOverflow } from '../helpers/accessibility'
import {
  advanceRoundIntro,
  answerExploreRound,
  dismissSpatialHint,
  startRound,
} from './helpers/rounds'

const forbiddenVocabulary =
  /\b(?:sanofi|course|lesson|learning path|training module|curriculum|learning objective|complete lesson|certification|course progress|continue learning|assessment|pass|fail|grade|learning outcome|course completed|xp)\b/i

const mucusRound = JSON.parse(
  readFileSync(
    resolve('public/experiences/sanofi/content/rounds/histology-mucus-spot.json'),
    'utf8',
  ),
) as {
  primitive: {
    content: {
      regions: Array<{
        id: string
        points?: Array<{ x: number; y: number }>
      }>
      targetRegionIds: string[]
    }
  }
}
const mucusTarget = mucusRound.primitive.content.regions.find(({ id }) =>
  mucusRound.primitive.content.targetRegionIds.includes(id),
)
if (!mucusTarget?.points?.length) throw new Error('The mucus target polygon is unavailable.')
const mucusTargetPoint = {
  x: mucusTarget.points.reduce((total, point) => total + point.x, 0) / mucusTarget.points.length,
  y: mucusTarget.points.reduce((total, point) => total + point.y, 0) / mucusTarget.points.length,
}

async function chooseFirstRadio(page: Page) {
  const radio = page.getByRole('radio').first()
  await radio.click()
  await expect(radio).toBeChecked()
}

async function answerLookRound(page: Page) {
  await page.getByRole('button', { name: 'I know where I am' }).click()
  for (let index = 0; index < 3; index += 1) {
    await chooseFirstRadio(page)
    await page.getByRole('button', { name: index === 2 ? 'Lock in' : 'Next step' }).click()
  }
  await expect(page.getByRole('button', { name: 'Next round' })).toBeVisible()
}

async function answerFindingRound(page: Page, keyboard = false) {
  await startRound(page, 'Lock in location')
  const compare = page.getByRole('button', { name: 'Compare with healthy' })
  if (await compare.isVisible()) {
    await compare.click()
    await expect(page.getByRole('heading', { name: 'Healthy reference' })).toBeVisible()
    await page.getByRole('button', { name: 'Return to finding' }).click()
  }
  await page.getByRole('button', { name: 'Zoom in' }).click()
  const viewer = page.getByRole('button', { name: /Interactive image viewer/ })
  if (keyboard) {
    await viewer.focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
  } else {
    const box = await viewer.boundingBox()
    if (!box) throw new Error('Finding viewer has no bounding box.')
    await page.mouse.click(
      box.x + box.width * mucusTargetPoint.x,
      box.y + box.height * mucusTargetPoint.y,
    )
    await page.getByRole('button', { name: 'Lock in location' }).click()
  }
  await expect(page.getByText('Compare your marker with the highlighted target.')).toBeVisible()
}

async function answerClinicalRound(page: Page) {
  await advanceRoundIntro(page)
  await expect(
    page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }),
  ).toBeVisible()
  await page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }).click()
  await page.getByRole('button', { name: 'Lock in' }).click()
}

for (const [difficulty, moves] of [
  ['warmup', 5],
  ['challenge', 3],
  ['expert', 2],
] as const) {
  test(`completes the Respiratory Challenge on ${difficulty}`, async ({ page }, testInfo) => {
    test.slow()
    await page.goto(`/play/respiratory-challenge?difficulty=${difficulty}&seed=1801`)

    await startRound(page)
    await dismissSpatialHint(page)
    await answerLookRound(page)
    await page.getByRole('button', { name: 'Next round' }).click()

    await startRound(page)
    await answerExploreRound(page, moves)
    await page.getByRole('button', { name: 'Next round' }).click()

    await answerFindingRound(
      page,
      difficulty === 'expert' && testInfo.project.name === 'desktop-chromium',
    )
    await page.getByRole('button', { name: 'Next round' }).click()

    await answerClinicalRound(page)
    await page.getByRole('button', { name: 'See your score' }).click()

    await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible()
    await page.getByRole('button', { name: 'Credits' }).click()
    await expect(page.getByRole('dialog', { name: 'Credits' })).toBeVisible()
    await expectNoDocumentHorizontalOverflow(page, `${difficulty} challenge result`)
    await expectNoAxeViolations(page, `${difficulty} challenge result`)
    expect(await page.locator('body').innerText()).not.toMatch(forbiddenVocabulary)
  })
}

test('completes both additional playable formats', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'One format composition check is enough.')
  test.slow()

  await page.goto('/play/anatomy-hunt?difficulty=warmup&seed=1802')
  await startRound(page)
  await dismissSpatialHint(page)
  await answerLookRound(page)
  await page.getByRole('button', { name: 'Next round' }).click()
  for (let index = 0; index < 2; index += 1) {
    await startRound(page)
    await answerExploreRound(page, 5)
    await page.getByRole('button', { name: index === 1 ? 'See your score' : 'Next round' }).click()
  }
  await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible()

  await page.goto('/play/spot-the-finding?difficulty=challenge&seed=1803')
  for (let index = 0; index < 3; index += 1) {
    await startRound(page, 'Lock in location')
    const viewer = page.getByRole('button', { name: /Interactive image viewer/ })
    const box = await viewer.boundingBox()
    if (!box) throw new Error('Finding viewer has no bounding box.')
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5)
    await page.getByRole('button', { name: 'Lock in location' }).click()
    await page.getByRole('button', { name: index === 2 ? 'See your score' : 'Next round' }).click()
  }
  await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible()
})

test('records paced challenge durations for every difficulty', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop-chromium',
    'Desktop records canonical timing evidence.',
  )
  test.slow()
  await page.clock.install()
  const evidence: Array<{
    difficulty: string
    limitsSeconds: number[]
    intendedActiveSeconds: number
    persistedDurationSeconds: number
    revealDwellSeconds: number
    pacedWallSeconds: number
  }> = []

  for (const [difficulty, moves, limits] of [
    ['warmup', 5, [50, 70, 40, 55]],
    ['challenge', 3, [40, 60, 30, 45]],
    ['expert', 2, [30, 45, 25, 35]],
  ] as const) {
    await page.goto(`/play/respiratory-challenge?difficulty=${difficulty}&seed=1818`)

    await startRound(page)
    await dismissSpatialHint(page)
    await page.clock.fastForward(limits[0] * 800)
    await answerLookRound(page)
    await page.clock.fastForward(5_000)
    await page.getByRole('button', { name: 'Next round' }).click()

    await startRound(page)
    await page.clock.fastForward(limits[1] * 800)
    await answerExploreRound(page, moves)
    await page.clock.fastForward(5_000)
    await page.getByRole('button', { name: 'Next round' }).click()

    await startRound(page, 'Lock in location')
    await page.clock.fastForward(limits[2] * 800)
    const viewer = page.getByRole('button', { name: /Interactive image viewer/ })
    const box = await viewer.boundingBox()
    if (!box) throw new Error('Finding viewer has no bounding box.')
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.52)
    await page.getByRole('button', { name: 'Lock in location' }).click()
    await page.clock.fastForward(5_000)
    await page.getByRole('button', { name: 'Next round' }).click()

    await advanceRoundIntro(page)
    await expect(
      page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }),
    ).toBeVisible()
    await page.clock.fastForward(limits[3] * 800)
    await page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }).click()
    await page.getByRole('button', { name: 'Lock in' }).click()
    await page.clock.fastForward(5_000)
    await page.getByRole('button', { name: 'See your score' }).click()

    const intendedActiveSeconds = limits.reduce((total, limit) => total + limit * 0.8, 0)
    const durationText = await page
      .getByText('Time', { exact: true })
      .locator('..')
      .locator('dd')
      .innerText()
    const persistedDurationSeconds = Number.parseInt(durationText, 10)
    expect(persistedDurationSeconds).toBeGreaterThanOrEqual(intendedActiveSeconds)
    expect(persistedDurationSeconds).toBeLessThanOrEqual(intendedActiveSeconds + 20)
    evidence.push({
      difficulty,
      limitsSeconds: [...limits],
      intendedActiveSeconds,
      persistedDurationSeconds,
      revealDwellSeconds: 20,
      pacedWallSeconds: intendedActiveSeconds + 20,
    })
  }

  const evidenceDirectory = resolve('docs/qa/evidence/phase-18')
  await mkdir(evidenceDirectory, { recursive: true })
  await writeFile(
    resolve(evidenceDirectory, 'challenge-durations.json'),
    `${JSON.stringify(
      {
        recordedAt: '2026-10-07',
        viewport: { width: 1440, height: 900 },
        paceFraction: 0.8,
        runs: evidence,
      },
      null,
      2,
    )}\n`,
  )
})
