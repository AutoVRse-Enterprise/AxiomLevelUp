import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import { AppShell } from '@/layouts/AppShell'
import { ImmersiveLayout } from '@/layouts/ImmersiveLayout'
import { makeValidContentBundle } from '@/test/contentFixtures'

import { router as appRouter } from './router'

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
  it('registers the gallery and real lesson routes', () => {
    const paths = appRouter.routes.flatMap(
      (route) => route.children?.map(({ path }) => path).filter(Boolean) ?? [],
    )

    expect(paths).toContain('dev/primitives')
    expect(paths).toContain('learn/courses/:courseId/lessons/:lessonId')
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
  })
})
