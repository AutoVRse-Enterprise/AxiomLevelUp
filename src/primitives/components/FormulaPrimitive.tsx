import katex from 'katex'
import 'katex/contrib/mhchem'
import 'katex/dist/katex.min.css'
import { useEffect } from 'react'

import type { FormulaPrimitive as FormulaPrimitiveConfig } from '@/content/schema/primitives'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function FormulaPrimitive({
  primitive,
  onComplete,
}: PrimitiveComponentProps<FormulaPrimitiveConfig>) {
  useEffect(onComplete, [onComplete])

  return (
    <section className="space-y-5">
      {primitive.content.title ? (
        <h3 className="font-semibold text-neutral-950">{primitive.content.title}</h3>
      ) : null}
      <div className="space-y-4">
        {primitive.content.expressions.map((expression) => (
          <div
            key={expression.id}
            className="overflow-x-auto rounded-xl border border-neutral-200 bg-white p-4 text-neutral-950"
            role="math"
            aria-label={expression.ariaLabel}
          >
            <div
              aria-hidden="true"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(expression.tex, {
                  displayMode: expression.display,
                  trust: false,
                  throwOnError: false,
                  strict: 'warn',
                }),
              }}
            />
          </div>
        ))}
      </div>
      {primitive.content.variables.length > 0 ? (
        <dl className="grid gap-3 rounded-xl bg-neutral-100 p-4 sm:grid-cols-[max-content_1fr]">
          {primitive.content.variables.map((variable) => (
            <div key={variable.symbol} className="grid gap-1 sm:col-span-2 sm:grid-cols-subgrid">
              <dt className="font-semibold text-neutral-950">{variable.symbol}</dt>
              <dd className="text-neutral-700">
                {variable.definition}
                {variable.unit ? ` (${variable.unit})` : ''}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}
