import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  classificationPrimitiveSchema,
  matchPairsPrimitiveSchema,
  orderingPrimitiveSchema,
} from '@/content/schema/primitives'
import { ClassificationPrimitive } from '@/primitives/components/ClassificationPrimitive'
import { MatchPairsPrimitive } from '@/primitives/components/MatchPairsPrimitive'
import { OrderingPrimitive } from '@/primitives/components/OrderingPrimitive'
import { evaluatePrimitive } from '@/primitives/definitions'

const base = {
  conceptIds: [],
  completion: { mode: 'answer' },
}

const classification = classificationPrimitiveSchema.parse({
  ...base,
  id: 'classify',
  type: 'classification',
  content: {
    prompt: 'Classify each item',
    categories: [
      { id: 'urgent', label: 'Urgent' },
      { id: 'routine', label: 'Routine' },
    ],
    items: [
      { id: 'acute', label: 'Acute signal', categoryId: 'urgent' },
      { id: 'follow-up', label: 'Routine follow-up', categoryId: 'routine' },
    ],
    scoringMode: 'partial',
    explanation: 'Use urgency.',
  },
})

const matching = matchPairsPrimitiveSchema.parse({
  ...base,
  id: 'matching',
  type: 'match_pairs',
  content: {
    prompt: 'Match each item',
    left: [
      { id: 'alpha', label: 'Alpha' },
      { id: 'beta', label: 'Beta' },
    ],
    right: [
      { id: 'one', label: 'One' },
      { id: 'two', label: 'Two' },
      { id: 'distractor', label: 'Distractor' },
    ],
    pairs: [
      { leftId: 'alpha', rightId: 'one' },
      { leftId: 'beta', rightId: 'two' },
    ],
    scoringMode: 'partial',
    explanation: 'Alpha is one and beta is two.',
  },
})

const ordering = orderingPrimitiveSchema.parse({
  ...base,
  id: 'sequence',
  type: 'ordering',
  content: {
    prompt: 'Put these in order',
    items: [
      { id: 'first', label: 'First step' },
      { id: 'second', label: 'Second step' },
      { id: 'third', label: 'Third step' },
    ],
    scoringMode: 'partial',
    explanation: 'Follow the sequence.',
  },
})

const callbacks = () => ({
  onInteract: vi.fn(),
  onDraftChange: vi.fn(),
  onSubmit: vi.fn(),
  onComplete: vi.fn(),
})

describe('structured assessment schemas', () => {
  it('applies defaults and enforces classification references and category limits', () => {
    expect(
      classificationPrimitiveSchema.parse({
        ...classification,
        content: { ...classification.content, scoringMode: undefined },
      }).content.scoringMode,
    ).toBe('all_or_nothing')
    expect(
      classificationPrimitiveSchema.safeParse({
        ...classification,
        content: {
          ...classification.content,
          items: [{ ...classification.content.items[0], categoryId: 'missing' }],
        },
      }).success,
    ).toBe(false)
    expect(
      classificationPrimitiveSchema.safeParse({
        ...classification,
        content: {
          ...classification.content,
          categories: [
            ...classification.content.categories,
            { id: 'three', label: 'Three' },
            { id: 'four', label: 'Four' },
            { id: 'five', label: 'Five' },
            { id: 'six', label: 'Six' },
          ],
        },
      }).success,
    ).toBe(false)
  })

  it('allows right-side distractors but rejects invalid or repeated pair references', () => {
    expect(matching.content.right).toHaveLength(3)
    expect(
      matchPairsPrimitiveSchema.safeParse({
        ...matching,
        content: {
          ...matching.content,
          pairs: [
            { leftId: 'alpha', rightId: 'one' },
            { leftId: 'beta', rightId: 'one' },
          ],
        },
      }).success,
    ).toBe(false)
    expect(
      matchPairsPrimitiveSchema.safeParse({
        ...matching,
        content: {
          ...matching.content,
          pairs: [{ leftId: 'alpha', rightId: 'missing' }],
        },
      }).success,
    ).toBe(false)
  })

  it('requires identified, uniquely referenced ordering items', () => {
    expect(
      orderingPrimitiveSchema.safeParse({
        ...ordering,
        content: { ...ordering.content, items: ['First', 'Second'] },
      }).success,
    ).toBe(false)
    expect(
      orderingPrimitiveSchema.safeParse({
        ...ordering,
        content: {
          ...ordering.content,
          items: [
            { id: 'same', label: 'First' },
            { id: 'same', label: 'Second' },
          ],
        },
      }).success,
    ).toBe(false)
  })
})

