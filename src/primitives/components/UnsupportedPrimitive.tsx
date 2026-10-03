import { Puzzle } from 'lucide-react'

import { Button } from '@/components/ui'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function UnsupportedPrimitive({ onComplete }: PrimitiveComponentProps) {
  return (
    <section className="rounded-xl border border-warning-600 bg-warning-50 p-5" role="status">
      <Puzzle aria-hidden="true" className="text-warning-700" />
      <h2 className="mt-3 text-heading font-bold text-neutral-950">
        This activity type is not supported
      </h2>
      <p className="mt-2 text-neutral-700">
        This learning item is unavailable in this version. You can continue to the next activity.
      </p>
      <Button className="mt-5" onClick={onComplete}>
        Continue
      </Button>
    </section>
  )
}
