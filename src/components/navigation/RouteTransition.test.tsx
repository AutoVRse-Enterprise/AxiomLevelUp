import { act, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { RouteTransition } from '@/components/navigation/RouteTransition'

describe('RouteTransition', () => {
  it('moves focus to the new page heading', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <main id="main-content">
              <RouteTransition />
            </main>
          ),
          children: [
            { index: true, element: <h1>First page</h1> },
            { path: 'next', element: <h1>Next page</h1> },
          ],
        },
      ],
      { initialEntries: ['/'] },
    )

    render(<RouterProvider router={router} />)
    await act(() => router.navigate('/next'))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Next page' })).toHaveFocus())
  })
})
