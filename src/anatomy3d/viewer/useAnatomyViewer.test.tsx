import appConfigDocument from '../../../public/content/app-config.json'
import anatomyMapDocument from '../../../public/content/fixtures/anatomy-map.json'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnatomyViewer } from '@/anatomy3d/viewer/useAnatomyViewer'
import { anatomyMapSchema, appConfigSchema } from '@/content/schema'

const mocked = vi.hoisted(() => {
  const controller = {
    load: vi.fn(),
    setStartView: vi.fn(),
    pick: vi.fn(),
    highlight: vi.fn(),
    setMarker: vi.fn(),
    flyTo: vi.fn(),
    availableBranches: vi.fn(),
    enterEndoscopic: vi.fn(),
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
