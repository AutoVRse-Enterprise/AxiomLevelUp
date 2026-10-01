import { Puzzle } from 'lucide-react'
import { useEffect } from 'react'

import type { PrimitiveComponentProps } from '@/primitives/types'

export function UnsupportedPrimitive({ primitive, onComplete }: PrimitiveComponentProps) {
  useEffect(onComplete, [onComplete])

  return (
    <section className="rounded-xl border border-warning-600 bg-warning-50 p-5" role="status">
      <Puzzle aria-hidden="true" className="text-warning-700" />
      <h2 className="mt-3 text-heading font-bold text-neutral-950">
        This activity type is not supported
      </h2>
      <p className="mt-2 text-neutral-700">
        <code>{primitive.type}</code> is not available in this runtime yet. You can continue to the
        next activity.
      </p>
    </section>
  )
}
