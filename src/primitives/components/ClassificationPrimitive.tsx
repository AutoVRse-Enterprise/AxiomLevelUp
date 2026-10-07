import { useState } from 'react'

import { Button } from '@/components/ui'
import type { ClassificationPrimitive as ClassificationPrimitiveConfig } from '@/content/schema/primitives'
import { cn } from '@/lib/cn'
import { StepActionSlot } from '@/player/StepActionSlot'
import { ReviewMark } from '@/primitives/shared/ReviewMark'
import type { PrimitiveComponentProps } from '@/primitives/types'
import { usePresentation } from '@/primitives/presentation/PresentationContext'

function readAssignments(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  )
}

export function ClassificationPrimitive({
  primitive,
  mode,
  review,
  draft,
  disabled,
  onInteract,
  onDraftChange,
  onSubmit,
}: PrimitiveComponentProps<ClassificationPrimitiveConfig>) {
  const { labels } = usePresentation()
  const [assignments, setAssignments] = useState(() =>
    readAssignments(mode === 'review' ? review?.response : draft),
  )
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const readOnly = disabled || mode === 'review'
  const categoryLabels = new Map(
    primitive.content.categories.map((category) => [category.id, category.label] as const),
  )

  const updateAssignments = (next: Record<string, string>) => {
    setAssignments(next)
    onDraftChange(next)
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (Object.keys(assignments).length === primitive.content.items.length) {
          onSubmit(assignments)
        }
      }}
    >
      <fieldset disabled={readOnly}>
        <legend className="text-lg font-semibold text-neutral-950">
          {primitive.content.prompt}
        </legend>
        {mode === 'interactive' ? (
          <p className="mt-2 text-small text-neutral-600">
            Select an item, then choose its category.
          </p>
        ) : null}

        <div className="mt-5 grid gap-3">
          {primitive.content.items.map((item) => {
            const assignedCategoryId = assignments[item.id]
            const status = review?.evaluation.items?.[item.id]
            const correctCategory = categoryLabels.get(item.categoryId)
            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3"
              >
                <button
                  type="button"
                  aria-pressed={selectedItemId === item.id}
                  className={cn(
                    'min-h-11 flex-1 rounded-md px-3 text-left font-medium focus-visible:outline-2',
                    selectedItemId === item.id
                      ? 'bg-brand-100 text-brand-900'
                      : 'bg-neutral-50 text-neutral-900 hover:bg-neutral-100',
                  )}
                  onClick={() => {
                    setSelectedItemId(item.id)
                    onInteract({ name: 'classification_item_selected', key: item.id })
                  }}
                >
                  {item.label}
                </button>
                <span className="text-small text-neutral-600">
                  {assignedCategoryId
                    ? `Category: ${categoryLabels.get(assignedCategoryId)}`
                    : 'Not assigned'}
                </span>
                {mode === 'interactive' && assignedCategoryId ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const next = { ...assignments }
                      delete next[item.id]
                      updateAssignments(next)
                      setSelectedItemId(item.id)
                    }}
                  >
                    Unassign
                  </Button>
                ) : null}
                {mode === 'review' && status ? <ReviewMark status={status} /> : null}
                {mode === 'review' &&
                review?.revealAnswer &&
                status !== 'correct' &&
                correctCategory ? (
                  <p className="w-full text-small font-medium text-success-700">
                    Correct category: {correctCategory}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>

        {mode === 'interactive' ? (
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Categories">
            {primitive.content.categories.map((category) => (
              <Button
                key={category.id}
                variant="secondary"
                disabled={!selectedItemId || disabled}
                onClick={() => {
                  if (!selectedItemId) return
                  updateAssignments({ ...assignments, [selectedItemId]: category.id })
                  onInteract({
                    name: 'classification_category_selected',
                    key: `${selectedItemId}:${category.id}`,
                  })
                  setSelectedItemId(null)
                }}
              >
                {category.label}
              </Button>
            ))}
          </div>
        ) : null}
      </fieldset>

      {mode === 'interactive' ? (
        <StepActionSlot>
          <Button
            className="w-full sm:w-auto"
            type="submit"
            disabled={
              Object.keys(assignments).length !== primitive.content.items.length || disabled
            }
          >
            {labels.checkAnswer}
          </Button>
        </StepActionSlot>
      ) : null}
    </form>
  )
}
