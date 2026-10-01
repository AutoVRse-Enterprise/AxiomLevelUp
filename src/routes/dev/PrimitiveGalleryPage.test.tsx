import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import { clearEventSubscribersForTests, subscribeToEvents } from '@/events/bus'
import { makeValidContentBundle } from '@/test/contentFixtures'

import { PrimitiveGalleryPage } from './PrimitiveGalleryPage'

const registry = validateContentBundle(makeValidContentBundle())

function renderGallery() {
  const router = createMemoryRouter(
    [
      { path: '/dev/primitives', element: <PrimitiveGalleryPage /> },
      {
        path: '/learn/courses/:courseId/lessons/:lessonId',
        element: <p>Showcase lesson route</p>,
      },
    ],
    { initialEntries: ['/dev/primitives'] },
  )
  render(
    <ContentContext.Provider value={registry}>
      <RouterProvider router={router} />
    </ContentContext.Provider>,
  )
  return router
}

describe('primitive gallery', () => {
  it('renders every showcase primitive with local-only state controls', async () => {
    clearEventSubscribersForTests()
    const subscriber = vi.fn()
    subscribeToEvents(subscriber)
    const user = userEvent.setup()
    renderGallery()

    expect(screen.getAllByText(/^showcase-/u)).toHaveLength(22)
    expect(screen.getByRole('link', { name: 'Open the real showcase lesson' })).toHaveAttribute(
      'href',
      '/learn/courses/runtime-showcase/lessons/primitive-showcase',
    )

    await user.click(screen.getByRole('radio', { name: 'review' }))
    await user.click(screen.getByRole('checkbox', { name: 'Simulate missing assets' }))
    await user.click(screen.getByRole('button', { name: 'Reset local state' }))

    expect((await screen.findAllByText(/unavailable/i)).length).toBeGreaterThan(0)
    expect(subscriber).not.toHaveBeenCalled()
    clearEventSubscribersForTests()
  })
})
