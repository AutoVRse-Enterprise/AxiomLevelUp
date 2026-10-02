import type { AnatomyMap } from '@/content/schema/anatomyMap'

export type AnatomyVector3 = readonly [number, number, number]

export type AnatomyStartView =
  | { mode: 'overview' }
  | { mode: 'marker'; structureId: string }
  | { mode: 'waypoint'; waypointId: string }
  | { mode: 'endoscopic'; waypointId: string }

export interface AnatomyHighlightStyle {
  color: string
  opacity?: number
}

export interface AnatomyLoadResult {
  meshNames: readonly string[]
  triangleCount: number
}

export interface AnatomyViewState {
  position: AnatomyVector3
  target: AnatomyVector3
  waypointId: string | null
  endoscopic: boolean
}

export interface AnatomyControllerConfig {
  pixelRatioCap: number
  cameraAnimationDurationMs: number
  flyThroughEasing: 'linear' | 'ease_out' | 'ease_in_out'
  backgroundColor: string
  markerColor: string
  lumen: {
    defaultRadius: number
    radialSegments: number
    tubularSegmentsPerConnection: number
    color: string
    opacity: number
  }
}

export interface CreateAnatomyControllerOptions {
  element: HTMLDivElement
  config: AnatomyControllerConfig
  onViewChanged?: (view: AnatomyViewState) => void
}

export interface AnatomyViewerController {
  load(modelUrl: string, map: AnatomyMap): Promise<AnatomyLoadResult>
  setStartView(view: AnatomyStartView): void
  pick(clientX: number, clientY: number): string | null
  highlight(structureIds: readonly string[], style: AnatomyHighlightStyle): void
  setMarker(structureId: string | null): void
  flyTo(waypointId: string, options?: { animate?: boolean }): void
  availableBranches(): readonly string[]
  enterEndoscopic(waypointId: string): void
  resetView(): void
  dispose(): void
}
