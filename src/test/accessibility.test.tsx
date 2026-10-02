import { cleanup, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import axe from 'axe-core'

import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import { MotionProvider } from '@/design/motion'
import { FeedbackPanel } from '@/player/FeedbackPanel'
import { HomePage } from '@/routes/home/HomePage'
import { LearnPage } from '@/routes/learn/LearnPage'
import { ProfilePage } from '@/routes/profile/ProfilePage'
import { useLearnerStore } from '@/state/learnerStore'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())

function renderRoute(path: string, element: ReactNode) {
  const router = createMemoryRouter([{ path, element }], { initialEntries: [path] })
  return render(
    <ContentContext.Provider value={registry}>
      <RouterProvider router={router} />
    </ContentContext.Provider>,
  )
}

const axeOptions = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } },
}

beforeEach(() => {
  useLearnerStore.getState().replaceWithSeed(registry.seed)
})

afterEach(cleanup)

describe('automated accessibility', () => {
  for (const [name, path, element] of [
    ['Home', '/', <HomePage />],
    ['Learn', '/learn', <LearnPage />],
    ['Profile', '/profile', <ProfilePage />],
  ] as const) {
    it(`${name} has no detectable WCAG A/AA violations`, async () => {
      const { container } = renderRoute(path, element)
      const result = await axe.run(container, axeOptions)
      expect(result.violations).toEqual([])
    })
  }

  it('player feedback has no detectable WCAG A/AA violations', async () => {
    const { container } = render(
      <MotionProvider>
        <FeedbackPanel
          canRetry={false}
          message="A concise scientific explanation."
          onContinue={() => undefined}
          onRetry={() => undefined}
          status="correct"
          xpEarned={10}
        />
      </MotionProvider>,
    )

    expect((await axe.run(container, axeOptions)).violations).toEqual([])
  })
})
