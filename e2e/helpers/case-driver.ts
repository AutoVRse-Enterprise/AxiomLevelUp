import { readFileSync } from 'node:fs'
import path from 'node:path'

import { expect, type Page } from '@playwright/test'

type CheckState = (label: string) => Promise<void>

interface Choice {
  id: string
  label: string
  categoryId?: string
  next?: string
  score?: number
}

export interface CaseStep {
  id: string
  type: string
  content: {
    answer?: boolean
    correctOptionId?: string
    correctOptionIds?: string[]
    options?: Choice[]
    items?: Choice[]
    categories?: Choice[]
    levels?: Array<{
      levelId: string
      input: 'model' | 'choice' | 'image'
      targetStructureId?: string
      targetRegionId?: string
      correctOptionId?: string
      options?: Choice[]
      regions?: Choice[]
    }>
    nodes?: Array<{
      id: string
      type: 'context' | 'decision' | 'outcome'
      next?: string
      choices?: Choice[]
    }>
    startNodeId?: string
    requiredStructureIds?: string[]
    requiredWaypointIds?: string[]
    requiredFindingIds?: string[]
  }
}

export interface CaseDocumentFixture {
  id: string
  title: string
  findings?: Array<{ id: string; label: string }>
  entry: {
    mode: string
    waypointId?: string
    candidateWaypointIds?: string[]
    neutralLabels?: boolean
  }
  stages: Array<{ id: string; title: string; steps: CaseStep[] }>
}

interface AnatomyMapFixture {
  structures: Array<{ id: string; label: string }>
  waypoints: Array<{ id: string; label: string; neutralLabel?: string; next?: string[] }>
}

export const caseIds = [
  'asthma-foundation',
  'copd-intermediate',
  'exacerbation-advanced',
  'wheeze-quick',
] as const

export function loadCase(caseId: (typeof caseIds)[number]): CaseDocumentFixture {
  return JSON.parse(
    readFileSync(path.resolve(`public/content/cases/${caseId}.json`), 'utf8'),
  ) as CaseDocumentFixture
}

const anatomyMap = JSON.parse(
  readFileSync(path.resolve('public/content/anatomy/lung-map.json'), 'utf8'),
) as AnatomyMapFixture

const structureLabels = new Map(anatomyMap.structures.map(({ id, label }) => [id, label]))
const waypointLabels = new Map(anatomyMap.waypoints.map(({ id, label }) => [id, label]))

async function chooseStructure(page: Page, structureId: string) {
  const list = page.getByText('Choose from list')
  const details = list.locator('xpath=..')
  if ((await details.getAttribute('open')) === null) await list.click()
  await page
    .getByRole('button', { name: structureLabels.get(structureId) ?? structureId, exact: true })
    .click()
}

function waypointPath(startId: string, targetId: string) {
  const queue: Array<{ id: string; path: string[] }> = [{ id: startId, path: [] }]
  const visited = new Set([startId])
  while (queue.length) {
    const current = queue.shift()!
    if (current.id === targetId) return current.path
    const waypoint = anatomyMap.waypoints.find(({ id }) => id === current.id)
    for (const next of waypoint?.next ?? []) {
      if (visited.has(next)) continue
      visited.add(next)
      queue.push({ id: next, path: [...current.path, next] })
    }
  }
  throw new Error(`No waypoint path from ${startId} to ${targetId}`)
}

async function completeExplore(page: Page, caseDoc: CaseDocumentFixture, step: CaseStep) {
  for (const structureId of step.content.requiredStructureIds ?? []) {
    await chooseStructure(page, structureId)
  }
  for (const waypointId of step.content.requiredWaypointIds ?? []) {
    if (caseDoc.entry.mode === 'unknown_waypoint') {
      const backToTarget = page.getByRole('button', { name: 'Back to Posterior branch', exact: true })
      if (await backToTarget.isVisible().catch(() => false)) await backToTarget.click()
      continue
    }
    for (const nextId of waypointPath(caseDoc.entry.waypointId ?? 'trachea-mid', waypointId)) {
      await page
        .getByRole('button', { name: waypointLabels.get(nextId) ?? nextId, exact: true })
        .click()
    }
  }
  for (const findingId of step.content.requiredFindingIds ?? []) {
    const details = page.getByText('Inspect findings').locator('xpath=..')
    if ((await details.getAttribute('open')) === null)
      await page.getByText('Inspect findings').click()
    const finding = caseDoc.findings?.find(({ id }) => id === findingId)
    await page.getByRole('button', { name: finding?.label ?? findingId, exact: true }).click()
  }
}

async function completeLocate(page: Page, step: CaseStep, checkState: CheckState) {
  for (const [index, level] of (step.content.levels ?? []).entries()) {
    await checkState(`${step.id}:level-${index + 1}`)
    if (level.input === 'model') {
      await chooseStructure(page, level.targetStructureId!)
    } else {
      const choices = level.input === 'choice' ? level.options : level.regions
      const targetId = level.input === 'choice' ? level.correctOptionId : level.targetRegionId
      const target = choices?.find(({ id }) => id === targetId)
      await page.getByRole('radio', { name: target?.label ?? targetId, exact: true }).check()
    }
    await page
      .getByRole('button', {
        name:
          index === (step.content.levels?.length ?? 0) - 1
            ? 'Commit your localisation'
            : 'Next level',
      })
      .click()
  }
}

