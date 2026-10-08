import { describe, expect, it } from 'vitest'

import anatomyMapDocument from '../../../public/experiences/sanofi/content/anatomy/respiratory-game-map.json'
import roundDocument from '../../../public/experiences/sanofi/content/rounds/airway-drop-look.json'

import { anatomyMapSchema } from '@/content/schema/anatomyMap'
import { roundDocumentSchema } from '@/content/schema/game'
import { correctAnswerDimensions, correctAnswerLabel } from '@/engines/games/answers'
import type { PlannedRound } from '@/engines/games/plan'

describe('game answer labels', () => {
  it('resolves authored anatomy level and structure labels', () => {
    const anatomyMap = anatomyMapSchema.parse(anatomyMapDocument)
    const round = roundDocumentSchema.parse(roundDocument)
    const planned = {
      slotId: 'look',
      roundId: round.id,
      mechanic: round.mechanic,
      timeLimitSeconds: round.timeLimitSeconds,
      freeClueIds: [],
      paidClueIds: [],
      clueCostPoints: 0,
      maxMoves: 0,
      speedBonus: true,
      primitive: round.primitive,
    } satisfies PlannedRound

    const dimensions = correctAnswerDimensions(planned, anatomyMap)
    expect(dimensions.map(({ levelLabel }) => levelLabel)).toEqual([
      'Side',
      'Region',
      'Airway level',
    ])
    expect(dimensions.every(({ label }) => !label.includes('-'))).toBe(true)
    expect(correctAnswerLabel(planned, anatomyMap)).not.toMatch(/right-lung|region-|airway-level/)
  })
})
