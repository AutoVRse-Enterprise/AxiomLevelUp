import { describe, expect, it } from 'vitest'

import { mechanicContentProblems } from '@/content/gameMechanics'
import { roundDocumentSchema, type GameMechanic } from '@/content/schema/game'

const base = {
  schemaVersion: '0.1' as const,
  roundVersion: '1',
  id: 'round',
  title: 'Round',
  intro: 'Begin.',
  timeLimitSeconds: 30,
  feedback: {
    correct: 'Correct.',
    incorrect: 'Not quite.',
    answerTemplate: 'Correct answer: {answer}.',
  },
}

function round(mechanic: GameMechanic) {
  const spatial = mechanic === 'spatial_look' || mechanic === 'spatial_explore'
  return roundDocumentSchema.parse({
    ...base,
    mechanic,
    anatomyMapId: spatial ? 'map' : undefined,
    drop: spatial ? { pools: { challenge: ['waypoint'] } } : undefined,
    explore:
      mechanic === 'spatial_explore'
        ? { id: 'explore', type: 'anatomy_explore', content: {} }
        : undefined,
    primitive: {
      id: 'answer',
      type:
        mechanic === 'clinical_call'
          ? 'multiple_choice'
          : mechanic === 'spot_finding'
            ? 'image_hotspot'
            : 'anatomy_locate',
      content: spatial ? { answerFrom: 'entry' } : {},
    },
    clues:
      mechanic === 'clinical_call'
        ? [
            {
              id: 'history',
              title: 'History',
              primitive: { id: 'history-text', type: 'rich_text', content: {} },
            },
          ]
        : [],
  })
}

describe('game mechanic templates', () => {
  it.each(['spatial_look', 'spatial_explore', 'spot_finding', 'clinical_call'] as const)(
    'accepts a valid %s round',
    (mechanic) => expect(mechanicContentProblems(round(mechanic))).toEqual([]),
  )

  it('rejects a wrong answer primitive', () => {
    const value = round('clinical_call')
    expect(
      mechanicContentProblems({
        ...value,
        primitive: { ...value.primitive, type: 'true_false' },
      }),
    ).toContain('primitive type "true_false" is not allowed')
  })

  it('enforces entry answers, exploration and clue policies', () => {
    const spatial = round('spatial_explore')
    expect(
      mechanicContentProblems({
        ...spatial,
        explore: undefined,
        primitive: { ...spatial.primitive, content: {} },
      }),
    ).toEqual([
      'the answer must resolve from the entry waypoint',
      'an anatomy_explore exploration primitive is required',
    ])
    expect(mechanicContentProblems({ ...round('clinical_call'), clues: [] })).toEqual([
      'at least one clue is required',
    ])
  })
})