describe('structured assessment evaluators', () => {
  it.each([
    ['classification exact', classification, { acute: 'urgent', 'follow-up': 'routine' }, 1],
    ['classification partial', classification, { acute: 'urgent', 'follow-up': 'urgent' }, 0.5],
    ['classification incomplete', classification, { acute: 'urgent' }, 0],
    ['matching exact', matching, { alpha: 'one', beta: 'two' }, 1],
    ['matching partial', matching, { alpha: 'one', beta: 'distractor' }, 0.5],
    ['matching repeated target', matching, { alpha: 'one', beta: 'one' }, 0],
    ['ordering exact', ordering, ['first', 'second', 'third'], 1],
    ['ordering partial positions', ordering, ['first', 'third', 'second'], 1 / 3],
    ['ordering malformed', ordering, ['first', 'first', 'third'], 0],
  ])('%s', (_name, primitive, response, score) => {
    expect(evaluatePrimitive(primitive, response).score).toBe(score)
  })

  it('supports all-or-nothing classification, matching and ordering modes', () => {
    const allOrNothingClassification = classificationPrimitiveSchema.parse({
      ...classification,
      content: { ...classification.content, scoringMode: 'all_or_nothing' },
    })
    const allOrNothingMatching = matchPairsPrimitiveSchema.parse({
      ...matching,
      content: { ...matching.content, scoringMode: 'all_or_nothing' },
    })
    const exactOrdering = orderingPrimitiveSchema.parse({
      ...ordering,
      content: { ...ordering.content, scoringMode: 'exact' },
    })

    expect(
      evaluatePrimitive(allOrNothingClassification, {
        acute: 'urgent',
        'follow-up': 'urgent',
      }).score,
    ).toBe(0)
    expect(
      evaluatePrimitive(allOrNothingMatching, { alpha: 'one', beta: 'distractor' }).score,
    ).toBe(0)
    expect(evaluatePrimitive(exactOrdering, ['first', 'third', 'second']).score).toBe(0)
  })
})

