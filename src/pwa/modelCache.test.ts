import { describe, expect, it, vi } from 'vitest'

import { isVersionedGlbRequest, prefetchVersionedModel, versionedModelUrl } from './modelCache'

const hash = '8'.repeat(64)

describe('versioned model caching contract', () => {
  it('uses the model integrity hash as the runtime URL version', () => {
    expect(
      versionedModelUrl({
        path: '/assets/models/lung-map/model.glb',
        type: 'model',
        sha256: hash,
      }),
    ).toBe(`/assets/models/lung-map/model.glb?v=${hash}`)
  })

  it('matches only hash-versioned GLB requests', () => {
    expect(
      isVersionedGlbRequest(
        new URL(`https://example.test/assets/models/lung-map/model.glb?v=${hash}`),
      ),
    ).toBe(true)
    expect(
      isVersionedGlbRequest(
        new URL('https://example.test/assets/models/lung-map/model.8884cefb.glb'),
      ),
    ).toBe(true)
    expect(
      isVersionedGlbRequest(new URL('https://example.test/assets/models/lung-map/model.glb')),
    ).toBe(false)
    expect(
      isVersionedGlbRequest(new URL(`https://example.test/assets/models/notes.pdf?v=${hash}`)),
    ).toBe(false)
  })

  it('fully fetches the exact versioned response', async () => {
    const fetcher = vi.fn(async () => new Response('model bytes', { status: 200 }))
    const url = `/assets/models/lung-map/model.glb?v=${hash}`

    await prefetchVersionedModel(url, { fetcher })

    expect(fetcher).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ credentials: 'same-origin' }),
    )
  })
})
