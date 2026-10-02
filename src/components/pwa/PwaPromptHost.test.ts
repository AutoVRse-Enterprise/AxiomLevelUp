import { describe, expect, it } from 'vitest'

import { installPromptEligible } from '@/pwa/installPrompt'

describe('install prompt eligibility', () => {
  const now = Date.parse('2026-10-02T12:00:00Z')

  it('requires configured engagement', () => {
    expect(installPromptEligible(0, 1, undefined, 14, now)).toBe(false)
    expect(installPromptEligible(1, 1, undefined, 14, now)).toBe(true)
  })

  it('respects and expires the dismissal cooldown', () => {
    expect(
      installPromptEligible(2, 1, '2026-09-25T12:00:00Z', 14, now),
    ).toBe(false)
    expect(
      installPromptEligible(2, 1, '2026-09-01T12:00:00Z', 14, now),
    ).toBe(true)
  })
})
