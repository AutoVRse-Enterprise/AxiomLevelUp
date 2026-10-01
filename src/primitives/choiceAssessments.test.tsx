import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  multipleChoicePrimitiveSchema,
  multipleSelectPrimitiveSchema,
  trueFalsePrimitiveSchema,
} from '@/content/schema/primitives'
import { MultipleChoicePrimitive } from '@/primitives/components/MultipleChoicePrimitive'
import { MultipleSelectPrimitive } from '@/primitives/components/MultipleSelectPrimitive'
import { TrueFalsePrimitive } from '@/primitives/components/TrueFalsePrimitive'
import { evaluatePrimitive } from '@/primitives/definitions'

const base = {
  conceptIds: [],
  completion: { mode: 'answer' },
}

const multipleChoice = multipleChoicePrimitiveSchema.parse({
  ...base,
  id: 'single',
  type: 'multiple_choice',
  content: {
    prompt: 'Choose one',
    options: [
      { id: 'alpha', label: 'Alpha' },
      { id: 'beta', label: 'Beta' },
    ],
    correctOptionId: 'alpha',
    explanation: 'Alpha is correct.',
  },
})

const multipleSelect = multipleSelectPrimitiveSchema.parse({
  ...base,
  id: 'several',
  type: 'multiple_select',
  content: {
    prompt: 'Choose two',
    options: [
      { id: 'alpha', label: 'Alpha' },
      { id: 'beta', label: 'Beta' },
      { id: 'gamma', label: 'Gamma' },
    ],
    correctOptionIds: ['alpha', 'beta'],
    scoringMode: 'partial',
    minSelections: 2,
    explanation: 'Alpha and beta are correct.',
  },
})

const trueFalse = trueFalsePrimitiveSchema.parse({
  ...base,
  id: 'binary',
  type: 'true_false',
  content: {
    statement: 'The statement is false.',
    answer: false,
    explanation: 'It is false.',
  },
})

describe('choice assessment schemas', () => {
  it('applies choice defaults and rejects inconsistent content', () => {
    expect(multipleChoice.content.shuffle).toBe(false)
    expect(multipleSelect.content.shuffle).toBe(false)
    expect(
      multipleSelectPrimitiveSchema.parse({
        ...multipleSelect,
        content: {
          ...multipleSelect.content,
          scoringMode: undefined,
        },
      }).content.scoringMode,
    ).toBe('all_or_nothing')
    expect(
      multipleSelectPrimitiveSchema.safeParse({
        ...multipleSelect,
        content: { ...multipleSelect.content, correctOptionIds: ['missing'] },
      }).success,
    ).toBe(false)
    expect(
      multipleSelectPrimitiveSchema.safeParse({
        ...multipleSelect,
        content: { ...multipleSelect.content, minSelections: 3 },
      }).success,
    ).toBe(false)
    expect(
      trueFalsePrimitiveSchema.safeParse({
        ...trueFalse,
        content: { ...trueFalse.content, extra: true },
      }).success,
    ).toBe(false)
  })
})

