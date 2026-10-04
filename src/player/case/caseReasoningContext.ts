import { createContext, useContext } from 'react'

import type { CaseDocument } from '@/content/schema'
import type { CaseProgress } from '@/engines/learning/session'

export interface CaseReasoningContextValue {
  caseDoc: CaseDocument
  progress: CaseProgress
}

export const CaseReasoningContext = createContext<CaseReasoningContextValue | null>(null)

export function useCaseReasoningContext() {
  return useContext(CaseReasoningContext)
}
