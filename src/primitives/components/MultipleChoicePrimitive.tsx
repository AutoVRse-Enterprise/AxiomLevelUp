import { useMemo, useState } from 'react'

import { Button } from '@/components/ui'
import type { MultipleChoicePrimitive as MultipleChoicePrimitiveConfig } from '@/content/schema/primitives'
import { StepActionSlot } from '@/player/StepActionSlot'
import { ChoiceList } from '@/primitives/shared/ChoiceList'
import { seededShuffle } from '@/primitives/shared/seededShuffle'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function MultipleChoicePrimitive({
  primitive,
  attempt,
  mode,
  review,
  draft,
  disabled,
  onInteract,
  onDraftChange,
  onSubmit,
}: PrimitiveComponentProps<MultipleChoicePrimitiveConfig>) {
  const initialResponse = mode === 'review' ? review?.response : draft
  const [selected, setSelected] = useState(
    typeof initialResponse === 'string' ? initialResponse : '',
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
        if (selected) onSubmit(selected)
      }}
    >
      <ChoiceList
        legend={primitive.content.prompt}
        name={primitive.id}
        options={options}
        selectionMode="single"
        selectedIds={new Set(selected ? [selected] : [])}
        disabled={readOnly}
        reviewItems={mode === 'review' ? review?.evaluation.items : undefined}
        revealAnswer={review?.revealAnswer}
        onChange={(optionId) => {
          setSelected(optionId)
          onDraftChange(optionId)
          onInteract({ name: 'option_selected', key: optionId })
        }}
      />
      {mode === 'interactive' ? (
        <StepActionSlot>
          <Button className="w-full sm:w-auto" type="submit" disabled={!selected || disabled}>
            Check answer
          </Button>
        </StepActionSlot>
      ) : null}
    </form>
  )
}
