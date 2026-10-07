import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { GameConfig, RoundDocument } from '@/content/schema/game'
import type { PlannedRound } from '@/engines/games/plan'
import type { GameRoundSession } from '@/engines/games/session'
import { SpatialRoundStage } from '@/player/game/SpatialRoundStage'

vi.mock('@/primitives/registry', () => ({
  PrimitiveRenderer: ({
    primitive,
    onSubmit,
    onInteract,
  }: {
    primitive: { id: string }
    onSubmit: (response: unknown) => void
    onInteract: (interaction: { name: string; reason: string }) => void
  }) => (
    <div data-testid={primitive.id}>
      {primitive.id}
      {primitive.id === 'scene' ? (
        <button
          onClick={() => onInteract({ name: 'anatomy_viewer_failed', reason: 'context lost' })}
        >
          Fail viewer
        </button>
      ) : null}
      {primitive.id === 'answer' ? (
        <button onClick={() => onSubmit({ side: 'right' })}>Submit answer</button>
      ) : null}
    </div>
  ),
}))

const copy = {
  openAnswerDrawer: 'I know where I am',
  answerDrawerTitle: 'Choose your location',
  backToScene: 'Back to view',
  backToAirway: 'Back to airway',
  viewUnavailableTitle: '3D view unavailable',
  viewUnavailableMessage: 'The view could not start.',
  retryView: 'Retry view',
  skipRound: 'Skip round',
} as NonNullable<GameConfig['copy']>

describe('SpatialRoundStage', () => {
  it('requests the answer step while keeping the scene mounted', async () => {
    const user = userEvent.setup()
    const onRoundStepChange = vi.fn()
    render(
      <SpatialRoundStage
        allowSkip
        copy={copy}
        disabled={false}
        onDraftChange={vi.fn()}
        onExploreDraftChange={vi.fn()}
        onFailureChange={vi.fn()}
        onInteract={vi.fn()}
        onRoundStepChange={onRoundStepChange}
        onSkip={vi.fn()}
        onSubmit={vi.fn()}
        plannedRound={
          {
            primitive: { id: 'answer', type: 'anatomy_locate', content: {} },
            explore: { id: 'scene', type: 'anatomy_explore', content: {} },
          } as unknown as PlannedRound
        }
        round={{ title: 'Where are you?' } as RoundDocument}
        roundSession={{ draft: null, exploreDraft: null, roundStep: 'explore' } as GameRoundSession}
      />,
    )

    expect(screen.getByTestId('scene')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'I know where I am' }))
    expect(onRoundStepChange).toHaveBeenCalledWith('answer')
  })

  it('replaces the airway scene with the pin answer and can return without losing draft', async () => {
    const user = userEvent.setup()
    const onRoundStepChange = vi.fn()
    render(
      <SpatialRoundStage
        allowSkip
        copy={copy}
        disabled={false}
        onDraftChange={vi.fn()}
        onExploreDraftChange={vi.fn()}
        onFailureChange={vi.fn()}
        onInteract={vi.fn()}
        onRoundStepChange={onRoundStepChange}
        onSkip={vi.fn()}
        onSubmit={vi.fn()}
        plannedRound={
          {
            primitive: { id: 'answer', type: 'anatomy_locate', content: {} },
            explore: { id: 'scene', type: 'anatomy_explore', content: {} },
          } as unknown as PlannedRound
        }
        round={{ title: 'Find your way', mechanic: 'spatial_explore' } as RoundDocument}
        roundSession={
          {
            draft: null,
            exploreDraft: { movesUsed: 2 },
            roundStep: 'answer',
          } as GameRoundSession
        }
      />,
    )

    expect(screen.queryByTestId('scene')).not.toBeInTheDocument()
    expect(screen.getByTestId('answer')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Back to airway' }))
    expect(onRoundStepChange).toHaveBeenCalledWith('explore')
  })

  it('offers retry and skip when the viewer fails', async () => {
    const user = userEvent.setup()
    const onFailureChange = vi.fn()
    const onSkip = vi.fn()
    render(
      <SpatialRoundStage
        allowSkip
        copy={copy}
        disabled={false}
        onDraftChange={vi.fn()}
        onExploreDraftChange={vi.fn()}
        onFailureChange={onFailureChange}
        onInteract={vi.fn()}
        onRoundStepChange={vi.fn()}
        onSkip={onSkip}
        onSubmit={vi.fn()}
        plannedRound={
          {
            primitive: { id: 'answer', type: 'anatomy_locate', content: {} },
            explore: { id: 'scene', type: 'anatomy_explore', content: {} },
          } as unknown as PlannedRound
        }
        round={{ title: 'Find your way', mechanic: 'spatial_explore' } as RoundDocument}
        roundSession={{ draft: null, exploreDraft: null, roundStep: 'explore' } as GameRoundSession}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Fail viewer' }))
    expect(onFailureChange).toHaveBeenCalledWith(true)
    expect(screen.getByText('3D view unavailable')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Skip round' }))
    expect(onSkip).toHaveBeenCalled()
  })
})
