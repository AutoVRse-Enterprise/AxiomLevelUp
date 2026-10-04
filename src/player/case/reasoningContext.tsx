import type { ReactNode } from 'react'

import {
  CaseReasoningContext,
  type CaseReasoningContextValue,
} from '@/player/case/caseReasoningContext'

export function CaseReasoningProvider({
  caseDoc,
  progress,
  children,
}: CaseReasoningContextValue & { children: ReactNode }) {
  return (
    <CaseReasoningContext.Provider value={{ caseDoc, progress }}>
      {children}
    </CaseReasoningContext.Provider>
  )
}
