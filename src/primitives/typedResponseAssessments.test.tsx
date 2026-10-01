import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { fillBlankPrimitiveSchema, numericPrimitiveSchema } from '@/content/schema/primitives'
import { FillBlankPrimitive } from '@/primitives/components/FillBlankPrimitive'
import { NumericPrimitive } from '@/primitives/components/NumericPrimitive'
import { evaluatePrimitive } from '@/primitives/definitions'
import {
  normalizeTextResponse,
  parseNumericResponse,
} from '@/primitives/definitions/typedResponseEvaluation'

const base = {
  conceptIds: [],
  completion: { mode: 'answer' },
}

const fillBlank = fillBlankPrimitiveSchema.parse({
  ...base,
  id: 'complete-sentence',
  type: 'fill_blank',
  content: {
    text: 'The {{modality}} scan used {{contrast}} contrast.',
    blanks: [
      { id: 'modality', accepted: ['MR', 'MRI'] },
      {
        id: 'contrast',
        accepted: ['gadolinium'],
        caseSensitive: true,
        choices: ['iodine', 'gadolinium'],
      },
    ],
    explanation: 'MRI may use gadolinium contrast.',
  },
})

const absoluteNumeric = numericPrimitiveSchema.parse({
  ...base,
  id: 'measurement',
  type: 'numeric',
  content: {
    prompt: 'Enter the measurement.',
    answer: 10,
    tolerance: { type: 'absolute', value: 0.5 },
    unit: 'mm',
    explanation: 'The expected measurement is 10 mm.',
  },
})

const callbacks = () => ({
  onInteract: vi.fn(),
  onDraftChange: vi.fn(),
  onSubmit: vi.fn(),
  onComplete: vi.fn(),
})

describe('typed-response schemas', () => {
  it('defaults fill-blank matching and enforces exact, unique token definitions', () => {
    expect(fillBlank.content.blanks[0]?.caseSensitive).toBe(false)
    expect(
      fillBlankPrimitiveSchema.safeParse({
        ...fillBlank,
        content: {
          ...fillBlank.content,
          text: 'Only {{modality}} appears.',
        },
      }).success,
    ).toBe(false)
    expect(
      fillBlankPrimitiveSchema.safeParse({
        ...fillBlank,
        content: {
          ...fillBlank.content,
          text: '{{modality}} and {{modality}}',
          blanks: [fillBlank.content.blanks[0], fillBlank.content.blanks[0]],
        },
      }).success,
    ).toBe(false)
    expect(
      fillBlankPrimitiveSchema.safeParse({
        ...fillBlank,
        content: { ...fillBlank.content, text: 'Invalid {{Blank Id}} token.' },
      }).success,
    ).toBe(false)
  })

  it('requires exactly one valid numeric answer policy', () => {
    expect(absoluteNumeric.content.unit).toBe('mm')
    expect(
      numericPrimitiveSchema.safeParse({
        ...absoluteNumeric,
        content: {
          ...absoluteNumeric.content,
          range: { min: 9, max: 11 },
        },
      }).success,
    ).toBe(false)
    expect(
      numericPrimitiveSchema.safeParse({
        ...absoluteNumeric,
        content: {
          ...absoluteNumeric.content,
          tolerance: { type: 'percent', value: -1 },
        },
      }).success,
    ).toBe(false)
    expect(
      numericPrimitiveSchema.safeParse({
        ...absoluteNumeric,
        content: {
          prompt: 'Enter a value.',
          range: { min: 2, max: 1 },
          explanation: 'The range is ordered.',
        },
      }).success,
    ).toBe(false)
  })
})

describe('typed-response evaluators', () => {
  it('normalizes fill-blank text with NFKC, whitespace folding and optional case sensitivity', () => {
    expect(normalizeTextResponse('  ＭＲ　 scan  ')).toBe('mr scan')
    expect(normalizeTextResponse('  MRI  ', true)).toBe('MRI')
    expect(evaluatePrimitive(fillBlank, { modality: 'ｍｒ', contrast: 'gadolinium' }).score).toBe(1)
    expect(evaluatePrimitive(fillBlank, { modality: 'MRI', contrast: 'Gadolinium' }).score).toBe(
      0.5,
    )
    expect(evaluatePrimitive(fillBlank, { modality: 'MRI' }).score).toBe(0)
    expect(
      evaluatePrimitive(fillBlank, {
        modality: 'MRI',
        contrast: 'gadolinium',
        extra: 'answer',
      }).score,
    ).toBe(0)
  })

  it.each([
    ['12', 12],
    ['-12.5', -12.5],
    ['+12,5', 12.5],
    [',5', 0.5],
    ['1,234.5', null],
    ['1,2,3', null],
    ['1e3', null],
    ['Infinity', null],
    [12, null],
  ])('parses locale-safe numeric response %j', (response, expected) => {
    expect(parseNumericResponse(response)).toBe(expected)
  })

  it('evaluates inclusive absolute, percent and range boundaries from raw strings', () => {
    const percentNumeric = numericPrimitiveSchema.parse({
      ...absoluteNumeric,
      id: 'percent',
      content: {
        ...absoluteNumeric.content,
        answer: 200,
        tolerance: { type: 'percent', value: 5 },
      },
    })
    const rangeNumeric = numericPrimitiveSchema.parse({
      ...absoluteNumeric,
      id: 'range',
      content: {
        prompt: 'Enter a value.',
        range: { min: -2, max: 2 },
        explanation: 'Values from -2 to 2 are accepted.',
      },
    })

    expect(evaluatePrimitive(absoluteNumeric, '10,5').score).toBe(1)
    expect(evaluatePrimitive(absoluteNumeric, '10.51').score).toBe(0)
    expect(evaluatePrimitive(percentNumeric, '190').score).toBe(1)
    expect(evaluatePrimitive(percentNumeric, '210.1').score).toBe(0)
    expect(evaluatePrimitive(rangeNumeric, '-2').score).toBe(1)
    expect(evaluatePrimitive(rangeNumeric, '2').score).toBe(1)
    expect(evaluatePrimitive(rangeNumeric, 2).score).toBe(0)
  })
})

