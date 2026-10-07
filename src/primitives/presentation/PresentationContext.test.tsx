import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { multipleChoicePrimitiveSchema } from '@/content/schema/primitives'
import { MultipleChoicePrimitive } from '@/primitives/components/MultipleChoicePrimitive'
import {
  PresentationProvider,
  defaultPresentationLabels,
} from '@/primitives/presentation/PresentationContext'

const primitive = multipleChoicePrimitiveSchema.parse({
  id: 'choice',
  type: 'multiple_choice',
  content: {
    prompt: 'Choose',
    options: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
    correctOptionId: 'a',
    explanation: 'A is correct.',
  },
})

function Choice({ game = false }: { game?: boolean }) {
  return (
    <PresentationProvider
      labels={game ? { checkAnswer: 'Lock in' } : undefined}
      variant={game ? 'game' : 'lesson'}
    >
      <MultipleChoicePrimitive
        attempt={1}
        draft="a"
        mode="interactive"
        onComplete={vi.fn()}
        onDraftChange={vi.fn()}
        onInteract={vi.fn()}
        onSubmit={vi.fn()}
        primitive={primitive}
      />
    </PresentationProvider>
  )
}

describe('presentation context', () => {
  it('preserves lesson labels by default', () => {
    render(<Choice />)
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeVisible()
    expect(defaultPresentationLabels.levelProgress(1, 3)).toBe('Level 1 of 3')
  })

  it('overrides labels for a game', () => {
    render(<Choice game />)
    expect(screen.getByRole('button', { name: 'Lock in' })).toBeVisible()
  })
})
