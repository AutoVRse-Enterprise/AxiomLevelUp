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
} as NonNullable<GameConfig['copy']>

describe('SpatialRoundStage', () => {
  it('keeps the scene mounted while opening and submitting the answer drawer', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <SpatialRoundStage
        copy={copy}
        disabled={false}
        onDraftChange={vi.fn()}
        onInteract={vi.fn()}
        onSubmit={onSubmit}
        plannedRound={
          {
            primitive: { id: 'answer', type: 'anatomy_locate', content: {} },
            explore: { id: 'scene', type: 'anatomy_explore', content: {} },
          } as unknown as PlannedRound
        }
        round={{ title: 'Where are you?' } as RoundDocument}
        roundSession={{ draft: null } as GameRoundSession}
      />,
    )

    expect(screen.getByTestId('scene')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'I know where I am' }))
    expect(screen.getByTestId('scene')).toBeVisible()
    expect(screen.getByLabelText('Choose your location')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Submit answer' }))
    expect(onSubmit).toHaveBeenCalledWith({ side: 'right' })
  })
})