describe('typed-response components', () => {
  it('uses generic blank labels, persists drafts and submits all answers', async () => {
    const user = userEvent.setup()
    const handlers = callbacks()
    render(
      <FillBlankPrimitive
        primitive={fillBlank}
        attempt={1}
        mode="interactive"
        draft={{ modality: 'M' }}
        {...handlers}
      />,
    )

    const textBlank = screen.getByRole('textbox', { name: 'Blank 1' })
    const choiceBlank = screen.getByRole('combobox', { name: 'Blank 2' })
    expect(textBlank).toHaveValue('M')
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled()

    await user.type(textBlank, 'RI')
    await user.selectOptions(choiceBlank, 'gadolinium')
    expect(handlers.onDraftChange).toHaveBeenLastCalledWith({
      modality: 'MRI',
      contrast: 'gadolinium',
    })
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(handlers.onSubmit).toHaveBeenCalledWith({
      modality: 'MRI',
      contrast: 'gadolinium',
    })
  })

  it('keeps fill-blank corrections hidden until reveal is enabled', () => {
    const response = { modality: 'CT', contrast: 'gadolinium' }
    const evaluation = evaluatePrimitive(fillBlank, response)
    const { rerender } = render(
      <FillBlankPrimitive
        primitive={fillBlank}
        attempt={1}
        mode="review"
        review={{ response, evaluation, revealAnswer: false }}
        draft={null}
        disabled
        {...callbacks()}
      />,
    )

    expect(screen.getByText('Incorrect answer')).toBeVisible()
    expect(screen.queryByText(/Accepted answer:/)).not.toBeInTheDocument()
    rerender(
      <FillBlankPrimitive
        primitive={fillBlank}
        attempt={1}
        mode="review"
        review={{ response, evaluation, revealAnswer: true }}
        draft={null}
        disabled
        {...callbacks()}
      />,
    )
    expect(screen.getByText('Accepted answer: MR')).toBeVisible()
  })

  it('submits a raw decimal string and renders numeric review without leaking answers', async () => {
    const user = userEvent.setup()
    const handlers = callbacks()
    const { unmount } = render(
      <NumericPrimitive
        primitive={absoluteNumeric}
        attempt={1}
        mode="interactive"
        draft={null}
        {...handlers}
      />,
    )

    const input = screen.getByRole('textbox', { name: 'Numeric answer' })
    expect(input).toHaveAttribute('inputmode', 'decimal')
    await user.type(input, '10,5')
    expect(handlers.onDraftChange).toHaveBeenLastCalledWith('10,5')
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(handlers.onSubmit).toHaveBeenCalledWith('10,5')
    unmount()

    render(
      <NumericPrimitive
        primitive={absoluteNumeric}
        attempt={1}
        mode="review"
        review={{
          response: '11',
          evaluation: evaluatePrimitive(absoluteNumeric, '11'),
          revealAnswer: false,
        }}
        draft={null}
        disabled
        {...callbacks()}
      />,
    )
    expect(screen.getByRole('textbox', { name: 'Numeric answer' })).toBeDisabled()
    expect(screen.queryByText(/Accepted answer:/)).not.toBeInTheDocument()
  })

  it('reveals the configured numeric answer only when allowed', () => {
    const response = '11'
    render(
      <NumericPrimitive
        primitive={absoluteNumeric}
        attempt={1}
        mode="review"
        review={{
          response,
          evaluation: evaluatePrimitive(absoluteNumeric, response),
          revealAnswer: true,
        }}
        draft={null}
        disabled
        {...callbacks()}
      />,
    )

    expect(screen.getByText('Incorrect answer')).toBeVisible()
    expect(screen.getByText('Accepted answer: 10 mm ± 0.5 mm')).toBeVisible()
  })
})
