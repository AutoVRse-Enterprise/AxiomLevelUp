import appConfigDocument from '../../../public/content/app-config.json'
import anatomyMapDocument from '../../../public/content/fixtures/anatomy-map.json'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnatomyViewer } from '@/anatomy3d/viewer/useAnatomyViewer'
import { anatomyMapSchema, appConfigSchema } from '@/content/schema'

const mocked = vi.hoisted(() => {
  const controller = {
    load: vi.fn(),
    setStartView: vi.fn(),
    setSelectableLevelIds: vi.fn(),
    pick: vi.fn(),
    pickFinding: vi.fn(),
    highlight: vi.fn(),
    setMarker: vi.fn(),
    setFindings: vi.fn(),
    travelTo: vi.fn(),
    availableBranches: vi.fn(),
    parentWaypoint: vi.fn(),
    waypointPath: vi.fn(),
    enterEndoscopic: vi.fn(),
    exitEndoscopic: vi.fn(),
    lookAround: vi.fn(),
    frameStructures: vi.fn(),
    resetView: vi.fn(),
    dispose: vi.fn(),
  }
  return {
    controller,
    createAnatomyController: vi.fn(() => controller),
  }
})

vi.mock('@/anatomy3d/three/createAnatomyController', () => ({
  createAnatomyController: mocked.createAnatomyController,
}))

const map = anatomyMapSchema.parse(anatomyMapDocument)
const config = appConfigSchema.parse(appConfigDocument).product.anatomy3d
const startView = { mode: 'waypoint', waypointId: 'entry-waypoint' } as const

describe('useAnatomyViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.controller.load.mockResolvedValue({
      meshNames: ['root-region', 'target-structure'],
      triangleCount: 12,
    })
  })

  it('lazy-loads, starts and disposes the framework-free controller', async () => {
    const element = document.createElement('div')
    const onLoaded = vi.fn()
    const { result, unmount } = renderHook(() =>
      useAnatomyViewer({
        element,
        modelUrl: '/model.glb',
        map,
        config,
        startView,
        onLoaded,
      }),
    )

    await waitFor(() => expect(result.current.state.status).toBe('ready'))
    expect(mocked.createAnatomyController).toHaveBeenCalledWith(
      expect.objectContaining({ element, config }),
    )
    expect(mocked.controller.load).toHaveBeenCalledWith('/model.glb', map)
    expect(mocked.controller.setStartView).toHaveBeenCalledWith(startView)
    expect(onLoaded).toHaveBeenCalledWith(
      expect.objectContaining({ triangleCount: 12 }),
      expect.any(Number),
    )

    unmount()
    expect(mocked.controller.dispose).toHaveBeenCalledOnce()
  })

  it('treats start view as initialization and keeps the controller as movement changes it', async () => {
    const element = document.createElement('div')
    const { result, rerender } = renderHook(
      ({ waypointId }) =>
        useAnatomyViewer({
          element,
          modelUrl: '/model.glb',
          map,
          config,
          startView: { mode: 'endoscopic', waypointId },
        }),
      { initialProps: { waypointId: 'entry-waypoint' } },
    )

    await waitFor(() => expect(result.current.state.status).toBe('ready'))
    rerender({ waypointId: 'branch-waypoint' })

    expect(mocked.createAnatomyController).toHaveBeenCalledOnce()
    expect(mocked.controller.load).toHaveBeenCalledOnce()
    expect(mocked.controller.setStartView).toHaveBeenCalledOnce()
    expect(mocked.controller.setStartView).toHaveBeenCalledWith({
      mode: 'endoscopic',
      waypointId: 'entry-waypoint',
    })
    expect(mocked.controller.dispose).not.toHaveBeenCalled()
  })

  it('reports load failures without requiring WebGL', async () => {
    const element = document.createElement('div')
    const onFailed = vi.fn()
    mocked.controller.load.mockRejectedValueOnce(new Error('WebGL unavailable'))
    const { result } = renderHook(() =>
      useAnatomyViewer({
        element,
        modelUrl: '/model.glb',
        map,
        config,
        onFailed,
      }),
    )

    await waitFor(() => expect(result.current.state.status).toBe('error'))
    expect(result.current.state.message).toBe('WebGL unavailable')
    expect(onFailed).toHaveBeenCalledWith('WebGL unavailable')
  })

  it('bypasses a failed model response when retrying', async () => {
    const element = document.createElement('div')
    mocked.controller.load.mockRejectedValueOnce(new Error('Service unavailable'))
    const { result } = renderHook(() =>
      useAnatomyViewer({
        element,
        modelUrl: '/model.glb?v=model-hash',
        map,
        config,
      }),
    )

    await waitFor(() => expect(result.current.state.status).toBe('error'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.state.status).toBe('ready'))
    expect(mocked.controller.load).toHaveBeenLastCalledWith('/model.glb?v=model-hash&retry=1', map)
  })

  it('warns when configured triangle limits are exceeded', async () => {
    const element = document.createElement('div')
    mocked.controller.load.mockResolvedValueOnce({
      meshNames: ['root-region'],
      triangleCount: config.maxTriangleCountWarning + 1,
    })
    const { result } = renderHook(() =>
      useAnatomyViewer({
        element,
        modelUrl: '/large-model.glb',
        map,
        config,
      }),
    )

    await waitFor(() => expect(result.current.state.status).toBe('ready'))
    expect(result.current.state.warning).toContain('may render slowly')
  })
})
