import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingState } from '@/components/ui'
import { MotionProvider, useResolvedMotion } from '@/design/motion'
import {
  defaultPreferences,
  readPreferences,
  usePreferencesStore,
} from '@/state/preferences'

function MotionProbe() {
  return <output>{useResolvedMotion()}</output>
}

afterEach(() => {
  window.localStorage.clear()
  act(() => {
    usePreferencesStore.getState().setMotion(defaultPreferences.motion)
    usePreferencesStore.getState().setHapticsEnabled(defaultPreferences.hapticsEnabled)
  })
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.motion
})

describe('Phase 8 polish foundations', () => {
  it('migrates legacy device preferences without retaining sound', () => {
    window.localStorage.setItem(
      'axiom-runtime:preferences',
      JSON.stringify({ soundEnabled: true, motion: 'reduced', installPromptDismissedAt: 'now' }),
    )

    expect(readPreferences()).toEqual({
      motion: 'reduced',
      hapticsEnabled: true,
      installPromptDismissedAt: 'now',
    })
  })

  it('resolves system and explicit motion preferences', () => {
    const listeners = new Set<() => void>()
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    }))
    act(() => usePreferencesStore.getState().setMotion('system'))

    render(
      <MotionProvider>
        <MotionProbe />
      </MotionProvider>,
    )

    expect(screen.getByText('reduced')).toBeVisible()
    expect(document.documentElement.dataset.motion).toBe('reduced')

    act(() => usePreferencesStore.getState().setMotion('full'))
    expect(screen.getByText('full')).toBeVisible()
  })

  it('renders designed loading, error and actionable empty contracts', () => {
    const retry = vi.fn()
    const { rerender } = render(<LoadingState title="Preparing study" progress={50} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')

    rerender(
      <ErrorState
        actionLabel="Retry"
        message="The asset did not load."
        onAction={retry}
        title="Asset unavailable"
      />,
    )
    screen.getByRole('button', { name: 'Retry' }).click()
    expect(retry).toHaveBeenCalledOnce()

    rerender(
      <EmptyState
        action={<a href="/learn">Browse courses</a>}
        message="There is no content here."
        title="Nothing yet"
      />,
    )
    expect(screen.getByRole('link', { name: 'Browse courses' })).toHaveAttribute('href', '/learn')
  })
})
