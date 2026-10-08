import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PlannedRound } from '@/engines/games/plan'
import { RoundIntro } from '@/player/game/RoundIntro'

const round = { timeLimitSeconds: 50 } as PlannedRound

afterEach(() => {
  vi.useRealTimers()
})

describe('RoundIntro', () => {
  it('waits for an explicit start when auto advance is disabled', () => {
    vi.useFakeTimers()
    const onContinue = vi.fn()
    render(
      <RoundIntro
        autoAdvanceMs={0}
        continueLabel="Start round"
        onContinue={onContinue}
        round={round}
        roundLabel="Round"
        title="Find the drop point."
      />,
    )

    vi.advanceTimersByTime(30_000)
    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.getByText(/The timer starts when you begin\./)).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Start round' }))
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('retains configured auto advance for experiences that use it', () => {
    vi.useFakeTimers()
    const onContinue = vi.fn()
    render(
      <RoundIntro
        autoAdvanceMs={1_200}
        continueLabel="Continue"
        onContinue={onContinue}
        round={round}
        roundLabel="Round"
        title="Find the drop point."
      />,
    )

    vi.advanceTimersByTime(1_200)
    expect(onContinue).toHaveBeenCalledOnce()
  })
})
