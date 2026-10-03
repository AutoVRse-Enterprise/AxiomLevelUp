import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { expect, test } from '@playwright/test'

import { primitiveTypes } from '../src/content/primitiveTypes'
import {
  appConfigSchema,
  caseDocumentSchema,
  contentManifestSchema,
  courseSchema,
  learnerSeedSchema,
} from '../src/content/schema'

function readContentFile(path: string) {
  return JSON.parse(readFileSync(resolve('public/content', path), 'utf8')) as unknown
}

const manifest = contentManifestSchema.parse(readContentFile('manifest.json'))
const appConfig = appConfigSchema.parse(readContentFile(manifest.appConfig))
const courses = manifest.courses
  .map((path) => courseSchema.parse(readContentFile(path)))
  .filter(({ visibility }) => visibility === 'learner')
const cases = manifest.cases.map((path) => caseDocumentSchema.parse(readContentFile(path)))
const advancedSeed = learnerSeedSchema.parse(readContentFile(manifest.seeds.advanced))
const contentDocuments: unknown[] = [appConfig, ...courses, ...cases]

function collectMachineIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectMachineIds)
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectMachineIds)
  }
  return typeof value === 'string' && /^[a-z0-9][a-z0-9_-]*$/u.test(value) && /[-_]/u.test(value)
    ? [value]
    : []
}

function collectAuthoredLabels(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectAuthoredLabels)
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, entry]) =>
    (key === 'title' || key === 'label' || key === 'name') && typeof entry === 'string'
      ? [entry]
      : collectAuthoredLabels(entry),
  )
}

function appearsAsToken(text: string, value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
  return new RegExp(`(^|[^\\p{L}\\p{N}_-])${escaped}($|[^\\p{L}\\p{N}_-])`, 'iu').test(text)
}

const machineLabels = [
  ...new Set([...contentDocuments.flatMap(collectMachineIds), ...primitiveTypes]),
]
  .filter(
    (value) =>
      !contentDocuments
        .flatMap(collectAuthoredLabels)
        .some((label) => appearsAsToken(label, value)),
  )
  .sort()

const learnerRoutes = [
  '/',
  '/learn',
  ...appConfig.pathways.map(({ id }) => `/learn/pathways/${id}`),
  ...courses.flatMap((course) => [
    `/learn/courses/${course.id}`,
    ...course.lessons.map(({ id }) => `/learn/courses/${course.id}/lessons/${id}`),
  ]),
  ...cases.flatMap((caseDocument) => [
    `/learn/cases/${caseDocument.id}`,
    `/learn/cases/${caseDocument.id}/play`,
  ]),
  ...Object.entries(advancedSeed.caseAttempts).flatMap(([caseId, attempts]) =>
    attempts.flatMap(({ attemptId }) => {
      const path = `/learn/cases/${caseId}/attempts/${encodeURIComponent(attemptId)}`
      return [path, `${path}?view=compare`]
    }),
  ),
  '/challenge',
  ...appConfig.challenges.map(({ id }) => `/challenge/${id}/play`),
  '/leaderboard',
  '/profile',
]

test('stable learner routes do not expose implementation labels or content IDs', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop route coverage is sufficient.')
  test.setTimeout(180_000)

  await page.goto('/dev')
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(page.getByText('Advanced seed applied.')).toBeVisible()

  const failures: string[] = []
  for (const route of learnerRoutes) {
    await page.goto(route)
    await expect(page.locator('#main-content')).toBeVisible()
    await expect(page.getByText('Preparing your learning space')).toHaveCount(0)
    const visibleText = await page.locator('body').innerText()
    const leakedIds = machineLabels.filter((value) => appearsAsToken(visibleText, value))
    const placeholderCopy = ['coming soon', 'not playable yet', 'placeholder'].filter((value) =>
      visibleText.toLowerCase().includes(value),
    )
    if (leakedIds.length || placeholderCopy.length) {
      failures.push(
        `${route}: ${[
          ...leakedIds.map((value) => `raw "${value}"`),
          ...placeholderCopy.map((value) => `copy "${value}"`),
        ].join(', ')}`,
      )
    }
  }

  expect(failures, failures.join('\n')).toEqual([])
})
