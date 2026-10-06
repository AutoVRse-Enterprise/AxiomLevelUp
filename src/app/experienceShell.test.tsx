import { render, screen } from '@testing-library/react'
import { Home } from 'lucide-react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import {
  defaultExperienceShell,
  ExperienceShellProvider,
  type ExperienceShellConfig,
} from '@/app/experienceShell'
import { validateContentBundle } from '@/content/loader'
import { AppShell } from '@/layouts/AppShell'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())
const gameShell: ExperienceShellConfig = {
  ...defaultExperienceShell,
  navigation: [{ to: '/', label: 'Play', icon: Home, end: true }],
  headerStatus: 'none',
  installPrompt: false,
}

describe('experience shell', () => {
  it('renders a single-item game shell without learner status or bottom navigation', () => {
    const router = createMemoryRouter(
      [{ element: <AppShell />, children: [{ index: true, element: <p>Game hub</p> }] }],
      { initialEntries: ['/'] },
    )

    render(
      <ExperienceShellProvider value={gameShell}>
        <ContentContext.Provider value={registry}>
          <RouterProvider router={router} />
        </ContentContext.Provider>
      </ExperienceShellProvider>,
    )

    expect(screen.getAllByRole('navigation', { name: 'Primary navigation' })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Play' })).toBeVisible()
    expect(screen.queryByLabelText('Learner status')).not.toBeInTheDocument()
    expect(screen.getByText('Game hub')).toBeVisible()
  })
})
