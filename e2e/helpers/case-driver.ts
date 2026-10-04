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

interface EvidenceChoice {
  kind: 'clue' | 'finding'
  id: string
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
    hypotheses?: Array<{ id: string; label: string }>
    evidence?: EvidenceChoice[]
    correctEvidence?: EvidenceChoice[]
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
  clues: Array<{ id: string; title: string }>
  expertBenchmark: { responses: Record<string, unknown> }
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
    const details = page.getByText('Inspect spatial findings').locator('xpath=..')
    if ((await details.getAttribute('open')) === null)
      await page.getByText('Inspect spatial findings').click()
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

async function completeDifferential(page: Page, step: CaseStep, response: unknown) {
  const ratings =
    response && typeof response === 'object' && !Array.isArray(response)
      ? (response as Record<string, string>)
      : {}
  for (const hypothesis of step.content.hypotheses ?? []) {
    const group = page.getByRole('group', { name: hypothesis.label })
    const rating = ratings[hypothesis.id] ?? 'possible'
    await group
      .getByRole('button', {
        name: rating[0]!.toUpperCase() + rating.slice(1),
        exact: true,
      })
      .click()
  }
}

function regexEscape(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function selectWorkspaceTab(page: Page, name: 'Task' | 'Clues') {
  const tab = page.getByRole('tab', { name, exact: true }).first()
  if (await tab.isVisible().catch(() => false)) await tab.click()
}

export async function reviewClue(page: Page, title: string) {
  await selectWorkspaceTab(page, 'Clues')
  await page
    .getByRole('button', { name: new RegExp(regexEscape(title), 'i') })
    .first()
    .click()
  const confirm = page.getByRole('button', { name: 'Open clue', exact: true })
  if (await confirm.isVisible().catch(() => false)) await confirm.click()
  await page.waitForTimeout(1_250)
  const close = page.getByRole('button', { name: /Close/ }).last()
  if (await close.isVisible().catch(() => false)) await close.click()
  await selectWorkspaceTab(page, 'Task')
}

async function completeEvidenceSelect(
  page: Page,
  caseDoc: CaseDocumentFixture,
  step: CaseStep,
  response: unknown,
) {
  const selected =
    Array.isArray(response) && response.length
      ? (response as EvidenceChoice[])
      : (step.content.correctEvidence ?? [])
  for (const evidence of selected) {
    if (evidence.kind !== 'clue') continue
    const clue = caseDoc.clues.find(({ id }) => id === evidence.id)
    const checkbox = page.getByRole('checkbox', {
      name: new RegExp(regexEscape(clue?.title ?? evidence.id), 'i'),
    })
    if (await checkbox.isDisabled()) await reviewClue(page, clue?.title ?? evidence.id)
  }
  for (const evidence of selected) {
    const label =
      evidence.kind === 'clue'
        ? caseDoc.clues.find(({ id }) => id === evidence.id)?.title
        : caseDoc.findings?.find(({ id }) => id === evidence.id)?.label
    await page
      .getByRole('checkbox', { name: new RegExp(regexEscape(label ?? evidence.id), 'i') })
      .check()
  }
  await page.getByRole('button', { name: 'Cite evidence', exact: true }).click()
}

export async function completeCaseStep(
  page: Page,
  caseDoc: CaseDocumentFixture,
  step: CaseStep,
  checkState: CheckState,
  response: unknown = caseDoc.expertBenchmark.responses[step.id],
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
  if (step.type === 'case_differential') {
    await completeDifferential(page, step, response)
    return
  }
  if (step.type === 'case_evidence_select') {
    await completeEvidenceSelect(page, caseDoc, step, response)
    return
  }
  throw new Error(`No Playwright case driver for ${step.type} (${step.id}).`)
}

export async function resetDemo(page: Page) {
  await page.goto('/dev')
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.getByText('Advanced seed applied.')).toBeVisible()
}

export async function expectPromptAndActionInViewport(page: Page, state: string) {
  const task = page.locator('[data-case-task]')
  const prompt = task
    .locator('h2:visible, legend:visible, [data-anatomy-viewer] p:visible')
    .first()
  const actionSlot = task.locator('[data-step-action-slot]').last()
  const action =
    (await actionSlot.count()) > 0
      ? actionSlot
      : task.getByRole('button').filter({ hasNotText: /Reset|Expand/ }).last()
  await expect(prompt, `${state}: task prompt`).toBeVisible()
  await expect(action, `${state}: primary action`).toBeVisible()
  await prompt.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest' }))
  let [promptBox, actionBox, viewport] = await Promise.all([
    prompt.boundingBox(),
    action.boundingBox(),
    page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })),
  ])
  expect(promptBox, `${state}: prompt has geometry`).not.toBeNull()
  expect(actionBox, `${state}: action has geometry`).not.toBeNull()
  const requiredScroll = Math.max(0, actionBox!.y + actionBox!.height - viewport.height + 16)
  if (requiredScroll > 0) {
    await page.evaluate((distance) => window.scrollBy(0, distance), requiredScroll)
    const adjusted = await Promise.all([
      prompt.boundingBox(),
      action.boundingBox(),
      page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })),
    ])
    promptBox = adjusted[0]
    actionBox = adjusted[1]
    viewport = adjusted[2]
  }
  for (const [label, box] of [
    ['prompt', promptBox],
    ['action', actionBox],
  ] as const) {
    expect(box!.x + box!.width, `${state}: ${label} reaches viewport`).toBeGreaterThan(0)
    expect(box!.x, `${state}: ${label} starts before viewport edge`).toBeLessThan(viewport.width)
    expect(box!.y + box!.height, `${state}: ${label} reaches viewport`).toBeGreaterThan(0)
    expect(box!.y, `${state}: ${label} starts before viewport edge`).toBeLessThan(viewport.height)
  }
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
  options: { caseSeed?: number } = {},
) {
  await page.goto(`/learn/cases/${caseDoc.id}`)
  await expect(page.getByRole('heading', { name: caseDoc.title })).toBeVisible()
  await checkState(`${caseDoc.id}:intro`)
  if (options.caseSeed === undefined) {
    await page.getByRole('link', { name: 'Start case' }).click()
  } else {
    await page.goto(`/learn/cases/${caseDoc.id}/play?caseSeed=${options.caseSeed}`)
  }

  for (const stage of caseDoc.stages) {
    await expect(page.getByRole('heading', { name: stage.title })).toBeVisible()
    await checkState(`${caseDoc.id}:stage-${stage.id}`)
    const clueClose = page.getByRole('button', { name: 'Close' })
    if (await clueClose.isVisible()) {
      await checkState(`${caseDoc.id}:entry-clue`)
      await clueClose.click()
    }
    for (const step of stage.steps) {
      await selectWorkspaceTab(page, 'Task')
      await expectPromptAndActionInViewport(page, `${caseDoc.id}:${step.id}`)
      await checkState(`${caseDoc.id}:step-${step.id}`)
      await completeCaseStep(
        page,
        caseDoc,
        step,
        checkState,
        caseDoc.expertBenchmark.responses[step.id],
      )
      await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible()
      await checkState(`${caseDoc.id}:step-${step.id}-complete`)
      await page.getByRole('button', { name: 'Continue', exact: true }).click()
    }
  }

  await expect(page.getByText('Case complete')).toBeVisible()
  await dismissCelebrations(page)
  await checkState(`${caseDoc.id}:results`)
  await page.getByRole('button', { name: 'Compare with model answer' }).click()
  await expect(page.getByRole('heading', { name: 'You versus Model answer' })).toBeVisible()
  await checkState(`${caseDoc.id}:compare`)
}
