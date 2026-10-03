import { useCallback, useEffect, useRef, useState } from 'react'

import type { AnatomyMap } from '@/content/schema/anatomyMap'
import type { AppConfig } from '@/content/schema'
import type {
  AnatomyLoadResult,
  AnatomyStartView,
  AnatomyViewerController,
  AnatomyViewState,
} from '@/anatomy3d/viewer/controller'

export type AnatomyViewerStatus = 'loading' | 'ready' | 'error'

export interface AnatomyViewerState {
  status: AnatomyViewerStatus
  message: string
  loadResult: AnatomyLoadResult | null
  warning: string | null
}

interface UseAnatomyViewerOptions {
  element: HTMLDivElement | null
  modelUrl: string
  map: AnatomyMap
  startView?: AnatomyStartView
  config: AppConfig['product']['anatomy3d']
  onViewChanged?: (view: AnatomyViewState) => void
  onLoaded?: (result: AnatomyLoadResult, loadMs: number) => void
  onFailed?: (reason: string) => void
}

function loadingState(): AnatomyViewerState {
  return {
    status: 'loading',
    message: 'Preparing interactive anatomy',
    loadResult: null,
    warning: null,
  }
}

function retryModelUrl(modelUrl: string, retryToken: number) {
  if (retryToken === 0) return modelUrl
  const separator = modelUrl.includes('?') ? '&' : '?'
  return `${modelUrl}${separator}retry=${retryToken}`
}

export function useAnatomyViewer(options: UseAnatomyViewerOptions) {
  const [state, setState] = useState<AnatomyViewerState>(loadingState)
  const [controller, setController] = useState<AnatomyViewerController | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const callbacks = useRef({
    onViewChanged: options.onViewChanged,
    onLoaded: options.onLoaded,
    onFailed: options.onFailed,
  })

  useEffect(() => {
    callbacks.current = {
      onViewChanged: options.onViewChanged,
      onLoaded: options.onLoaded,
      onFailed: options.onFailed,
    }
  }, [options.onFailed, options.onLoaded, options.onViewChanged])

  useEffect(() => {
    if (!options.element) return
    let active = true
    let nextController: AnatomyViewerController | null = null
    const startedAt = performance.now()
    queueMicrotask(() => {
      if (!active) return
      setState(loadingState())
      setController(null)
    })

    void import('@/anatomy3d/three/createAnatomyController')
      .then(async ({ createAnatomyController }) => {
        nextController = createAnatomyController({
          element: options.element!,
          config: options.config,
          onViewChanged: (view) => callbacks.current.onViewChanged?.(view),
          onContextLost: () => {
            if (!active) return
            const message = 'The 3D graphics context was lost.'
            setState((current) => ({ ...current, status: 'error', message }))
            callbacks.current.onFailed?.(message)
          },
          onContextRestored: () => {
            if (!active) return
            setState((current) => ({
              ...current,
              status: current.loadResult ? 'ready' : 'loading',
              message: current.loadResult
                ? 'Interactive anatomy ready'
                : 'Preparing interactive anatomy',
            }))
          },
        })
        const result = await nextController.load(
          retryModelUrl(options.modelUrl, retryToken),
          options.map,
        )
        if (!active) {
          nextController.dispose()
          return
        }
        nextController.setStartView(options.startView ?? { mode: 'overview' })
        const warning =
          result.triangleCount > options.config.maxTriangleCountWarning
            ? `This model contains ${result.triangleCount.toLocaleString()} triangles and may render slowly on this device.`
            : null
        setController(nextController)
        setState({
          status: 'ready',
          message: 'Interactive anatomy ready',
          loadResult: result,
          warning,
        })
        callbacks.current.onLoaded?.(result, performance.now() - startedAt)
      })
      .catch((error: unknown) => {
        nextController?.dispose()
        if (!active) return
        const message =
          error instanceof Error ? error.message : 'The anatomy viewer could not load.'
        setState({ status: 'error', message, loadResult: null, warning: null })
        callbacks.current.onFailed?.(message)
      })

    return () => {
      active = false
      nextController?.dispose()
    }
  }, [
    options.config,
    options.element,
    options.map,
    options.modelUrl,
    options.startView,
    retryToken,
  ])

  const retry = useCallback(() => {
    setState(loadingState())
    setController(null)
    setRetryToken((value) => value + 1)
  }, [])

  return { state, controller, retry }
}
