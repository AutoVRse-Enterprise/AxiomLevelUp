import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

import { expectNoAxeViolations } from './helpers/accessibility'
import { caseIds, loadCase, resetDemo, runCaseThroughEveryState } from './helpers/case-driver'

interface CourseFixture {
  id: string
  lessons: Array<{ id: string }>
}

interface AppFixture {
  pathways: Array<{ id: string }>
  challenges: Array<{ id: string }>
}

interface SeedFixture {
  caseAttempts: Record<string, Array<{ attemptId: string }>>
}

function contentJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.resolve('public/content', relativePath), 'utf8')) as T
}

const app = contentJson<AppFixture>('app-config.json')
const courses = readdirSync(path.resolve('public/content/courses'))
  .filter((file) => file.endsWith('.json'))
  .map((file) => contentJson<CourseFixture>(`courses/${file}`))
const seed = contentJson<SeedFixture>('seeds/advanced.json')

const learnerRoutes = [
  '/',
  '/learn',
  ...app.pathways.map(({ id }) => `/learn/pathways/${id}`),
  ...courses.flatMap((course) => [
    `/learn/courses/${course.id}`,
    ...course.lessons.map(({ id }) => `/learn/courses/${course.id}/lessons/${id}`),
  ]),
  '/challenge',
  ...app.challenges.map(({ id }) => `/challenge/${id}/play`),
  '/leaderboard',
  '/profile',
  ...caseIds.flatMap((caseId) => [
    `/learn/cases/${caseId}`,
    ...(seed.caseAttempts[caseId] ?? [])
      .slice(0, 1)
      .map(({ attemptId }) => `/learn/cases/${caseId}/attempts/${encodeURIComponent(attemptId)}`),
  ]),
]

test.beforeEach(async ({ page }) => {
  await resetDemo(page)
})

test('P12-T10: stable learner routes have no WCAG A or AA violations', async ({ page }) => {
  test.setTimeout(240_000)
  for (const route of learnerRoutes) {
    await page.goto(route)
    await expect(page.locator('main')).toHaveCount(1)
    await expect(page.locator('#main-content')).toBeVisible()
    await expectNoAxeViolations(page, route)
  }
})

for (const caseId of caseIds) {
  test(`P12-T10: ${caseId} has no WCAG A or AA violations in every case state`, async ({
    page,
  }) => {
    test.setTimeout(240_000)
    await runCaseThroughEveryState(page, loadCase(caseId), (state) =>
      expectNoAxeViolations(page, state),
    )
  })
}
