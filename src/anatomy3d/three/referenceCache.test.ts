import { describe, expect, it, vi } from 'vitest'

import { ReferenceCountedCache } from '@/anatomy3d/three/referenceCache'

describe('ReferenceCountedCache', () => {
  it('shares a load and disposes only after the final release', async () => {
    const cache = new ReferenceCountedCache<object>()
    const resource = {}
    const load = vi.fn(async () => resource)
    const dispose = vi.fn()

    const [first, second] = await Promise.all([
      cache.acquire('/model.glb', load, dispose),
      cache.acquire('/model.glb', load, dispose),
    ])

    expect(load).toHaveBeenCalledOnce()
    expect(first.value).toBe(second.value)
    first.release()
    expect(dispose).not.toHaveBeenCalled()
    second.release()
    await Promise.resolve()
    expect(dispose).toHaveBeenCalledOnce()
    expect(cache.size()).toBe(0)
  })

  it('releases once and retries failed loads', async () => {
    const cache = new ReferenceCountedCache<object>()
    const dispose = vi.fn()
    const failedLoad = vi.fn(async () => {
      throw new Error('network failure')
    })

    await expect(cache.acquire('/model.glb', failedLoad, dispose)).rejects.toThrow(
      'network failure',
    )
    expect(cache.size()).toBe(0)

    const lease = await cache.acquire('/model.glb', async () => ({}), dispose)
    lease.release()
    lease.release()
    await Promise.resolve()
    expect(dispose).toHaveBeenCalledOnce()
  })
})
