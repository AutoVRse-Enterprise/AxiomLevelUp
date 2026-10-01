import type { Primitive } from '@/content/schema'

export type PrimitiveInteraction =
  | { name: string; key?: string }
  | { name: 'media_progress'; fraction: number }
  | { name: 'dicom_slice'; slice: number }
  | { name: 'dicom_window'; presetId?: string; center: number; width: number }
  | { name: 'dicom_tool'; tool: 'scroll' | 'window' | 'zoom' | 'pan' | 'measure' }
  | { name: 'dicom_region'; slice: number; x: number; y: number }
  | { name: 'dicom_measurement'; slice: number; value: number; unit: string }
  | { name: 'dicom_requirement'; key: string }
  | { name: 'dicom_viewer_loaded'; firstImageMs: number; sliceCount: number }
  | { name: 'dicom_viewer_failed'; reason: string }
  | {
      name: 'scenario_decision'
      nodeId: string
      choiceId: string
      decisionIndex: number
    }

export interface PrimitiveComponentProps<P extends Primitive = Primitive> {
  primitive: P
  attempt: number
  mode: 'interactive' | 'review'
  review?: {
    response: unknown
    evaluation: EvaluationResult
    revealAnswer: boolean
  }
  draft: unknown
  disabled?: boolean
  onInteract: (interaction: PrimitiveInteraction) => void
  onDraftChange: (draft: unknown) => void
  onSubmit: (response: unknown) => void
  onComplete: () => void
}

export interface EvaluationResult {
  score: number
  correct: boolean
  explanation: string | null
  items?: Record<string, 'correct' | 'incorrect' | 'missed'>
}
