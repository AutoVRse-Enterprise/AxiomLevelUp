import { describe, expect, it } from 'vitest'

import { ContentValidationError, validateContentBundle } from '@/content/loader'
import { makeGameContentBundle } from '@/test/gameFixtures'
import {
  invalidAnswerTemplateFixture,
  invalidMechanicPrimitiveFixture,
  leakedAnswerFixture,
  unknownRoundFixture,
} from '@/test/invalidGameFixtures'

function issuePaths(input: ReturnType<typeof makeGameContentBundle>) {
  try {
    validateContentBundle(input)
  } catch (error) {
    if (error instanceof ContentValidationError) return error.issues.map(({ path }) => path)
    throw error
  }
  return []
}

describe('game semantic validation', () => {
  it('accepts the two-round fixture with no warnings', () => {
    const registry = validateContentBundle(makeGameContentBundle())
    expect(registry.rounds).toHaveLength(2)
    expect(registry.games).toHaveLength(1)
    expect(registry.warnings).toEqual([])
  })

  it.each([
    [invalidMechanicPrimitiveFixture, 'mechanic'],
    [invalidAnswerTemplateFixture, 'feedback.answerTemplate'],
    [unknownRoundFixture, 'slots.0.pool.0'],
    [leakedAnswerFixture, 'primitive.content'],
  ])('rejects an invalid game fixture at %s', (fixture, path) => {
    expect(issuePaths(fixture())).toContain(path)
  })
})
