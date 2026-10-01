import {
  Enums as CoreEnums,
  eventTarget,
  imageLoader,
  RenderingEngine,
  type StackViewport,
} from '@cornerstonejs/core'
import {
  Enums as ToolEnums,
  LengthTool,
  PanTool,
  StackScrollTool,
  ToolGroupManager,
  WindowLevelTool,
  ZoomTool,
} from '@cornerstonejs/tools'
import { useCallback, useEffect, useRef, useState } from 'react'

import { initializeCornerstone } from '@/spikes/dicom/cornerstoneInit'
import type { DicomPreset, DicomSeriesManifest, DicomTool } from '@/spikes/dicom/types'

const renderingEngineId = 'dicom-spike-engine'
const viewportId = 'dicom-spike-viewport'
const toolGroupId = 'dicom-spike-tools'

interface ViewerState {
  status: 'loading' | 'ready' | 'unavailable' | 'error'
  message: string
  loaded: number
  total: number
  slice: number
  measurement: string | null
  firstImageMs: number | null
  fullLoadMs: number | null
}

const initialState: ViewerState = {
  status: 'loading',
  message: 'Preparing imaging study',
  loaded: 0,
  total: 0,
  slice: 0,
  measurement: null,
  firstImageMs: null,
  fullLoadMs: null,
}

