import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { describe, expect, it } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { createAppRoutes } from '@/app/router'
import { validateContentBundle } from '@/content/loader'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())

function serializeRoutes(routes: RouteObject[]) {
  return routes.map((route, group) => ({
    group: group === 0 ? 'shell' : 'immersive',
    routes: route.children?.map((child) => ({
      index: child.index === true,
      path: child.path ?? null,
      title: (child.handle as { title?: string } | undefined)?.title ?? null,
      render: child.index ? 'eager' : 'lazy',
    })),
  }))
}

describe('default route characterization', () => {
  it('preserves the production route table and eager Home boundary', () => {
    expect(serializeRoutes(createAppRoutes(false))).toEqual([
      {
        group: 'shell',
        routes: [
          { index: true, path: null, title: 'Home', render: 'eager' },
          { index: false, path: 'learn', title: 'Learn', render: 'lazy' },
          { index: false, path: 'learn/cases', title: 'Case Lab', render: 'lazy' },
          { index: false, path: 'learn/pathways/:pathwayId', title: 'Pathway', render: 'lazy' },
          { index: false, path: 'learn/courses/:courseId', title: 'Course', render: 'lazy' },
          { index: false, path: 'learn/cases/:caseId', title: 'Case Lab', render: 'lazy' },
          {
            index: false,
            path: 'learn/cases/:caseId/attempts/:attemptId',
            title: 'Case results',
            render: 'lazy',
          },
          { index: false, path: 'challenge', title: 'Challenges', render: 'lazy' },
          { index: false, path: 'leaderboard', title: 'Leaderboard', render: 'lazy' },
          { index: false, path: 'profile', title: 'Profile', render: 'lazy' },
          { index: false, path: '*', title: 'Not found', render: 'lazy' },
        ],
      },
      {
        group: 'immersive',
        routes: [
          {
            index: false,
            path: 'learn/courses/:courseId/lessons/:lessonId',
            title: 'Lesson',
            render: 'lazy',
          },
          {
            index: false,
            path: 'challenge/:challengeId/play',
            title: 'Challenge',
            render: 'lazy',
          },
          {
            index: false,
            path: 'learn/cases/:caseId/play',
            title: 'Case Lab',
            render: 'lazy',
          },
        ],
      },
    ])
  })

  it('adds only the three development routes when enabled', () => {
    const production = serializeRoutes(createAppRoutes(false))
    const development = serializeRoutes(createAppRoutes(true))
    const productionPaths = new Set(production.flatMap(({ routes }) => routes?.map((r) => r.path)))
    const added = development
      .flatMap(({ routes }) => routes ?? [])
      .filter(({ path }) => !productionPaths.has(path))

    expect(added).toEqual([
      { index: false, path: 'dev', title: 'Development', render: 'lazy' },
      { index: false, path: 'dev/primitives', title: 'Primitive gallery', render: 'lazy' },
      { index: false, path: 'dev/tokens', title: 'Design tokens', render: 'lazy' },
    ])
  })

  it('preserves default shell markup', () => {
    const router = createMemoryRouter(createAppRoutes(false), { initialEntries: ['/'] })
    const { container } = render(
      <ContentContext.Provider value={registry}>
        <RouterProvider router={router} />
      </ContentContext.Provider>,
    )

    expect(container.innerHTML).toMatchSnapshot()
  })
})
