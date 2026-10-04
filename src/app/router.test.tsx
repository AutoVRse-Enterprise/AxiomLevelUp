import { render, screen } from '@testing-library/react'
import { createMemoryRouter, matchRoutes, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import { AppShell } from '@/layouts/AppShell'
import { ImmersiveLayout } from '@/layouts/ImmersiveLayout'
import { makeValidContentBundle } from '@/test/contentFixtures'

import { createAppRoutes, router as appRouter } from './router'

const registry = validateContentBundle(makeValidContentBundle())

function renderRouter(path: string, immersive = false) {
  const router = createMemoryRouter(
    [
      {
        element: immersive ? <ImmersiveLayout /> : <AppShell />,
        children: [{ path: '*', element: <p>{immersive ? 'Lesson route' : 'Top-level route'}</p> }],
      },
    ],
    { initialEntries: [path] },
  )
  return render(
    <ContentContext.Provider value={registry}>
      <RouterProvider router={router} />
    </ContentContext.Provider>,
  )
}

describe('router layouts', () => {
  function registeredPaths(routes: readonly { children?: readonly { path?: string }[] }[]) {
    return routes.flatMap((route) => route.children?.map(({ path }) => path).filter(Boolean) ?? [])
  }

  it('registers development routes during development and retains learner routes', () => {
    const paths = registeredPaths(appRouter.routes)

    expect(paths).toContain('dev/primitives')
    expect(paths).toContain('learn/courses/:courseId/lessons/:lessonId')
  })

  it('omits every development route when developer tools are disabled', () => {
    const routes = createAppRoutes(false)
    const paths = registeredPaths(routes)

    expect(paths).not.toContain('dev')
    expect(paths).not.toContain('dev/primitives')
    expect(paths).not.toContain('dev/tokens')
    expect(paths).toContain('*')
    expect(paths).toContain('learn/courses/:courseId/lessons/:lessonId')
    expect(matchRoutes(routes, '/dev')?.at(-1)?.route.path).toBe('*')
  })

  it('registers every development route when explicitly enabled', () => {
    const routes = createAppRoutes(true)
    const paths = registeredPaths(routes)

    expect(paths).toEqual(expect.arrayContaining(['dev', 'dev/primitives', 'dev/tokens']))
    expect(matchRoutes(routes, '/dev')?.at(-1)?.route.path).toBe('dev')
  })

  it.each(['/', '/learn', '/challenge', '/leaderboard', '/profile'])(
    'shows learner navigation on %s',
    (path) => {
      renderRouter(path)

      expect(screen.getAllByRole('navigation', { name: 'Primary navigation' })).toHaveLength(2)
      expect(screen.getByText('Top-level route')).toBeVisible()
    },
  )

  it('hides learner navigation on the lesson route', () => {
    renderRouter('/learn/courses/course-1/lessons/lesson-1', true)

    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).not.toBeInTheDocument()
    expect(screen.getByText('Lesson route')).toBeVisible()
  })

  it('uses AA-compliant text color for inactive navigation', () => {
    renderRouter('/')

    for (const link of screen.getAllByRole('link', { name: 'Learn' })) {
      expect(link).toHaveClass('text-neutral-600')
    }
    for (const link of screen.getAllByRole('link', { name: 'Home' })) {
      expect(link).not.toHaveClass('text-neutral-600')
    }
  })

  it('shows the official Autovrse logo in the shell header', () => {
    renderRouter('/')

    expect(screen.getByRole('img', { name: 'Autovrse logo' })).toHaveAttribute(
      'src',
      '/brand/autovrse-logo.svg',
    )
    expect(screen.getByText(/^Build /)).toBeVisible()
  })
})
