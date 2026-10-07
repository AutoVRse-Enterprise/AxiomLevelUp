import { useState } from 'react'

import { Button } from '@/components/ui'
import type { FillBlankPrimitive as FillBlankPrimitiveConfig } from '@/content/schema/primitives'
import { StepActionSlot } from '@/player/StepActionSlot'
import { ReviewMark } from '@/primitives/shared/ReviewMark'
import type { PrimitiveComponentProps } from '@/primitives/types'
import { usePresentation } from '@/primitives/presentation/PresentationContext'

function readResponses(
  primitive: FillBlankPrimitiveConfig,
  value: unknown,
): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    primitive.content.blanks.flatMap((blank) => {
      const response = (value as Record<string, unknown>)[blank.id]
      return typeof response === 'string' ? [[blank.id, response]] : []
    }),
  )
}

export function FillBlankPrimitive({
  primitive,
  mode,
  review,
  draft,
  disabled,
  onInteract,
  onDraftChange,
  onSubmit,
}: PrimitiveComponentProps<FillBlankPrimitiveConfig>) {
  const { labels } = usePresentation()
  const [draftResponses, setDraftResponses] = useState(() => readResponses(primitive, draft))
  const responses = mode === 'review' ? readResponses(primitive, review?.response) : draftResponses
  const readOnly = disabled || mode === 'review'
  const blanksById = new Map(
    primitive.content.blanks.map((blank, index) => [blank.id, { blank, index }] as const),
  )
  const complete = primitive.content.blanks.every((blank) => responses[blank.id]?.trim())
  const parts = primitive.content.text.split(/(\{\{[a-z0-9][a-z0-9_-]*\}\})/gu)

  const updateResponse = (blankId: string, value: string) => {
    const next = { ...responses, [blankId]: value }
    setDraftResponses(next)
    onDraftChange(next)
    onInteract({ name: 'blank_answered', key: blankId })
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (complete) onSubmit(responses)
      }}
    >
      <div className="whitespace-pre-wrap text-lg leading-loose text-neutral-950">
        {parts.map((part, partIndex) => {
          const tokenMatch = /^\{\{(.+)\}\}$/u.exec(part)
          if (!tokenMatch) return <span key={partIndex}>{part}</span>

          const blankId = tokenMatch[1]!
          const entry = blanksById.get(blankId)
          if (!entry) return null

          const { blank, index } = entry
          const label = `Blank ${index + 1}`
          const status = mode === 'review' ? review?.evaluation.items?.[blank.id] : undefined
          const fieldClasses =
            'mx-1 min-h-11 rounded-md border border-neutral-300 bg-white px-3 text-base text-neutral-950 focus-visible:border-brand-500 focus-visible:outline-2 disabled:bg-neutral-100'

          return (
            <span key={blank.id} className="inline-flex flex-wrap items-center gap-1 align-middle">
              <label className="sr-only" htmlFor={`${primitive.id}-${blank.id}`}>
                {label}
              </label>
              {blank.choices ? (
                <select
                  id={`${primitive.id}-${blank.id}`}
                  aria-label={label}
                  className={fieldClasses}
                  value={responses[blank.id] ?? ''}
                  disabled={readOnly}
                  onChange={(event) => updateResponse(blank.id, event.target.value)}
                >
                  <option value="">Choose an answer</option>
                  {blank.choices.map((choice) => (
                    <option key={choice} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`${primitive.id}-${blank.id}`}
                  aria-label={label}
                  className={`${fieldClasses} w-40 max-w-full`}
                  type="text"
                  autoComplete="off"
                  value={responses[blank.id] ?? ''}
                  disabled={readOnly}
                  onChange={(event) => updateResponse(blank.id, event.target.value)}
                />
              )}
              {status ? (
                <ReviewMark
                  status={status}
                  label={
                    status === 'correct'
                      ? 'Correct answer'
                      : status === 'incorrect'
                        ? 'Incorrect answer'
                        : 'Answer not provided'
                  }
                />
              ) : null}
              {mode === 'review' && review?.revealAnswer && status !== 'correct' ? (
                <span className="text-small font-medium text-success-700">
                  Accepted answer: {blank.accepted[0]}
                </span>
              ) : null}
            </span>
          )
        })}
      </div>

      {mode === 'interactive' ? (
        <StepActionSlot>
          <Button className="w-full sm:w-auto" type="submit" disabled={!complete || disabled}>
            {labels.checkAnswer}
          </Button>
        </StepActionSlot>
      ) : null}
    </form>
  )
}
