import type { AnatomyMap } from '@/content/schema/anatomyMap'
import type { CaseFinding } from '@/content/schema/case'

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

export interface AnatomyProjectedScreenPoint {
  id: string
  clientX: number
  clientY: number
  visible: boolean
}

export interface AnatomyRendererDiagnostics {
  webglVersion: 1 | 2
  renderer: string
  vendor: string
  unmaskedRenderer: string | null
  unmaskedVendor: string | null
}

export interface AnatomyTestSnapshot {
  structures: readonly AnatomyProjectedScreenPoint[]
  findings: readonly AnatomyProjectedScreenPoint[]
  markers: readonly AnatomyProjectedScreenPoint[]
  renderer: AnatomyRendererDiagnostics
}

export interface AnatomyTestBridge {
  snapshot(): AnatomyTestSnapshot
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
  highlightColor: string
  highlightOpacity: number
  markerColor: string
  volumeStyles: {
    color: string
    opacity: number
    highlightColor: string
    highlightOpacity: number
    contextOpacity: number
    emissiveIntensity: number
    highlightEmissiveIntensity: number
    roughness: number
    metalness: number
    widthSegments: number
    heightSegments: number
  }
  findingStyles: {
    lumen_narrowing: {
      color: string
      opacity: number
      maxRadiusReduction: number
      axialLengthRadiusMultiplier: number
    }
    lumen_occlusion: {
      color: string
      opacity: number
      blobCount: number
      blobRadiusRatio: number
      spreadRadiusRatio: number
    }
    wall_thickening: {
      color: string
      opacity: number
      thicknessRadiusRatio: number
      axialLengthRadiusMultiplier: number
    }
    region: {
      color: string
      opacity: number
      scale: number
    }
    pickRadiusRatio: number
  }
  lumen: {
    defaultRadius: number
    radialSegments: number
    tubularSegmentsPerConnection: number
    color: string
    opacity: number
    roughness: number
    curveStrength: number
    headlight: {
      color: string
      intensity: number
      distanceRadiusMultiplier: number
    }
    fog: {
      color: string
      nearRadiusMultiplier: number
      farRadiusMultiplier: number
    }
    lookAround: {
      enabled: boolean
      degreesPerPixel: number
      maxYawDegrees: number
      maxPitchDegrees: number
    }
    rings: {
      color: string
      opacity: number
      tubeRadiusRatio: number
      radialSegments: number
      tubularSegments: number
    }
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
  setSelectableLevelIds(levelIds?: readonly string[]): void
  pick(clientX: number, clientY: number, selectableLevelIds?: readonly string[]): string | null
  pickFinding(clientX: number, clientY: number): string | null
  highlight(structureIds: readonly string[], style: AnatomyHighlightStyle): void
  setMarker(structureId: string | null): void
  setFindings(findings: readonly CaseFinding[]): void
  travelTo(waypointId: string, options?: { animate?: boolean }): void
  availableBranches(): readonly string[]
  parentWaypoint(): string | null
  waypointPath(): readonly string[]
  enterEndoscopic(waypointId: string): void
  exitEndoscopic(options?: { animate?: boolean }): void
  lookAround(deltaX: number, deltaY: number): void
  frameStructures(structureIds: readonly string[], options?: { animate?: boolean }): void
  resetView(): void
  getTestSnapshot(): AnatomyTestSnapshot
  dispose(): void
}
