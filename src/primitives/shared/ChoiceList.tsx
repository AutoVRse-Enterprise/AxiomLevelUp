import { cn } from '@/lib/cn'
import { ReviewMark } from '@/primitives/shared/ReviewMark'
import type { EvaluationResult } from '@/primitives/types'

export interface ChoiceOption {
  id: string
  label: string
}

interface ChoiceListProps {
  legend: string
  name: string
  options: readonly ChoiceOption[]
  selectionMode: 'single' | 'multiple'
  selectedIds: ReadonlySet<string>
  disabled?: boolean
  reviewItems?: EvaluationResult['items']
  revealAnswer?: boolean
  onChange: (optionId: string) => void
}

export function ChoiceList({
  legend,
  name,
  options,
  selectionMode,
  selectedIds,
  disabled,
  reviewItems,
  revealAnswer,
  onChange,
}: ChoiceListProps) {
  return (
    <fieldset disabled={disabled} className="space-y-4">
      <legend className="text-title font-bold text-neutral-950">{legend}</legend>
      <div className="space-y-3">
        {options.map((option) => {
          const selected = selectedIds.has(option.id)
          const reviewStatus = reviewItems?.[option.id]
          const visibleReviewStatus =
            reviewStatus === 'missed' && !revealAnswer ? undefined : reviewStatus
          const labelId = `${name}-${option.id}-label`

          return (
            <label
              key={option.id}
              className={cn(
                'flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                selected
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-neutral-300 bg-white hover:border-brand-400',
                disabled && 'cursor-default',
                visibleReviewStatus === 'correct' && 'border-success-600 bg-success-50',
                visibleReviewStatus === 'incorrect' && 'border-danger-600 bg-danger-50',
                visibleReviewStatus === 'missed' && 'border-success-600 border-dashed',
              )}
            >
              <input
                type={selectionMode === 'single' ? 'radio' : 'checkbox'}
                name={name}
                value={option.id}
                checked={selected}
                aria-labelledby={labelId}
                onChange={() => onChange(option.id)}
                className="size-5 shrink-0 accent-brand-700"
              />
              <span id={labelId} className="font-medium text-neutral-800">
                {option.label}
              </span>
              {visibleReviewStatus ? <ReviewMark status={visibleReviewStatus} /> : null}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
