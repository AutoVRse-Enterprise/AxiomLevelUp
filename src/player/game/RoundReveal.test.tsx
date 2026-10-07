import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import appConfig from '../../../public/experiences/sanofi/content/app-config.json'
import { appConfigSchema } from '@/content/schema'
import { RoundReveal } from '@/player/game/RoundReveal'
import { StepActionScope } from '@/player/StepActionSlot'

describe('RoundReveal', () => {
  it('shows one outcome, explanation and points breakdown', () => {
    const copy = appConfigSchema.parse(appConfig).games!.copy!
    render(
      <StepActionScope placement="inline">
        <RoundReveal
          copy={copy}
          lastRound={false}
          onNext={vi.fn()}
          speedBonusLabel="Fast answer bonus"
          total={950}
          view={{
            outcome: 'correct',
            answerLine: 'Correct answer: A.',
            feedbackSentence: 'The strongest clue explains the answer.',
            points: 950,
            breakdown: { basePoints: 850, speedBonus: 100, clueCost: 0 },
          }}
        />
      </StepActionScope>,
    )
    expect(screen.getByRole('heading', { name: 'Correct' })).toBeVisible()
    expect(screen.getByText('The strongest clue explains the answer.')).toBeVisible()
    expect(screen.queryByText('Correct answer: A.')).not.toBeInTheDocument()
    expect(screen.getByText('Fast answer bonus')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Next round' })).toBeVisible()
  })
})
