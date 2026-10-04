import { useState } from 'react'

import type {
  CaseConfidence,
  CaseDifferentialPrimitive as CaseDifferentialPrimitiveConfig,
} from '@/content/schema/primitives'
import type { PrimitiveComponentProps } from '@/primitives/types'

const confidenceOptions: Array<{ value: CaseConfidence; label: string }> = [
  { value: 'unlikely', label: 'Unlikely' },
  { value: 'possible', label: 'Possible' },
  { value: 'likely', label: 'Likely' },
]

function readRatings(value: unknown): Record<string, CaseConfidence> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, CaseConfidence] =>
        entry[1] === 'unlikely' || entry[1] === 'possible' || entry[1] === 'likely',
    ),
  )
}

export function CaseDifferentialPrimitive({
  primitive,
  mode,
  review,
  draft,
  disabled,
  onDraftChange,
  onInteract,
  onComplete,
}: PrimitiveComponentProps<CaseDifferentialPrimitiveConfig>) {
  const [draftRatings, setDraftRatings] = useState(() => readRatings(draft))
  const ratings = mode === 'review' ? readRatings(review?.response) : draftRatings
  const readOnly = disabled || mode === 'review'

  return (
    <section>
      <h2 className="text-title font-bold text-neutral-950">{primitive.content.prompt}</h2>
      <p className="mt-2 text-small text-neutral-600">
        Rate every possibility before continuing. You can revise these ratings later.
      </p>
      <div className="mt-5 space-y-3">
        {primitive.content.hypotheses.map((hypothesis) => (
          <fieldset key={hypothesis.id} className="rounded-lg border border-neutral-200 p-3">
            <legend className="px-1 font-semibold text-neutral-900">{hypothesis.label}</legend>
            <div className="grid grid-cols-3 gap-1" role="group">
              {confidenceOptions.map((option) => {
                const selected = ratings[hypothesis.id] === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`min-h-11 rounded-md border px-2 py-2 text-small font-semibold focus-visible:outline-2 ${
                      selected
                        ? 'border-brand-700 bg-brand-700 text-white'
                        : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50'
                    }`}
                    aria-pressed={selected}
                    disabled={readOnly}
                    onClick={() => {
                      const next = { ...ratings, [hypothesis.id]: option.value }
                      setDraftRatings(next)
                      onDraftChange(next)
                      onInteract({
                        name: 'case_hypothesis_rated',
                        hypothesisId: hypothesis.id,
                        confidence: option.value,
                        key: `${hypothesis.id}:${option.value}`,
                      })
                      if (
                        primitive.content.hypotheses.every(
                          ({ id }) => typeof next[id] === 'string',
                        )
                      ) {
                        onComplete()
                      }
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  )
}