describe('choice assessment evaluators', () => {
  it.each([
    ['multiple choice correct', multipleChoice, 'alpha', 1],
    ['multiple choice incorrect', multipleChoice, 'beta', 0],
    ['multiple choice malformed', multipleChoice, ['alpha'], 0],
    ['multiple select exact', multipleSelect, ['alpha', 'beta'], 1],
    ['multiple select partial', multipleSelect, ['alpha', 'gamma'], 0],
    [
      'multiple select one of two correct',
      multipleSelectPrimitiveSchema.parse({
        ...multipleSelect,
        content: { ...multipleSelect.content, minSelections: 1 },
      }),
      ['alpha'],
      0.5,
    ],
    [
      'multiple select partial clamps at zero',
      multipleSelectPrimitiveSchema.parse({
        ...multipleSelect,
        content: { ...multipleSelect.content, minSelections: 1 },
      }),
      ['gamma'],
      0,
    ],
    ['multiple select duplicate malformed', multipleSelect, ['alpha', 'alpha'], 0],
    ['multiple select unknown malformed', multipleSelect, ['alpha', 'missing'], 0],
    ['true/false correct', trueFalse, false, 1],
    ['true/false incorrect', trueFalse, true, 0],
    ['true/false malformed', trueFalse, 'false', 0],
  ])('%s', (_name, primitive, response, expectedScore) => {
    expect(evaluatePrimitive(primitive, response).score).toBe(expectedScore)
  })

  it('supports all-or-nothing multiple-select scoring', () => {
    const primitive = multipleSelectPrimitiveSchema.parse({
      ...multipleSelect,
      content: { ...multipleSelect.content, scoringMode: 'all_or_nothing' },
    })

    expect(evaluatePrimitive(primitive, ['alpha']).score).toBe(0)
    expect(evaluatePrimitive(primitive, ['alpha', 'beta']).score).toBe(1)
  })
})

describe('choice assessment components', () => {
  it('reports multiple-choice drafts and obeys review reveal state', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()
    const { rerender } = render(
      <MultipleChoicePrimitive
        primitive={multipleChoice}
        attempt={1}
        mode="interactive"
        draft={null}
        onInteract={vi.fn()}
        onDraftChange={onDraftChange}
        onSubmit={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('radio', { name: 'Beta' }))
    expect(onDraftChange).toHaveBeenCalledWith('beta')

    const evaluation = evaluatePrimitive(multipleChoice, 'beta')
    rerender(
      <MultipleChoicePrimitive
        primitive={multipleChoice}
        attempt={1}
        mode="review"
        review={{ response: 'beta', evaluation, revealAnswer: false }}
        draft={null}
        disabled
        onInteract={vi.fn()}
        onDraftChange={vi.fn()}
        onSubmit={vi.fn()}
        onComplete={vi.fn()}
      />,
    )
    expect(screen.getByRole('radio', { name: /Beta/ })).toBeDisabled()
    expect(screen.getByText('Incorrect selection')).toBeVisible()
    expect(screen.queryByText('Correct answer')).not.toBeInTheDocument()

    rerender(
      <MultipleChoicePrimitive
        primitive={multipleChoice}
        attempt={1}
        mode="review"
        review={{ response: 'beta', evaluation, revealAnswer: true }}
        draft={null}
        disabled
        onInteract={vi.fn()}
        onDraftChange={vi.fn()}
        onSubmit={vi.fn()}
        onComplete={vi.fn()}
      />,
    )
    expect(screen.getByText('Correct answer')).toBeVisible()
  })

  it('reports multiple-select drafts and enforces minimum selections', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()
    const onSubmit = vi.fn()
    render(
      <MultipleSelectPrimitive
        primitive={multipleSelect}
        attempt={1}
        mode="interactive"
        draft={null}
        onInteract={vi.fn()}
        onDraftChange={onDraftChange}
        onSubmit={onSubmit}
        onComplete={vi.fn()}
      />,
    )

    const submit = screen.getByRole('button', { name: 'Check answer' })
    await user.click(screen.getByRole('checkbox', { name: 'Alpha' }))
    expect(onDraftChange).toHaveBeenLastCalledWith(['alpha'])
    expect(submit).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: 'Beta' }))
    expect(submit).toBeEnabled()
    await user.click(submit)
    expect(onSubmit).toHaveBeenCalledWith(['alpha', 'beta'])
  })

  it('reports and submits false as a boolean response', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()
    const onSubmit = vi.fn()
    render(
      <TrueFalsePrimitive
        primitive={trueFalse}
        attempt={1}
        mode="interactive"
        draft={null}
        onInteract={vi.fn()}
        onDraftChange={onDraftChange}
        onSubmit={onSubmit}
        onComplete={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('radio', { name: 'False' }))
    expect(onDraftChange).toHaveBeenCalledWith(false)
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(onSubmit).toHaveBeenCalledWith(false)
  })
})
