import { createContext, useContext } from 'react'

export interface AnatomyEntryContextValue {
  entryWaypointId?: string
  neutralNavigationLabels: boolean
  hideLocationLabels: boolean
}

export const defaultAnatomyEntryContext: AnatomyEntryContextValue = {
  neutralNavigationLabels: false,
  hideLocationLabels: false,
}

export const AnatomyEntryContext = createContext<AnatomyEntryContextValue>(
  defaultAnatomyEntryContext,
)

export function useAnatomyEntryContext() {
  return useContext(AnatomyEntryContext)
}
