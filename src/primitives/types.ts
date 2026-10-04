import type { Primitive } from '@/content/schema'
import type { AnatomyVector3 } from '@/anatomy3d/viewer/controller'

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
  | { name: 'anatomy_structure_selected'; structureId: string; key: string }
  | { name: 'anatomy_waypoint_reached'; waypointId: string; key: string }
  | { name: 'anatomy_finding_inspected'; findingId: string; key: string }
  | {
      name: 'case_hypothesis_rated'
      hypothesisId: string
      confidence: 'unlikely' | 'possible' | 'likely'
      key: string
    }
  | {
      name: 'case_evidence_selected'
      evidence: { kind: 'clue' | 'finding'; id: string }
      selected: boolean
      key: string
    }
  | {
      name: 'anatomy_view_changed'
      position: AnatomyVector3
      target: AnatomyVector3
      waypointId: string | null
      endoscopic: boolean
      key: string
    }
  | {
      name: 'anatomy_viewer_loaded'
      loadMs: number
      meshCount: number
      triangleCount: number
    }
  | { name: 'anatomy_viewer_failed'; reason: string }
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
