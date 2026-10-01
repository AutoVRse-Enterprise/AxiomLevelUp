import type { DicomTool } from '@/content/schema/primitives'
import type { NormalizedPoint } from '@/content/schema/primitives'
import type { DicomPreset } from '@/imaging/presets'
import type { DicomAsset } from '@/imaging/series'

export type DicomViewerStatus = 'loading' | 'ready' | 'unavailable' | 'error'

export interface DicomMeasurement {
  slice: number
  value: number
  unit: string
  start?: NormalizedPoint
  end?: NormalizedPoint
}

export interface DicomViewerState {
  status: DicomViewerStatus
  message: string
  loaded: number
  total: number
  slice: number
  activeTool: DicomTool
  presetId: string | null
  measurement: DicomMeasurement | null
  firstImageMs: number | null
}

export interface DicomControllerOptions {
  element: HTMLDivElement
  asset: DicomAsset
  baseUrl?: string
  initialSlice?: number
  initialPreset?: DicomPreset
  cacheMaxMiB: number
  prefetchRadius: number
  preloadConcurrency: number
  onState: (state: DicomViewerState) => void
  onSlice: (slice: number) => void
  onWindow: (center: number, width: number) => void
  onMeasurement: (measurement: DicomMeasurement) => void
}

export interface DicomViewerController {
  activateTool(tool: DicomTool): void
  applyPreset(preset: DicomPreset): void
  setSlice(slice: number): Promise<void>
  reset(): void
  fit(): void
  clientPointToImage(clientX: number, clientY: number): NormalizedPoint | null
  imagePointToCanvas(point: NormalizedPoint): { x: number; y: number } | null
  destroy(): void
}
