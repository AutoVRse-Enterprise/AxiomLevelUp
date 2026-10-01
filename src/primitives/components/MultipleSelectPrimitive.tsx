import { useMemo, useState } from 'react'

import { Button } from '@/components/ui'
import type { MultipleSelectPrimitive as MultipleSelectPrimitiveConfig } from '@/content/schema/primitives'
import { ChoiceList } from '@/primitives/shared/ChoiceList'
import { seededShuffle } from '@/primitives/shared/seededShuffle'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function MultipleSelectPrimitive({
  primitive,
  attempt,
  mode,
  review,
  draft,
  disabled,
  onInteract,
  onDraftChange,
  onSubmit,
}: PrimitiveComponentProps<MultipleSelectPrimitiveConfig>) {
  const initialResponse = mode === 'review' ? review?.response : draft
  const [selectedIds, setSelectedIds] = useState(
    new Set(
      Array.isArray(initialResponse)
        ? initialResponse.filter((value): value is string => typeof value === 'string')
        : [],
    ),
  )
  const readOnly = disabled || mode === 'review'
  const shuffleAttempt = mode === 'review' ? Math.max(0, attempt - 1) : attempt
  const options = useMemo(
    () =>
      primitive.content.shuffle
        ? seededShuffle(primitive.content.options, `${primitive.id}:${shuffleAttempt}`)
        : primitive.content.options,
    [primitive, shuffleAttempt],
  )

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (selectedIds.size >= primitive.content.minSelections) onSubmit([...selectedIds])
      }}
    >
      <ChoiceList
        legend={primitive.content.prompt}
        name={primitive.id}
        options={options}
        selectionMode="multiple"
        selectedIds={selectedIds}
        disabled={readOnly}
        reviewItems={mode === 'review' ? review?.evaluation.items : undefined}
        revealAnswer={review?.revealAnswer}
        onChange={(optionId) => {
          const next = new Set(selectedIds)
          if (next.has(optionId)) next.delete(optionId)
          else next.add(optionId)
          setSelectedIds(next)
          onDraftChange([...next])
          onInteract({ name: 'option_selected', key: optionId })
        }}
      />
      {mode === 'interactive' ? (
        <>
          <p className="mt-3 text-small text-neutral-600">
            Select at least {primitive.content.minSelections}.
          </p>
          <Button
            className="mt-6 w-full sm:w-auto"
            type="submit"
            disabled={selectedIds.size < primitive.content.minSelections || disabled}
          >
            Check answer
          </Button>
        </>
      ) : null}
    </form>
  )
}
