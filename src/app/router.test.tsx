import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import { AppShell } from '@/layouts/AppShell'
import { ImmersiveLayout } from '@/layouts/ImmersiveLayout'
import { makeValidContentBundle } from '@/test/contentFixtures'

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
  it.each(['/', '/learn', '/challenge', '/leaderboard', '/profile'])(
    'shows learner navigation on %s',
    (path) => {
      renderRouter(path)

      expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
      expect(screen.getByText('Top-level route')).toBeVisible()
    },
  )

  it('hides learner navigation on the lesson route', () => {
    renderRouter('/learn/courses/course-1/lessons/lesson-1', true)

    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).not.toBeInTheDocument()
    expect(screen.getByText('Lesson route')).toBeVisible()
  })
})
