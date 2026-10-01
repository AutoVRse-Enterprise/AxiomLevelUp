import { useState } from 'react'

import { Button } from '@/components/ui'
import type { NumericPrimitive as NumericPrimitiveConfig } from '@/content/schema/primitives'
import { ReviewMark } from '@/primitives/shared/ReviewMark'
import type { PrimitiveComponentProps } from '@/primitives/types'

function answerDescription(primitive: NumericPrimitiveConfig): string {
  const unit = primitive.content.unit ? ` ${primitive.content.unit}` : ''
  if ('range' in primitive.content) {
    return `${primitive.content.range.min} to ${primitive.content.range.max}${unit}`
  }

  const toleranceSuffix =
    primitive.content.tolerance.type === 'percent'
      ? `${primitive.content.tolerance.value}%`
      : `${primitive.content.tolerance.value}${unit}`
  return `${primitive.content.answer}${unit} ± ${toleranceSuffix}`
}

export function NumericPrimitive({
  primitive,
  mode,
  review,
  draft,
  disabled,
  onInteract,
  onDraftChange,
  onSubmit,
}: PrimitiveComponentProps<NumericPrimitiveConfig>) {
  const [draftResponse, setDraftResponse] = useState(typeof draft === 'string' ? draft : '')
  const response =
    mode === 'review'
      ? typeof review?.response === 'string'
        ? review.response
        : ''
      : draftResponse
  const readOnly = disabled || mode === 'review'
  const status = mode === 'review' ? review?.evaluation.items?.answer : undefined

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (response.trim()) onSubmit(response)
      }}
    >
      <fieldset disabled={readOnly}>
        <legend className="text-lg font-semibold text-neutral-950">
          {primitive.content.prompt}
        </legend>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`${primitive.id}-answer`}>
            Numeric answer
          </label>
          <input
            id={`${primitive.id}-answer`}
            aria-label="Numeric answer"
            className="min-h-11 w-48 max-w-full rounded-md border border-neutral-300 bg-white px-3 text-base text-neutral-950 focus-visible:border-brand-500 focus-visible:outline-2 disabled:bg-neutral-100"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={response}
            onChange={(event) => {
              setDraftResponse(event.target.value)
              onDraftChange(event.target.value)
              onInteract({ name: 'numeric_answered' })
            }}
          />
          {primitive.content.unit ? (
            <span className="font-medium text-neutral-700">{primitive.content.unit}</span>
          ) : null}
          {status ? (
            <ReviewMark
              status={status}
              label={status === 'correct' ? 'Correct answer' : 'Incorrect answer'}
            />
          ) : null}
        </div>
      </fieldset>

      {mode === 'review' && review?.revealAnswer && status !== 'correct' ? (
        <p className="mt-3 text-small font-medium text-success-700">
          Accepted answer: {answerDescription(primitive)}
        </p>
      ) : null}

      {mode === 'interactive' ? (
        <Button
          className="mt-6 w-full sm:w-auto"
          type="submit"
          disabled={!response.trim() || disabled}
        >
          Check answer
        </Button>
      ) : null}
    </form>
  )
}
