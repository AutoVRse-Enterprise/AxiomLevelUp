import { useState } from 'react'

import { Button } from '@/components/ui'
import type { MultipleChoicePrimitive as MultipleChoicePrimitiveConfig } from '@/content/schema/primitives'
import { cn } from '@/lib/cn'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function MultipleChoicePrimitive({
  primitive,
  disabled,
  onInteract,
  onSubmit,
}: PrimitiveComponentProps<MultipleChoicePrimitiveConfig>) {
  const [selected, setSelected] = useState('')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (selected) onSubmit(selected)
      }}
    >
      <fieldset disabled={disabled} className="space-y-4">
        <legend className="text-title font-bold text-neutral-950">
          {primitive.content.prompt}
        </legend>
        <div className="space-y-3">
          {primitive.content.options.map((option) => (
            <label
              key={option.id}
              className={cn(
                'flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                selected === option.id
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-neutral-300 bg-white hover:border-brand-400',
              )}
            >
              <input
                type="radio"
                name={primitive.id}
                value={option.id}
                checked={selected === option.id}
                onChange={() => {
                  setSelected(option.id)
                  onInteract({ name: 'option_selected', key: option.id })
                }}
                className="size-5 accent-brand-700"
              />
              <span className="font-medium text-neutral-800">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Button className="mt-6 w-full sm:w-auto" type="submit" disabled={!selected || disabled}>
        Check answer
      </Button>
    </form>
  )
}
