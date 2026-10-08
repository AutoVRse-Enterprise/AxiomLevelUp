import { expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { advanceRoundIntro, answerExploreRound, dismissSpatialHint, startRound } from './rounds'

const mucusRound = JSON.parse(
  readFileSync(
    resolve('public/experiences/sanofi/content/rounds/histology-mucus-spot.json'),
    'utf8',
  ),
) as {
  primitive: {
    content: {
      regions: Array<{ id: string; points?: Array<{ x: number; y: number }> }>
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

export async function answerChallengeLookRound(page: Page) {
  await page.getByRole('button', { name: 'Choose my location' }).click()
  for (let index = 0; index < 3; index += 1) {
    await chooseFirstRadio(page)
    await page.getByRole('button', { name: index === 2 ? 'Lock in' : 'Next step' }).click()
  }
  await expect(page.getByRole('button', { name: 'Next round' })).toBeVisible()
}

export async function answerChallengeFindingRound(page: Page, keyboard = false) {
  if (!(await page.getByRole('button', { name: 'Lock in location' }).isVisible())) {
    await startRound(page, 'Lock in location')
  }
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

export async function answerChallengeClinicalRound(page: Page) {
  await advanceRoundIntro(page)
  const answer = page.getByRole('radio', {
    name: 'Asthma exacerbation with type 2 inflammation',
  })
  await expect(answer).toBeVisible()
  await answer.click()
  await page.getByRole('button', { name: 'Lock in' }).click()
}

export async function completeRespiratoryChallenge(
  page: Page,
  moves: number,
  keyboardFinding = false,
) {
  await startRound(page)
  await dismissSpatialHint(page)
  await answerChallengeLookRound(page)
  await page.getByRole('button', { name: 'Next round' }).click()

  await startRound(page)
  await answerExploreRound(page, moves)
  await page.getByRole('button', { name: 'Next round' }).click()

  await answerChallengeFindingRound(page, keyboardFinding)
  await page.getByRole('button', { name: 'Next round' }).click()

  await answerChallengeClinicalRound(page)
  await page.getByRole('button', { name: 'See your score' }).click()
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
}
