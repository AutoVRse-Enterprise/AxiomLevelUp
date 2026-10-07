import type { ReactNode } from 'react'

/* eslint-disable react-refresh/only-export-components -- Context helpers share this public module. */

import {
  defaultPresentationLabels,
  PresentationContext,
  type PresentationLabels,
  type PresentationVariant,
} from '@/primitives/presentation/labels'

export {
  defaultPresentationLabels,
  usePresentation,
  type PresentationLabels,
  type PresentationVariant,
} from '@/primitives/presentation/labels'

export function PresentationProvider({
  variant,
  labels,
  children,
}: {
  variant: PresentationVariant
  labels?: Partial<PresentationLabels>
  children: ReactNode
}) {
  return (
    <PresentationContext.Provider
      value={{ variant, labels: { ...defaultPresentationLabels, ...labels } }}
    >
      {children}
    </PresentationContext.Provider>
  )
}
