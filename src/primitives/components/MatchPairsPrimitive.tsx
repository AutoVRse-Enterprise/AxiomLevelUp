import { useState } from 'react'

import { Button } from '@/components/ui'
import type { MatchPairsPrimitive as MatchPairsPrimitiveConfig } from '@/content/schema/primitives'
import { StepActionSlot } from '@/player/StepActionSlot'
import { cn } from '@/lib/cn'
import { ReviewMark } from '@/primitives/shared/ReviewMark'
import type { PrimitiveComponentProps } from '@/primitives/types'
import { usePresentation } from '@/primitives/presentation/PresentationContext'

function readMatches(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
}

export function MatchPairsPrimitive({
  primitive,
  mode,
  review,
  draft,
  disabled,
  onInteract,
  onDraftChange,
  onSubmit,
}: PrimitiveComponentProps<MatchPairsPrimitiveConfig>) {
  const { labels } = usePresentation()
  const [matches, setMatches] = useState(() =>
    readMatches(mode === 'review' ? review?.response : draft),
  )
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null)
  const readOnly = disabled || mode === 'review'
  const rightById = new Map(primitive.content.right.map((item) => [item.id, item] as const))
  const rightNumberById = new Map(
    primitive.content.right.map((item, index) => [item.id, index + 1] as const),
  )
  const expectedByLeftId = new Map(
    primitive.content.pairs.map((pair) => [pair.leftId, pair.rightId] as const),
  )
  const usedRightIds = new Set(Object.values(matches))

  const updateMatches = (next: Record<string, string>) => {
    setMatches(next)
    onDraftChange(next)
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (Object.keys(matches).length === primitive.content.left.length) onSubmit(matches)
      }}
    >
      <fieldset disabled={readOnly}>
        <legend className="text-lg font-semibold text-neutral-950">
          {primitive.content.prompt}
        </legend>
        {mode === 'interactive' ? (
          <p className="mt-2 text-small text-neutral-600">
            Select an item on the left, then choose its numbered match.
          </p>
        ) : null}

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="grid content-start gap-2" aria-label="Items to match">
            {primitive.content.left.map((item) => {
              const rightId = matches[item.id]
              const matchedRight = rightId ? rightById.get(rightId) : undefined
              const status = review?.evaluation.items?.[item.id]
              const correctRight = rightById.get(expectedByLeftId.get(item.id) ?? '')
              return (
                <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                  <button
                    type="button"
                    aria-pressed={selectedLeftId === item.id}
                    className={cn(
                      'min-h-11 w-full rounded-md px-3 text-left font-medium focus-visible:outline-2',
                      selectedLeftId === item.id
                        ? 'bg-brand-100 text-brand-900'
                        : 'bg-neutral-50 text-neutral-900 hover:bg-neutral-100',
                    )}
                    onClick={() => {
                      setSelectedLeftId(item.id)
                      onInteract({ name: 'match_left_selected', key: item.id })
                    }}
                  >
                    {item.label}
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-small text-neutral-600">
                    <span>
                      {matchedRight
                        ? `Match ${rightNumberById.get(matchedRight.id)}: ${matchedRight.label}`
                        : 'Not matched'}
                    </span>
                    {mode === 'interactive' && matchedRight ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const next = { ...matches }
                          delete next[item.id]
                          updateMatches(next)
                          setSelectedLeftId(item.id)
                        }}
                      >
                        Remove match
                      </Button>
                    ) : null}
                    {mode === 'review' && status ? <ReviewMark status={status} /> : null}
                  </div>
                  {mode === 'review' &&
                  review?.revealAnswer &&
                  status !== 'correct' &&
                  correctRight ? (
                    <p className="mt-2 text-small font-medium text-success-700">
                      Correct match {rightNumberById.get(correctRight.id)}: {correctRight.label}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="grid content-start gap-2" aria-label="Numbered matches">
            {primitive.content.right.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Match ${index + 1}: ${item.label}`}
                disabled={!selectedLeftId || usedRightIds.has(item.id)}
                className="flex min-h-11 items-center gap-3 rounded-lg border border-neutral-300 bg-white p-3 text-left hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-65"
                onClick={() => {
                  if (!selectedLeftId) return
                  updateMatches({ ...matches, [selectedLeftId]: item.id })
                  onInteract({
                    name: 'match_right_selected',
                    key: `${selectedLeftId}:${item.id}`,
                  })
                  setSelectedLeftId(null)
                }}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-900"
                >
                  {index + 1}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      {mode === 'interactive' ? (
        <StepActionSlot>
          <Button
            className="w-full sm:w-auto"
            type="submit"
            disabled={Object.keys(matches).length !== primitive.content.left.length || disabled}
          >
            {labels.checkAnswer}
          </Button>
        </StepActionSlot>
      ) : null}
    </form>
  )
}
