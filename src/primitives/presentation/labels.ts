import { createContext, useContext } from 'react'

export type PresentationVariant = 'lesson' | 'case' | 'game'

export interface PresentationLabels {
  loadingActivity: string
  preparing: (label: string) => string
  retryActivity: string
  activityLoadError: string
  activityLoadErrorMessage: string
  continue: string
  checkAnswer: string
  loadingAudio: string
  retryAudio: string
  audioUnavailable: string
  transcript: string
  loadingImage: string
  retryImage: string
  imageUnavailable: string
  expandImage: string
  hideAnnotations: string
  showAnnotations: string
  expandTable: string
  expandedDataTable: string
  showDataTable: string
  hideDataTable: string
  keyTakeaway: string
  levelProgress: (current: number, total: number) => string
  commitLocalisation: string
  nextLevel: string
  previousLevel: string
  checkLocation: string
}

export const defaultPresentationLabels: PresentationLabels = {
  loadingActivity: 'Loading activity',
  preparing: (label) => `Preparing ${label.toLowerCase()}.`,
  retryActivity: 'Retry activity',
  activityLoadError: 'Activity could not load',
  activityLoadErrorMessage:
    'The activity renderer encountered an unexpected problem. Try again or continue.',
  continue: 'Continue',
  checkAnswer: 'Check answer',
  loadingAudio: 'Loading audio',
  retryAudio: 'Retry audio',
  audioUnavailable: 'Audio unavailable',
  transcript: 'Transcript',
  loadingImage: 'Loading image',
  retryImage: 'Retry image',
  imageUnavailable: 'Image unavailable',
  expandImage: 'Expand image',
  hideAnnotations: 'Hide annotations',
  showAnnotations: 'Show annotations',
  expandTable: 'Expand table',
  expandedDataTable: 'Expanded data table',
  showDataTable: 'Show data table',
  hideDataTable: 'Hide data table',
  keyTakeaway: 'Key takeaway',
  levelProgress: (current, total) => `Level ${current} of ${total}`,
  commitLocalisation: 'Commit your localisation',
  nextLevel: 'Next level',
  previousLevel: 'Previous level',
  checkLocation: 'Check location',
}

export const PresentationContext = createContext<{
  variant: PresentationVariant
  labels: PresentationLabels
}>({ variant: 'lesson', labels: defaultPresentationLabels })

export function usePresentation() {
  return useContext(PresentationContext)
}
