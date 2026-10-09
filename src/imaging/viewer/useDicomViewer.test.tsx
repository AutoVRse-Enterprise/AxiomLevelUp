import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DicomAsset } from '@/imaging/series'
import { useDicomViewer } from '@/imaging/viewer/useDicomViewer'

const mocked = vi.hoisted(() => {
  const destroy = vi.fn()
  return {
    destroy,
    createCornerstoneController: vi.fn(
      async (options: { onState: (state: Record<string, unknown>) => void }) => {
        options.onState({
          status: 'ready',
          message: 'Study ready',
          loaded: 1,
          total: 125,
          slice: 81,
          activeTool: 'scroll',
          presetId: 'lung',
          measurement: null,
          firstImageMs: 12,
        })
        return { destroy }
      },
    ),
  }
})

vi.mock('@/imaging/cornerstone/createController', () => ({
  createCornerstoneController: mocked.createCornerstoneController,
}))

const asset = { series: { sliceCount: 125 } } as DicomAsset
const config = {
  prefetchRadius: 8,
  preloadConcurrency: 3,
  cacheMaxMiB: 192,
  sliceEventDebounceMs: 250,
  tapMaxMovementPx: 8,
}
const preset = { id: 'lung', label: 'Lung', center: -600, width: 1500 }

describe('useDicomViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the study mounted when the reported slice changes', async () => {
    const element = document.createElement('div')
    const { rerender } = renderHook(
      ({ slice }) =>
        useDicomViewer({
          element,
          asset,
          initialSlice: slice,
          initialPreset: preset,
          config,
          onSlice: vi.fn(),
          onWindow: vi.fn(),
          onMeasurement: vi.fn(),
        }),
      { initialProps: { slice: 81 } },
    )

    await waitFor(() => expect(mocked.createCornerstoneController).toHaveBeenCalledOnce())

    rerender({ slice: 82 })

    expect(mocked.createCornerstoneController).toHaveBeenCalledOnce()
    expect(mocked.destroy).not.toHaveBeenCalled()
  })
})
