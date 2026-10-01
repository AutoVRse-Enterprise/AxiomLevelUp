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
  const [retryToken, setRetryToken] = useState(0)
  const controllerRef = useRef<DicomViewerController | null>(null)

  useEffect(() => {
    if (!options.element) return
    let active = true

    void import('@/imaging/cornerstone/createController').then(
      async ({ createCornerstoneController }) => {
        const controller = await createCornerstoneController({
          element: options.element!,
          asset: options.asset,
          baseUrl: options.baseUrl,
          initialSlice: options.initialSlice,
          initialPreset: options.initialPreset,
          cacheMaxMiB: options.config.cacheMaxMiB,
          prefetchRadius: options.config.prefetchRadius,
          preloadConcurrency: options.config.preloadConcurrency,
          onState: (next) => {
            if (active) setState(next)
          },
          onSlice: options.onSlice,
          onWindow: options.onWindow,
          onMeasurement: options.onMeasurement,
        })
        if (!active) controller.destroy()
        else controllerRef.current = controller
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
    options.initialPreset,
    options.initialSlice,
    options.onMeasurement,
    options.onSlice,
    options.onWindow,
    retryToken,
  ])

  const retry = useCallback(() => {
    setState({ ...initialState, total: options.asset.series.sliceCount })
    setRetryToken((value) => value + 1)
  }, [options.asset.series.sliceCount])

  return { state, controllerRef, retry }
}
