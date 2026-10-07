import { describe, expect, it } from 'vitest'

import lungMapDocument from '../../../public/content/anatomy/lung-map.json'

import { anatomyMapSchema, type AnatomyMap } from '@/content/schema/anatomyMap'
import { gameScoringSchema, roundDocumentSchema } from '@/content/schema/game'
import { resolveAnswerPath, resolveProximityAccuracy } from '@/engines/games/proximity'
import { resolveRoundAccuracy } from '@/engines/games/scoring'

const lungMap = anatomyMapSchema.parse(lungMapDocument)
const proximity = gameScoringSchema.shape.proximity.parse({
  exact: 1,
  byCommonLevel: { segment: 0.85, lobe: 0.6, side: 0.25 },
  none: 0,
})

const renalMap: AnatomyMap = anatomyMapSchema.parse({
  schemaVersion: '0.1',
  id: 'renal-map',
  modelAssetId: 'renal-model',
  levels: [
    { id: 'organ', label: 'Organ' },
    { id: 'region', label: 'Region' },
    { id: 'tissue', label: 'Tissue' },
  ],
  structures: [
    {
      id: 'kidney',
      levelId: 'organ',
      label: 'Kidney',
      meshNames: ['kidney'],
    },
    {
      id: 'cortex',
      levelId: 'region',
      parentId: 'kidney',
      label: 'Cortex',
      meshNames: ['cortex'],
    },
    {
      id: 'medulla',
      levelId: 'region',
      parentId: 'kidney',
      label: 'Medulla',
      meshNames: ['medulla'],
    },
    {
      id: 'glomerulus',
      levelId: 'tissue',
      parentId: 'cortex',
      label: 'Glomerulus',
      meshNames: ['glomerulus'],
    },
    {
      id: 'tubule',
      levelId: 'tissue',
      parentId: 'cortex',
      label: 'Tubule',
      meshNames: ['tubule'],
    },
    {
      id: 'collecting-duct',
      levelId: 'tissue',
      parentId: 'medulla',
      label: 'Collecting duct',
      meshNames: ['collecting_duct'],
    },
  ],
  waypoints: [
    {
      id: 'glomerulus-view',
      label: 'Glomerulus view',
      answerIds: { tissue: 'glomerulus' },
      position: [0, 0, 0],
      lookAt: [0, 0, 1],
      next: [],
    },
  ],
})

describe('anatomy proximity', () => {
  it('constructs default lung answer paths from structure parent chains', () => {
    expect(resolveAnswerPath(lungMap, 'right-lower-posterior-basal-segment-volume')).toEqual({
      system: 'respiratory-system',
      lobe: 'right-lower-lobe',
      segment: 'right-lower-posterior-basal-segment-volume',
    })
  })

  it('combines default lung waypoint answer IDs with inferred ancestors', () => {
    expect(resolveAnswerPath(lungMap, 'right-lower-posterior-basal-segment')).toEqual({
      system: 'respiratory-system',
      lobe: 'right-lower-lobe',
      segment: 'posterior-basal-segment',
      structure: 'segmental-bronchus',
    })
  })

  it('uses the deepest common configured lung level', () => {
    const posterior = resolveAnswerPath(lungMap, 'right-lower-posterior-basal-segment-volume')
    const lateral = resolveAnswerPath(lungMap, 'right-lower-lateral-basal-segment-volume')
    const left = resolveAnswerPath(lungMap, 'left-lower-posterior-basal-segment')

    expect(resolveProximityAccuracy(lungMap, posterior, posterior, proximity)).toBe(1)
    expect(resolveProximityAccuracy(lungMap, posterior, lateral, proximity)).toBe(0.6)
    expect(resolveProximityAccuracy(lungMap, posterior, left, proximity)).toBe(0)
  })

  it('derives levels from a synthetic non-lung map', () => {
    const renalProximity = {
      exact: 1,
      byCommonLevel: { region: 0.4, organ: 0.15 },
      none: 0,
    }
    const glomerulus = resolveAnswerPath(renalMap, 'glomerulus-view')
    const tubule = resolveAnswerPath(renalMap, 'tubule')
    const collectingDuct = resolveAnswerPath(renalMap, 'collecting-duct')

    expect(glomerulus).toEqual({
      organ: 'kidney',
      region: 'cortex',
      tissue: 'glomerulus',
    })
    expect(resolveProximityAccuracy(renalMap, glomerulus, tubule, renalProximity)).toBe(0.4)
    expect(resolveProximityAccuracy(renalMap, glomerulus, collectingDuct, renalProximity)).toBe(
      0.15,
    )
  })

  it('resolves spatial round accuracy through proximity, including timeout drafts', () => {
    const round = roundDocumentSchema.parse({
      schemaVersion: '0.1',
      roundVersion: '1',
      id: 'airway-location',
      title: 'Airway location',
      mechanic: 'spatial_look',
      anatomyMapId: 'lung-map',
      intro: 'Locate this airway.',
      timeLimitSeconds: 40,
      drop: { pools: { challenge: ['right-lower-posterior-basal-segment'] } },
      primitive: {
        id: 'location',
        type: 'anatomy_locate',
        content: { answerFrom: 'entry' },
      },
      feedback: {
        correct: 'Correct.',
        incorrect: 'Not quite.',
        answerTemplate: 'Correct answer: {answer}.',
      },
    })
    const response = {
      lobe: 'right-lower-lobe',
      segment: 'lateral-basal-segment',
      structure: 'segmental-bronchus',
    }

    expect(
      resolveRoundAccuracy({
        round,
        response,
        timedOut: true,
        anatomyMap: lungMap,
        correctAnswer: 'right-lower-posterior-basal-segment',
        proximity,
      }),
    ).toBe(0.6)
  })
})
