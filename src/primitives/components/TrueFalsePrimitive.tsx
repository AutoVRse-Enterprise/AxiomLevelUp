import { useState } from 'react'

import { Button } from '@/components/ui'
import type { TrueFalsePrimitive as TrueFalsePrimitiveConfig } from '@/content/schema/primitives'
import { ChoiceList } from '@/primitives/shared/ChoiceList'
import type { PrimitiveComponentProps } from '@/primitives/types'

const options = [
  { id: 'true', label: 'True' },
  { id: 'false', label: 'False' },
] as const

export function TrueFalsePrimitive({
  primitive,
  mode,
  review,
  draft,
  disabled,
  onInteract,
  onDraftChange,
  onSubmit,
}: PrimitiveComponentProps<TrueFalsePrimitiveConfig>) {
  const initialResponse = mode === 'review' ? review?.response : draft
  const [selected, setSelected] = useState(
    typeof initialResponse === 'boolean' ? String(initialResponse) : '',
  )
  const readOnly = disabled || mode === 'review'

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (selected) onSubmit(selected === 'true')
      }}
    >
      <ChoiceList
        legend={primitive.content.statement}
        name={primitive.id}
        options={options}
        selectionMode="single"
        selectedIds={new Set(selected ? [selected] : [])}
        disabled={readOnly}
        reviewItems={mode === 'review' ? review?.evaluation.items : undefined}
        revealAnswer={review?.revealAnswer}
        onChange={(optionId) => {
          const response = optionId === 'true'
          setSelected(optionId)
          onDraftChange(response)
          onInteract({ name: 'option_selected', key: optionId })
        }}
      />
      {mode === 'interactive' ? (
        <Button className="mt-6 w-full sm:w-auto" type="submit" disabled={!selected || disabled}>
          Check answer
        </Button>
      ) : null}
    </form>
  )
}