export function useStackLoader() {
  const elementRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<StackViewport | null>(null)
  const [manifest, setManifest] = useState<DicomSeriesManifest | null>(null)
  const [state, setState] = useState<ViewerState>(initialState)
  const [activeTool, setActiveToolState] = useState<DicomTool>('window')

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    let active = true
    let engine: RenderingEngine | null = null
    const startedAt = performance.now()

    const onStackChanged = () => {
      const viewport = viewportRef.current
      if (viewport) {
        setState((current) => ({ ...current, slice: viewport.getCurrentImageIdIndex() + 1 }))
      }
    }

    const onImageLoadError = (event: Event) => {
      const detail = (event as CustomEvent).detail as { error?: unknown; imageId?: string }
      const reason =
        detail.error instanceof Error
          ? detail.error.message
          : detail.error
            ? String(detail.error)
            : 'Unknown image loading error'
      setState((current) => ({
        ...current,
        status: 'error',
        message: `DICOM image load failed: ${reason}`,
      }))
    }

    const onMeasurement = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        annotation?: {
          metadata?: { toolName?: string }
          data?: { cachedStats?: Record<string, { length?: number; unit?: string }> }
        }
      }
      if (detail.annotation?.metadata?.toolName !== LengthTool.toolName) return
      const stats = Object.values(detail.annotation.data?.cachedStats ?? {}).find(({ length }) =>
        Number.isFinite(length),
      )
      const length = stats?.length
      const unit = stats?.unit ?? 'mm'
      if (length !== undefined) {
        setState((current) => ({
          ...current,
          measurement: `${length.toFixed(1)} ${unit}`,
        }))
      }
    }

    eventTarget.addEventListener(CoreEnums.Events.IMAGE_LOAD_ERROR, onImageLoadError)
    eventTarget.addEventListener(ToolEnums.Events.ANNOTATION_COMPLETED, onMeasurement)
    eventTarget.addEventListener(ToolEnums.Events.ANNOTATION_MODIFIED, onMeasurement)
    element.addEventListener(CoreEnums.Events.STACK_NEW_IMAGE, onStackChanged)

    void (async () => {
      try {
        const response = await fetch('/assets/dicom/spike/manifest.json')
        if (response.status === 404) {
          throw new Error(
            'The local DICOM stack is not installed. Follow public/assets/dicom/spike/README.md.',
          )
        }
        if (!response.ok) throw new Error(`Series manifest request failed (${response.status}).`)
        const series = (await response.json()) as DicomSeriesManifest
        if (!active) return
        setManifest(series)
        setState((current) => ({ ...current, total: series.sliceCount }))

        await initializeCornerstone()
        if (!active) return

        engine = new RenderingEngine(renderingEngineId)
        engine.enableElement({
          viewportId,
          type: CoreEnums.ViewportType.STACK,
          element,
          defaultOptions: { background: [0.02, 0.04, 0.05] },
        })

        const viewport = engine.getViewport<StackViewport>(viewportId)
        viewportRef.current = viewport
        const imageIds = series.imageIds.map(
          (path) => `wadouri:${new URL(path, `${window.location.origin}/assets/dicom/spike/`)}`,
        )
        const initialIndex = Math.floor(imageIds.length / 2)
        await viewport.setStack(imageIds, initialIndex)
        viewport.render()
        setState((current) => ({
          ...current,
          loaded: 1,
          firstImageMs: Math.round(performance.now() - startedAt),
        }))

        const toolGroup = ToolGroupManager.createToolGroup(toolGroupId)
        if (!toolGroup) throw new Error('Cornerstone tool group could not be created.')
        ;[StackScrollTool, ZoomTool, PanTool, WindowLevelTool, LengthTool].forEach((tool) =>
          toolGroup.addTool(tool.toolName),
        )
        toolGroup.addViewport(viewportId, renderingEngineId)
        toolGroup.setToolActive(StackScrollTool.toolName, {
          bindings: [
            { mouseButton: ToolEnums.MouseBindings.Wheel },
            { numTouchPoints: 1 },
          ],
        })
        toolGroup.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
        })
        toolGroup.setToolActive(ZoomTool.toolName, {
          bindings: [
            { mouseButton: ToolEnums.MouseBindings.Secondary },
            { numTouchPoints: 2 },
          ],
        })
        toolGroup.setToolActive(PanTool.toolName, {
          bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }],
        })
        toolGroup.setToolPassive(LengthTool.toolName)

        const remainingImageIds = imageIds.filter((_, index) => index !== initialIndex)
        let nextImageIndex = 0
        let failed = 0
        const preloadWorker = async () => {
          while (active && nextImageIndex < remainingImageIds.length) {
            const imageId = remainingImageIds[nextImageIndex]
            nextImageIndex += 1
            if (!imageId) continue
            try {
              await imageLoader.loadAndCacheImage(imageId)
              if (!active) return
              setState((current) => ({
                ...current,
                loaded: Math.min(current.total, current.loaded + 1),
              }))
            } catch {
              failed += 1
            }
          }
        }
        void Promise.all(Array.from({ length: 4 }, preloadWorker)).then(() => {
          if (!active) return
          setState((current) => ({
            ...current,
            fullLoadMs: Math.round(performance.now() - startedAt),
            message: failed ? `${failed} slices could not be prefetched` : 'Study fully cached',
          }))
        })

        const observer = new ResizeObserver(() => engine?.resize(true, false))
        observer.observe(element)
        element.dataset.resizeObserver = 'active'
        ;(element as HTMLDivElement & { __resizeObserver?: ResizeObserver }).__resizeObserver =
          observer

        setState((current) => ({
          ...current,
          status: 'ready',
          message: 'Study ready',
          slice: viewport.getCurrentImageIdIndex() + 1,
        }))
      } catch (error) {
        if (active) {
          const message = error instanceof Error ? error.message : 'The DICOM study could not load.'
          setState((current) => ({
            ...current,
            status: message.includes('not installed') ? 'unavailable' : 'error',
            message,
          }))
        }
      }
    })()

    return () => {
      active = false
      eventTarget.removeEventListener(CoreEnums.Events.IMAGE_LOAD_ERROR, onImageLoadError)
      eventTarget.removeEventListener(ToolEnums.Events.ANNOTATION_COMPLETED, onMeasurement)
      eventTarget.removeEventListener(ToolEnums.Events.ANNOTATION_MODIFIED, onMeasurement)
      element.removeEventListener(CoreEnums.Events.STACK_NEW_IMAGE, onStackChanged)
      if (engine) {
        ToolGroupManager.destroyToolGroup(toolGroupId)
        engine.destroy()
      }
      ;(
        element as HTMLDivElement & { __resizeObserver?: ResizeObserver }
      ).__resizeObserver?.disconnect()
      viewportRef.current = null
    }
  }, [])

  const activateTool = useCallback((tool: DicomTool) => {
    const group = ToolGroupManager.getToolGroup(toolGroupId)
    if (!group) return
    const interactive = [WindowLevelTool, PanTool, LengthTool]
    interactive.forEach((item) => group.setToolPassive(item.toolName, { removeAllBindings: true }))
    group.setToolActive(StackScrollTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Wheel }],
    })
    group.setToolActive(ZoomTool.toolName, {
      bindings: [
        { mouseButton: ToolEnums.MouseBindings.Secondary },
        { numTouchPoints: 2 },
      ],
    })
    const chosen = {
      scroll: StackScrollTool,
      window: WindowLevelTool,
      zoom: ZoomTool,
      pan: PanTool,
      measure: LengthTool,
    }[tool]
    group.setToolActive(chosen.toolName, {
      bindings: [
        { mouseButton: ToolEnums.MouseBindings.Primary },
        { numTouchPoints: 1 },
      ],
    })
    setActiveToolState(tool)
  }, [])

  const applyPreset = useCallback((preset: DicomPreset) => {
    viewportRef.current?.setProperties({
      voiRange: {
        lower: preset.center - preset.width / 2,
        upper: preset.center + preset.width / 2,
      },
    })
    viewportRef.current?.render()
  }, [])

  const reset = useCallback(() => {
    viewportRef.current?.resetCamera()
    viewportRef.current?.resetProperties()
    viewportRef.current?.render()
  }, [])

  return { elementRef, manifest, state, activeTool, activateTool, applyPreset, reset }
}
