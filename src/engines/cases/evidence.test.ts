import { describe, expect, it } from 'vitest'

import anatomyMapFixture from '../../../public/content/fixtures/anatomy-map.json'

import { anatomyMapSchema } from '@/content/schema'
import {
  canPinCaseEvidence,
  resolveCaseLocationLabel,
  updateCaseEvidencePins,
} from '@/engines/cases/evidence'

describe('case evidence', () => {
  it('allows only reviewed clues and inspected findings to be pinned', () => {
    const inspected = new Set(['finding-reviewed'])

    expect(
      canPinCaseEvidence({ kind: 'clue', id: 'clue-reviewed' }, ['clue-reviewed'], inspected),
    ).toBe(true)
    expect(canPinCaseEvidence({ kind: 'clue', id: 'clue-new' }, [], inspected)).toBe(false)
    expect(canPinCaseEvidence({ kind: 'finding', id: 'finding-reviewed' }, [], inspected)).toBe(
      true,
    )
    expect(canPinCaseEvidence({ kind: 'finding', id: 'finding-new' }, [], inspected)).toBe(false)
  })

  it('adds and removes one evidence pin idempotently', () => {
    const item = { kind: 'clue' as const, id: 'clue-reviewed' }
    const pinned = updateCaseEvidencePins([], item, true)

    expect(pinned).toEqual([item])
    expect(updateCaseEvidencePins(pinned, item, true)).toBe(pinned)
    expect(updateCaseEvidencePins(pinned, item, false)).toEqual([])
  })

  it('resolves learner-facing location labels and never falls back to raw ids', () => {
    const anatomyMap = anatomyMapSchema.parse(anatomyMapFixture)

    expect(resolveCaseLocationLabel(anatomyMap, { kind: 'waypoint', id: 'entry-waypoint' })).toBe(
      'Entry waypoint',
    )
    expect(
      resolveCaseLocationLabel(anatomyMap, { kind: 'structure', id: 'target-structure' }),
    ).toBe('Target structure')
    expect(resolveCaseLocationLabel(anatomyMap, { kind: 'waypoint', id: 'raw-id' })).toBeNull()
  })
})
