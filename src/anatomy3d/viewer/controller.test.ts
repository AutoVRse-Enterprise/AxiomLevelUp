import { describe, expect, it } from 'vitest'

import { clampAnatomyFov } from '@/anatomy3d/viewer/controller'

const zoom = {
  enabled: true,
  minFovDegrees: 28,
  maxFovDegrees: 64,
  step: 4,
}

describe('clampAnatomyFov', () => {
  it('clamps field of view to the configured endoscopic range', () => {
    expect(clampAnatomyFov(10, zoom)).toBe(28)
    expect(clampAnatomyFov(42, zoom)).toBe(42)
    expect(clampAnatomyFov(90, zoom)).toBe(64)
  })

  it('uses the safe widest field of view for non-finite input', () => {
    expect(clampAnatomyFov(Number.NaN, zoom)).toBe(64)
  })
})
