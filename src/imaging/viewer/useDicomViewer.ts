import { useCallback, useEffect, useRef, useState } from 'react'

import type { DicomPresetContent } from '@/content/schema/primitives'
import type { AppConfig } from '@/content/schema'
import type { DicomAsset } from '@/imaging/series'
import type {
  DicomMeasurement,
  DicomViewerController,
  DicomViewerState,
} from '@/imaging/viewer/controller'

interface UseDicomViewerOptions {
  element: HTMLDivElement | null
  asset: DicomAsset
  baseUrl?: string
  initialSlice?: number
  initialPreset?: DicomPresetContent
  config: AppConfig['product']['dicom']
  onSlice: (slice: number) => void
  onWindow: (center: number, width: number) => void
  onMeasurement: (measurement: DicomMeasurement) => void
}

const initialState: DicomViewerState = {
  status: 'loading',
  message: 'Preparing imaging viewer',
  loaded: 0,
  total: 0,
  slice: 1,
  activeTool: 'scroll',
  presetId: null,
  measurement: null,
  firstImageMs: null,
}

export function useDicomViewer(options: UseDicomViewerOptions) {
  const [state, setState] = useState(initialState)
  const [controller, setController] = useState<DicomViewerController | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const controllerRef = useRef<DicomViewerController | null>(null)
  const initialSliceRef = useRef(options.initialSlice)
  const initialPresetRef = useRef(options.initialPreset)
  const callbacks = useRef({
    onSlice: options.onSlice,
    onWindow: options.onWindow,
    onMeasurement: options.onMeasurement,
  })
  initialSliceRef.current = options.initialSlice
  initialPresetRef.current = options.initialPreset

  useEffect(() => {
    callbacks.current = {
      onSlice: options.onSlice,
      onWindow: options.onWindow,
      onMeasurement: options.onMeasurement,
    }
  }, [options.onMeasurement, options.onSlice, options.onWindow])

  useEffect(() => {
    if (!options.element) return
    let active = true
    const initialSlice = initialSliceRef.current
    const initialPreset = initialPresetRef.current

    void import('@/imaging/cornerstone/createController').then(
      async ({ createCornerstoneController }) => {
        const controller = await createCornerstoneController({
          element: options.element!,
          asset: options.asset,
          baseUrl: options.baseUrl,
          initialSlice,
          initialPreset,
          cacheMaxMiB: options.config.cacheMaxMiB,
          prefetchRadius: options.config.prefetchRadius,
          preloadConcurrency: options.config.preloadConcurrency,
          onState: (next) => {
            if (active) setState(next)
          },
          onSlice: (slice) => callbacks.current.onSlice(slice),
          onWindow: (center, width) => callbacks.current.onWindow(center, width),
          onMeasurement: (measurement) => callbacks.current.onMeasurement(measurement),
        })
        if (!active) controller.destroy()
        else {
          controllerRef.current = controller
          setController(controller)
        }
      },
    )

    return () => {
      active = false
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }, [
    options.asset,
    options.baseUrl,
    options.config.cacheMaxMiB,
    options.config.prefetchRadius,
    options.config.preloadConcurrency,
    options.element,
    retryToken,
  ])

  const retry = useCallback(() => {
    setState({ ...initialState, total: options.asset.series.sliceCount })
    setController(null)
    setRetryToken((value) => value + 1)
  }, [options.asset.series.sliceCount])

  return { state, controller, retry }
}
