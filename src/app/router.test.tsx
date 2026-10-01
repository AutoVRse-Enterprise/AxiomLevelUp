import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AppShell } from '@/layouts/AppShell'
import { ImmersiveLayout } from '@/layouts/ImmersiveLayout'

describe('router layouts', () => {
  it.each(['/', '/learn', '/challenge', '/leaderboard', '/profile'])(
    'shows learner navigation on %s',
    (path) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="*" element={<p>Top-level route</p>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      )

      expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
      expect(screen.getByText('Top-level route')).toBeVisible()
    },
  )

  it('hides learner navigation on the lesson route', () => {
    render(
      <MemoryRouter initialEntries={['/learn/courses/course-1/lessons/lesson-1']}>
        <Routes>
          <Route element={<ImmersiveLayout />}>
            <Route path="learn/courses/:courseId/lessons/:lessonId" element={<p>Lesson route</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).not.toBeInTheDocument()
    expect(screen.getByText('Lesson route')).toBeVisible()
  })
})