async function completeScenario(page: Page, step: CaseStep, checkState: CheckState) {
  const nodes = new Map(step.content.nodes?.map((node) => [node.id, node]))
  let node = nodes.get(step.content.startNodeId ?? '')
  let guard = (step.content.nodes?.length ?? 0) + 2
  while (node && guard > 0) {
    await checkState(`${step.id}:scenario-${node.id}`)
    if (node.type === 'context') {
      await page.getByRole('button', { name: 'Continue', exact: true }).click()
      node = nodes.get(node.next ?? '')
    } else if (node.type === 'decision') {
      const decision = node
      const choice =
        decision.choices?.find(
          ({ score }) =>
            score === Math.max(...(decision.choices ?? []).map((item) => item.score ?? 0)),
        ) ?? decision.choices?.[0]
      await page.getByRole('button', { name: choice!.label, exact: true }).click()
      await checkState(`${step.id}:scenario-${decision.id}-consequence`)
      await page.getByRole('button', { name: 'Continue', exact: true }).click()
      node = nodes.get(choice?.next ?? '')
    } else {
      await page.getByRole('button', { name: 'Complete scenario' }).click()
      return
    }
    guard -= 1
  }
  throw new Error(`Scenario ${step.id} did not reach an outcome.`)
}

export async function completeCaseStep(
  page: Page,
  caseDoc: CaseDocumentFixture,
  step: CaseStep,
  checkState: CheckState,
) {
  if (step.type === 'anatomy_explore') {
    await completeExplore(page, caseDoc, step)
    return
  }
  if (step.type === 'anatomy_locate') {
    await completeLocate(page, step, checkState)
    return
  }
  if (step.type === 'multiple_choice') {
    const option = step.content.options?.find(({ id }) => id === step.content.correctOptionId)
    await page.getByRole('radio', { name: option!.label, exact: true }).check()
    await page.getByRole('button', { name: 'Check answer' }).click()
    return
  }
  if (step.type === 'multiple_select') {
    for (const optionId of step.content.correctOptionIds ?? []) {
      const option = step.content.options?.find(({ id }) => id === optionId)
      await page.getByRole('checkbox', { name: option!.label, exact: true }).check()
    }
    await page.getByRole('button', { name: 'Check answer' }).click()
    return
  }
  if (step.type === 'classification') {
    for (const item of step.content.items ?? []) {
      const category = step.content.categories?.find(({ id }) => id === item.categoryId)
      await page.getByRole('button', { name: item.label, exact: true }).click()
      await page.getByRole('button', { name: category!.label, exact: true }).click()
    }
    await page.getByRole('button', { name: 'Check answer' }).click()
    return
  }
  if (step.type === 'true_false') {
    await page
      .getByRole('radio', { name: step.content.answer ? 'True' : 'False', exact: true })
      .check()
    await page.getByRole('button', { name: 'Check answer' }).click()
    return
  }
  if (step.type === 'scenario') {
    await completeScenario(page, step, checkState)
    return
  }
  throw new Error(`No Playwright case driver for ${step.type} (${step.id}).`)
}

export async function resetDemo(page: Page) {
  await page.goto('/dev')
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.getByText('Advanced seed applied.')).toBeVisible()
}

export async function dismissCelebrations(page: Page) {
  for (let index = 0; index < 5; index += 1) {
    const dialog = page.getByRole('dialog')
    const appeared = await dialog
      .waitFor({ state: 'visible', timeout: index === 0 ? 2_000 : 500 })
      .then(() => true)
      .catch(() => false)
    if (!appeared) return
    await dialog.getByRole('button', { name: 'Continue' }).click()
  }
}

export async function runCaseThroughEveryState(
  page: Page,
  caseDoc: CaseDocumentFixture,
  checkState: CheckState,
) {
  await page.goto(`/learn/cases/${caseDoc.id}`)
  await expect(page.getByRole('heading', { name: caseDoc.title })).toBeVisible()
  await checkState(`${caseDoc.id}:intro`)
  await page.getByRole('link', { name: 'Start case' }).click()

  for (const stage of caseDoc.stages) {
    await expect(page.getByRole('heading', { name: stage.title })).toBeVisible()
    await checkState(`${caseDoc.id}:stage-${stage.id}`)
    const clueClose = page.getByRole('button', { name: 'Close' })
    if (await clueClose.isVisible()) {
      await checkState(`${caseDoc.id}:entry-clue`)
      await clueClose.click()
    }
    for (const step of stage.steps) {
      await checkState(`${caseDoc.id}:step-${step.id}`)
      await completeCaseStep(page, caseDoc, step, checkState)
      await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible()
      await checkState(`${caseDoc.id}:step-${step.id}-complete`)
      await page.getByRole('button', { name: 'Continue', exact: true }).click()
    }
  }

  await expect(page.getByText('Case complete')).toBeVisible()
  await dismissCelebrations(page)
  await checkState(`${caseDoc.id}:results`)
  await page.getByRole('button', { name: 'Compare' }).click()
  await expect(page.getByText('Attempt comparison')).toBeVisible()
  await checkState(`${caseDoc.id}:compare`)
}