describe('structured assessment components', () => {
  it('assigns and unassigns classification drafts before submission', async () => {
    const user = userEvent.setup()
    const handlers = callbacks()
    render(
      <ClassificationPrimitive
        primitive={classification}
        attempt={1}
        mode="interactive"
        draft={null}
        {...handlers}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Acute signal' }))
    await user.click(screen.getByRole('button', { name: 'Urgent' }))
    expect(handlers.onDraftChange).toHaveBeenLastCalledWith({ acute: 'urgent' })
    await user.click(screen.getByRole('button', { name: 'Unassign' }))
    expect(handlers.onDraftChange).toHaveBeenLastCalledWith({})

    await user.click(screen.getByRole('button', { name: 'Urgent' }))
    await user.click(screen.getByRole('button', { name: 'Routine follow-up' }))
    await user.click(screen.getByRole('button', { name: 'Routine' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(handlers.onSubmit).toHaveBeenCalledWith({
      acute: 'urgent',
      'follow-up': 'routine',
    })
  })

  it('matches left selections to numbered right items and includes distractors', async () => {
    const user = userEvent.setup()
    const handlers = callbacks()
    render(
      <MatchPairsPrimitive
        primitive={matching}
        attempt={1}
        mode="interactive"
        draft={null}
        {...handlers}
      />,
    )

    expect(screen.getByRole('button', { name: 'Match 3: Distractor' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Alpha' }))
    await user.click(screen.getByRole('button', { name: 'Match 1: One' }))
    await user.click(screen.getByRole('button', { name: 'Beta' }))
    await user.click(screen.getByRole('button', { name: 'Match 2: Two' }))
    expect(handlers.onDraftChange).toHaveBeenLastCalledWith({ alpha: 'one', beta: 'two' })
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(handlers.onSubmit).toHaveBeenCalledWith({ alpha: 'one', beta: 'two' })
  })

  it('restores assignment drafts and reveals review corrections only when allowed', () => {
    const handlers = callbacks()
    const { rerender } = render(
      <ClassificationPrimitive
        primitive={classification}
        attempt={1}
        mode="interactive"
        draft={{ acute: 'urgent' }}
        {...handlers}
      />,
    )
    expect(screen.getByText('Category: Urgent')).toBeVisible()

    const response = { acute: 'routine', 'follow-up': 'routine' }
    rerender(
      <ClassificationPrimitive
        primitive={classification}
        attempt={1}
        mode="review"
        review={{
          response,
          evaluation: evaluatePrimitive(classification, response),
          revealAnswer: true,
        }}
        draft={null}
        disabled
        {...callbacks()}
      />,
    )
    expect(screen.getByText('Correct category: Urgent')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Acute signal' })).toBeDisabled()
  })

  it('renders matching review marks without exposing a hidden answer', () => {
    const response = { alpha: 'distractor', beta: 'two' }
    render(
      <MatchPairsPrimitive
        primitive={matching}
        attempt={1}
        mode="review"
        review={{
          response,
          evaluation: evaluatePrimitive(matching, response),
          revealAnswer: false,
        }}
        draft={null}
        disabled
        {...callbacks()}
      />,
    )

    expect(screen.getByText('Incorrect selection')).toBeVisible()
    expect(screen.queryByText(/Correct match 1/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeDisabled()
  })

  it('starts ordering deterministically unsolved and keeps move controls available', async () => {
    const user = userEvent.setup()
    const firstHandlers = callbacks()
    const { unmount } = render(
      <OrderingPrimitive
        primitive={ordering}
        attempt={1}
        mode="interactive"
        draft={null}
        {...firstHandlers}
      />,
    )
    const firstOrder = screen
      .getAllByRole('listitem')
      .map((item) => within(item).getByText(/step$/).textContent)
    expect(firstOrder).not.toEqual(['First step', 'Second step', 'Third step'])
    expect(screen.getAllByRole('button', { name: 'Move up' })).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: 'Move down' })).toHaveLength(3)

    const firstRow = screen.getAllByRole('listitem')[0]!
    await user.click(within(firstRow).getByRole('button', { name: 'Move down' }))
    expect(firstHandlers.onDraftChange).toHaveBeenCalledOnce()
    expect(screen.getByText(/moved to position 2/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(firstHandlers.onSubmit).toHaveBeenCalledOnce()
    unmount()

    render(
      <OrderingPrimitive
        primitive={ordering}
        attempt={1}
        mode="interactive"
        draft={null}
        {...callbacks()}
      />,
    )
    const secondOrder = screen
      .getAllByRole('listitem')
      .map((item) => within(item).getByText(/step$/).textContent)
    expect(secondOrder).toEqual(firstOrder)
  })

  it('restores an ordering draft and keeps review movement controls present but disabled', () => {
    const response = ['first', 'third', 'second']
    render(
      <OrderingPrimitive
        primitive={ordering}
        attempt={1}
        mode="review"
        review={{
          response,
          evaluation: evaluatePrimitive(ordering, response),
          revealAnswer: true,
        }}
        draft={null}
        disabled
        {...callbacks()}
      />,
    )

    const labels = screen
      .getAllByRole('listitem')
      .map((item) => within(item).getByText(/step$/).textContent)
    expect(labels).toEqual(['First step', 'Third step', 'Second step'])
    expect(screen.getAllByRole('button', { name: 'Move up' })).toHaveLength(3)
    screen
      .getAllByRole('button', { name: 'Move up' })
      .forEach((button) => expect(button).toBeDisabled())
    expect(screen.getByText('Correct position: 2')).toBeVisible()
  })
})
