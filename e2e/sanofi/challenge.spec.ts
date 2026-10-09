import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { expectNoAxeViolations, expectNoDocumentHorizontalOverflow } from '../helpers/accessibility'
import {
  answerChallengeCtRound,
  answerChallengeLookRound,
  completeRespiratoryChallenge,
} from './helpers/challengeFlow'
import {
  advanceRoundIntro,
  answerExploreRound,
  dismissSpatialHint,
  startRound,
} from './helpers/rounds'

const forbiddenVocabulary =
  /\b(?:sanofi|course|lesson|learning path|training module|curriculum|learning objective|complete lesson|certification|course progress|continue learning|assessment|pass|fail|grade|learning outcome|course completed|xp)\b/i

for (const [difficulty, moves] of [
  ['warmup', 5],
  ['challenge', 4],
  ['expert', 3],
] as const) {
  test(`completes the Respiratory Challenge on ${difficulty}`, async ({ page }, testInfo) => {
    test.slow()
    await page.goto(`/play/respiratory-challenge?difficulty=${difficulty}&seed=1801`)

    await completeRespiratoryChallenge(
      page,
      moves,
      difficulty === 'expert' && testInfo.project.name === 'desktop-chromium',
    )
    await page.getByRole('button', { name: 'Credits' }).click()
    await expect(page.getByRole('dialog', { name: 'Credits' })).toBeVisible()
    await expectNoDocumentHorizontalOverflow(page, `${difficulty} challenge result`)
    await expectNoAxeViolations(page, `${difficulty} challenge result`)
    expect(await page.locator('body').innerText()).not.toMatch(forbiddenVocabulary)
  })
}

test('completes both additional playable formats', async ({ page }) => {
  test.slow()

  await page.goto('/play/anatomy-hunt?difficulty=warmup&seed=1802')
  await startRound(page)
  await dismissSpatialHint(page)
  await answerChallengeLookRound(page)
  await page.getByRole('button', { name: 'Next round' }).click()
  for (let index = 0; index < 2; index += 1) {
    await startRound(page)
    await answerExploreRound(page, 5)
    await page.getByRole('button', { name: index === 1 ? 'See your score' : 'Next round' }).click()
  }
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()

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
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
})

test('records paced challenge durations for every difficulty', async ({ page }, testInfo) => {
  test.skip(
    process.env.RUN_PHASE20_REHEARSAL !== '1',
    'Evidence-only rehearsal; set RUN_PHASE20_REHEARSAL=1 explicitly.',
  )
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
    ['warmup', 5, [65, 80, 55, 90, 75]],
    ['challenge', 4, [60, 80, 50, 75, 70]],
    ['expert', 3, [50, 65, 40, 60, 60]],
  ] as const) {
    await page.goto(`/play/respiratory-challenge?difficulty=${difficulty}&seed=1818`)

    await startRound(page)
    await dismissSpatialHint(page)
    await page.clock.fastForward(limits[0] * 800)
    await answerChallengeLookRound(page)
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

    await startRound(page, 'Lock in')
    await page.clock.fastForward(limits[3] * 800)
    await answerChallengeCtRound(page)
    await page.clock.fastForward(5_000)
    await page.getByRole('button', { name: 'Next round' }).click()

    await advanceRoundIntro(page)
    await expect(
      page.getByRole('radio', { name: 'Asthma exacerbation with type 2 inflammation' }),
    ).toBeVisible()
    await page.clock.fastForward(limits[4] * 800)
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
    expect(persistedDurationSeconds).toBeLessThanOrEqual(intendedActiveSeconds + 25)
    evidence.push({
      difficulty,
      limitsSeconds: [...limits],
      intendedActiveSeconds,
      persistedDurationSeconds,
      revealDwellSeconds: 25,
      pacedWallSeconds: intendedActiveSeconds + 25,
    })
  }

  const evidenceDirectory = resolve('docs/qa/evidence/phase-20')
  await mkdir(evidenceDirectory, { recursive: true })
  await writeFile(
    resolve(evidenceDirectory, 'rehearsal-timing.json'),
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
