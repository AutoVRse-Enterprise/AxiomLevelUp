import { createContext, createElement, useContext, type ReactNode } from 'react'

import type { CaseFinding } from '@/content/schema'

const AnatomyFindingContext = createContext<
  ReadonlyMap<string, readonly CaseFinding[]> | undefined
>(undefined)

export function AnatomyFindingProvider({
  findingsByStepId,
  children,
}: {
  findingsByStepId: ReadonlyMap<string, readonly CaseFinding[]>
  children: ReactNode
}) {
  return createElement(AnatomyFindingContext.Provider, { value: findingsByStepId }, children)
}

export function useStepFindings(stepId: string): readonly CaseFinding[] {
  return useContext(AnatomyFindingContext)?.get(stepId) ?? []
}
