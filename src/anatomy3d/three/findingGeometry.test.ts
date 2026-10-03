import { describe, expect, it } from 'vitest'

import { deterministicOcclusionBlobs } from '@/anatomy3d/three/findingGeometry'

describe('finding geometry', () => {
  it('produces stable mucus-like occlusion samples from the finding ID', () => {
    const first = deterministicOcclusionBlobs('configured-occlusion', 7)
    const repeated = deterministicOcclusionBlobs('configured-occlusion', 7)
    const other = deterministicOcclusionBlobs('other-occlusion', 7)

    expect(first).toEqual(repeated)
    expect(first).not.toEqual(other)
    expect(first).toHaveLength(7)
    expect(first.every(({ radiusScale, spreadScale }) => radiusScale > 0 && spreadScale <= 1)).toBe(
      true,
    )
  })
})
