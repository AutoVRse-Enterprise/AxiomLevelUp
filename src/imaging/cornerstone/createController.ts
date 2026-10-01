import {
  cache,
  Enums as CoreEnums,
  eventTarget,
  imageLoader,
  init as coreInit,
  RenderingEngine,
  setUseCPURendering,
  type StackViewport,
  utilities,
} from '@cornerstonejs/core'
import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader'
import {
  addTool,
  Enums as ToolEnums,
  init as toolsInit,
  LengthTool,
  PanTool,
  StackScrollTool,
  ToolGroupManager,
  WindowLevelTool,
  ZoomTool,
} from '@cornerstonejs/tools'

import type { DicomTool, NormalizedPoint } from '@/content/schema/primitives'
import { presetVoiRange } from '@/imaging/presets'
import { loadDicomSeries } from '@/imaging/series'
import type {
  DicomControllerOptions,
  DicomMeasurement,
  DicomViewerController,
  DicomViewerState,
} from '@/imaging/viewer/controller'

let initialization: Promise<void> | null = null
let idSequence = 0
const seriesReferences = new Map<string, { count: number; imageIds: string[] }>()

async function initializeCornerstone(cacheMaxMiB: number) {
  if (!initialization) {
    initialization = Promise.resolve().then(async () => {
      const probe = document.createElement('canvas')
      if (!probe.getContext('webgl2') && !probe.getContext('webgl')) {
        setUseCPURendering(true)
      }
      await coreInit()
      await toolsInit()
      dicomImageLoaderInit({
        maxWebWorkers: 1,
        useLegacyMetadataProvider: true,
      })
      ;[StackScrollTool, ZoomTool, PanTool, WindowLevelTool, LengthTool].forEach((tool) =>
        addTool(tool),
      )
    })
  }
  await initialization
  cache.setMaxCacheSize(cacheMaxMiB * 1024 * 1024)
}

