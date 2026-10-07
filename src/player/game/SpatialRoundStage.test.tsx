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
  }: {
    primitive: { id: string }
    onSubmit: (response: unknown) => void
  }) => (
    <div data-testid={primitive.id}>
      {primitive.id}
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
} as NonNullable<GameConfig['copy']>

describe('SpatialRoundStage', () => {
  it('requests the answer step while keeping the scene mounted', async () => {
    const user = userEvent.setup()
    const onRoundStepChange = vi.fn()
    render(
      <SpatialRoundStage
        copy={copy}
        disabled={false}
        onDraftChange={vi.fn()}
        onExploreDraftChange={vi.fn()}
        onInteract={vi.fn()}
        onRoundStepChange={onRoundStepChange}
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
        copy={copy}
        disabled={false}
        onDraftChange={vi.fn()}
        onExploreDraftChange={vi.fn()}
        onInteract={vi.fn()}
        onRoundStepChange={onRoundStepChange}
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
})
