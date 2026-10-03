import { describe, expect, it } from 'vitest'

import { caseResponsesEqual, normalizeCaseResponse } from '@/engines/cases/responses'

describe('case response normalization', () => {
  it('sorts arrays recursively and object keys before comparison', () => {
    const learner = {
      selected: [
        { label: 'Beta', id: 'b' },
        { id: 'a', label: 'Alpha' },
      ],
      flags: ['urgent', 'review'],
    }
    const expert = {
      flags: ['review', 'urgent'],
      selected: [
        { label: 'Alpha', id: 'a' },
        { id: 'b', label: 'Beta' },
      ],
    }

    expect(caseResponsesEqual(learner, expert)).toBe(true)
    expect(normalizeCaseResponse(learner)).toEqual(normalizeCaseResponse(expert))
  })

  it('does not equate responses with different values', () => {
    expect(caseResponsesEqual({ selected: ['a'] }, { selected: ['b'] })).toBe(false)
  })
})