export async function createCornerstoneController(
  options: DicomControllerOptions,
): Promise<DicomViewerController> {
  const instanceId = ++idSequence
  const renderingEngineId = `dicom-engine-${instanceId}`
  const viewportId = `dicom-viewport-${instanceId}`
  const toolGroupId = `dicom-tools-${instanceId}`
  const abortController = new AbortController()
  const startedAt = performance.now()
  let destroyed = false
  let engine: RenderingEngine | null = null
  let viewport: StackViewport | null = null
  let imageIds: string[] = []
  let seriesKey: string | null = null
  let resizeObserver: ResizeObserver | null = null
  let contextCanvas: HTMLCanvasElement | null = null

  let state: DicomViewerState = {
    status: 'loading',
    message: 'Loading DICOM study',
    loaded: 0,
    total: options.asset.series.sliceCount,
    slice: options.initialSlice ?? 1,
    activeTool: 'scroll',
    presetId: options.initialPreset?.id ?? null,
    measurement: null,
    firstImageMs: null,
  }
  const updateState = (patch: Partial<DicomViewerState>) => {
    if (destroyed) return
    state = { ...state, ...patch }
    options.onState(state)
  }
  options.onState(state)

  const onStackChanged = () => {
    if (!viewport) return
    const slice = viewport.getCurrentImageIdIndex() + 1
    updateState({ slice })
    options.onSlice(slice)
  }

  const onVoiChanged = (event: Event) => {
    const detail = (event as CustomEvent).detail as {
      range?: { lower?: number; upper?: number }
    }
    const lower = detail.range?.lower
    const upper = detail.range?.upper
    if (typeof lower === 'number' && typeof upper === 'number') {
      options.onWindow((lower + upper) / 2, upper - lower)
    }
  }

  const normalizedPoint = (world: [number, number, number]): NormalizedPoint | undefined => {
    if (!viewport) return undefined
    const imageData = viewport.getImageData()?.imageData
    if (!imageData) return undefined
    const index = utilities.transformWorldToIndex(imageData, world)
    return {
      x: Math.min(1, Math.max(0, index[0] / options.asset.series.columns)),
      y: Math.min(1, Math.max(0, index[1] / options.asset.series.rows)),
    }
  }

  const onMeasurement = (event: Event) => {
    const detail = (event as CustomEvent).detail as {
      annotation?: {
        metadata?: { toolName?: string }
        data?: {
          handles?: { points?: number[][] }
          cachedStats?: Record<string, { length?: number; unit?: string }>
        }
      }
    }
    if (detail.annotation?.metadata?.toolName !== LengthTool.toolName || !viewport) return
    const stats = Object.values(detail.annotation.data?.cachedStats ?? {}).find(({ length }) =>
      Number.isFinite(length),
    )
    if (stats?.length === undefined) return
    const points = detail.annotation.data?.handles?.points
    const measurement: DicomMeasurement = {
      slice: viewport.getCurrentImageIdIndex() + 1,
      value: stats.length,
      unit: stats.unit ?? 'unknown',
      start: points?.[0] ? normalizedPoint(points[0] as [number, number, number]) : undefined,
      end: points?.[1] ? normalizedPoint(points[1] as [number, number, number]) : undefined,
    }
    updateState({ measurement })
    options.onMeasurement(measurement)
  }

  const onImageLoadError = (event: Event) => {
    const detail = (event as CustomEvent).detail as { error?: unknown }
    const reason = detail.error instanceof Error ? detail.error.message : 'A DICOM image failed.'
    updateState({ status: 'error', message: reason })
  }

  const onContextLost = (event: Event) => {
    event.preventDefault()
    updateState({
      status: 'error',
      message: 'The imaging context was lost. Reload the study to continue.',
    })
  }

  try {
    const loadedSeries = await loadDicomSeries(
      options.asset,
      options.baseUrl,
      abortController.signal,
    )
    if (destroyed) throw new DOMException('Viewer destroyed', 'AbortError')
    await initializeCornerstone(options.cacheMaxMiB)
    if (destroyed) throw new DOMException('Viewer destroyed', 'AbortError')

    seriesKey = loadedSeries.manifestUrl.href
    imageIds = loadedSeries.imageUrls.map((url) => `wadouri:${url.href}`)
    const existing = seriesReferences.get(seriesKey)
    seriesReferences.set(seriesKey, {
      count: (existing?.count ?? 0) + 1,
      imageIds,
    })
    updateState({ total: imageIds.length })

    engine = new RenderingEngine(renderingEngineId)
    engine.enableElement({
      viewportId,
      type: CoreEnums.ViewportType.STACK,
      element: options.element,
      defaultOptions: { background: [0.02, 0.04, 0.05] },
    })
    viewport = engine.getViewport<StackViewport>(viewportId)
    const initialIndex = Math.min(
      imageIds.length - 1,
      Math.max(0, (options.initialSlice ?? Math.ceil(imageIds.length / 2)) - 1),
    )
    await viewport.setStack(imageIds, initialIndex)
    if (options.initialPreset)
      viewport.setProperties({ voiRange: presetVoiRange(options.initialPreset) })
    viewport.render()

    const group = ToolGroupManager.createToolGroup(toolGroupId)
    if (!group) throw new Error('Cornerstone tool group could not be created.')
    ;[StackScrollTool, ZoomTool, PanTool, WindowLevelTool, LengthTool].forEach((tool) =>
      group.addTool(tool.toolName),
    )
    group.addViewport(viewportId, renderingEngineId)
    group.setToolActive(StackScrollTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Wheel }],
    })
    group.setToolActive(ZoomTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }, { numTouchPoints: 2 }],
    })
    group.setToolActive(PanTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }],
    })
    group.setToolPassive(WindowLevelTool.toolName)
    group.setToolPassive(LengthTool.toolName)

    eventTarget.addEventListener(CoreEnums.Events.IMAGE_LOAD_ERROR, onImageLoadError)
    eventTarget.addEventListener(ToolEnums.Events.ANNOTATION_COMPLETED, onMeasurement)
    eventTarget.addEventListener(ToolEnums.Events.ANNOTATION_MODIFIED, onMeasurement)
    options.element.addEventListener(CoreEnums.Events.STACK_NEW_IMAGE, onStackChanged)
    options.element.addEventListener(CoreEnums.Events.VOI_MODIFIED, onVoiChanged)
    contextCanvas = options.element.querySelector('canvas')
    contextCanvas?.addEventListener('webglcontextlost', onContextLost)
    resizeObserver = new ResizeObserver(() => engine?.resize(true, false))
    resizeObserver.observe(options.element)

    const firstImageMs = Math.round(performance.now() - startedAt)
    updateState({
      status: 'ready',
      message: 'Study ready',
      loaded: 1,
      slice: initialIndex + 1,
      firstImageMs,
    })

    const near = imageIds
      .map((_, index) => index)
      .filter(
        (index) =>
          index !== initialIndex && Math.abs(index - initialIndex) <= options.prefetchRadius,
      )
      .sort((left, right) => Math.abs(left - initialIndex) - Math.abs(right - initialIndex))
    const remaining = imageIds
      .map((_, index) => index)
      .filter((index) => index !== initialIndex && !near.includes(index))
    const queue = [...near, ...remaining]
    let next = 0
    const worker = async () => {
      while (!destroyed && next < queue.length) {
        const index = queue[next++]
        const imageId = index === undefined ? undefined : imageIds[index]
        if (!imageId) continue
        try {
          await imageLoader.loadAndCacheImage(imageId)
          updateState({ loaded: Math.min(state.total, state.loaded + 1) })
        } catch {
          if (!destroyed) updateState({ message: 'Some slices could not be prefetched.' })
        }
      }
    }
    void Promise.all(Array.from({ length: options.preloadConcurrency }, worker))
  } catch (error) {
    if (!destroyed && !(error instanceof DOMException && error.name === 'AbortError')) {
      const message = error instanceof Error ? error.message : 'The DICOM study could not load.'
      updateState({
        status: message.includes('404') ? 'unavailable' : 'error',
        message,
      })
    }
  }

  const activateTool = (tool: DicomTool) => {
    const group = ToolGroupManager.getToolGroup(toolGroupId)
    if (!group) return
    ;[WindowLevelTool, PanTool, LengthTool, StackScrollTool, ZoomTool].forEach((item) =>
      group.setToolPassive(item.toolName, { removeAllBindings: true }),
    )
    group.setToolActive(StackScrollTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Wheel }],
    })
    group.setToolActive(ZoomTool.toolName, {
      bindings: [{ numTouchPoints: 2 }, { mouseButton: ToolEnums.MouseBindings.Secondary }],
    })
    const selected = {
      scroll: StackScrollTool,
      window: WindowLevelTool,
      zoom: ZoomTool,
      pan: PanTool,
      measure: LengthTool,
    }[tool]
    group.setToolActive(selected.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }, { numTouchPoints: 1 }],
    })
    updateState({ activeTool: tool })
  }

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    abortController.abort()
    eventTarget.removeEventListener(CoreEnums.Events.IMAGE_LOAD_ERROR, onImageLoadError)
    eventTarget.removeEventListener(ToolEnums.Events.ANNOTATION_COMPLETED, onMeasurement)
    eventTarget.removeEventListener(ToolEnums.Events.ANNOTATION_MODIFIED, onMeasurement)
    options.element.removeEventListener(CoreEnums.Events.STACK_NEW_IMAGE, onStackChanged)
    options.element.removeEventListener(CoreEnums.Events.VOI_MODIFIED, onVoiChanged)
    contextCanvas?.removeEventListener('webglcontextlost', onContextLost)
    resizeObserver?.disconnect()
    ToolGroupManager.destroyToolGroup(toolGroupId)
    engine?.destroy()
    if (seriesKey) {
      const reference = seriesReferences.get(seriesKey)
      if (reference && reference.count <= 1) {
        reference.imageIds.forEach((imageId) => {
          if (cache.getImage(imageId)) cache.removeImageLoadObject(imageId)
        })
        seriesReferences.delete(seriesKey)
      } else if (reference) {
        reference.count -= 1
      }
    }
    viewport = null
    engine = null
  }

  return {
    activateTool,
    applyPreset(preset) {
      viewport?.setProperties({ voiRange: presetVoiRange(preset) })
      viewport?.render()
      updateState({ presetId: preset.id })
      options.onWindow(preset.center, preset.width)
    },
    async setSlice(slice) {
      if (!viewport) return
      const clamped = Math.min(imageIds.length, Math.max(1, Math.round(slice)))
      await viewport.setImageIdIndex(clamped - 1)
    },
    reset() {
      viewport?.resetCamera()
      viewport?.resetProperties()
      viewport?.render()
      updateState({ presetId: null, measurement: null })
    },
    fit() {
      viewport?.resetCamera()
      viewport?.render()
    },
    clientPointToImage(clientX, clientY) {
      if (!viewport) return null
      const rect = options.element.getBoundingClientRect()
      const world = viewport.canvasToWorld([clientX - rect.left, clientY - rect.top])
      return normalizedPoint(world) ?? null
    },
    imagePointToCanvas(point) {
      if (!viewport) return null
      const imageData = viewport.getImageData()?.imageData
      if (!imageData) return null
      const world = utilities.transformIndexToWorld(imageData, [
        point.x * options.asset.series.columns,
        point.y * options.asset.series.rows,
        0,
      ])
      const [x, y] = viewport.worldToCanvas(world)
      return { x, y }
    },
    destroy,
  }
}
