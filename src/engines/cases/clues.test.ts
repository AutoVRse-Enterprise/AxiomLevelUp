import { describe, expect, it } from 'vitest'

import { anatomyMapSchema } from '@/content/schema'
import {
  anatomyLocatePrimitiveSchema,
  classificationPrimitiveSchema,
  imageHotspotPrimitiveSchema,
  multipleChoicePrimitiveSchema,
  multipleSelectPrimitiveSchema,
  scenarioPrimitiveSchema,
  trueFalsePrimitiveSchema,
} from '@/content/schema/primitives'
import {
  isClueReviewSignal,
  openClue,
  resolveMissedClueIds,
  resolveMissedClues,
  reviewClue,
} from '@/engines/cases/clues'

const base = {
  conceptIds: [],
  assets: [],
  completion: { mode: 'answer' as const },
  scoring: { weight: 1 },
  feedback: {},
}

describe('case clue resolution', () => {
  it('prefers a selected response override and falls back to the step clues', () => {
    const primitive = multipleChoicePrimitiveSchema.parse({
      ...base,
      id: 'choice',
      type: 'multiple_choice',
      clueIds: ['clue-fallback'],
      content: {
        prompt: 'Choose',
        options: [
          { id: 'correct', label: 'Correct' },
          { id: 'wrong-with-clue', label: 'Wrong one', clueIds: ['clue-override'] },
          { id: 'wrong-without-clue', label: 'Wrong two' },
        ],
        correctOptionId: 'correct',
        explanation: 'Explanation',
      },
    })

    expect(resolveMissedClueIds({ primitive, response: 'wrong-with-clue', score: 0 })).toEqual([
      'clue-override',
    ])
    expect(resolveMissedClueIds({ primitive, response: 'wrong-without-clue', score: 0 })).toEqual([
      'clue-fallback',
    ])
    expect(resolveMissedClueIds({ primitive, response: 'correct', score: 1 })).toEqual([])
  })

  it('resolves only incorrect selected overrides for a partial multiple-select answer', () => {
    const primitive = multipleSelectPrimitiveSchema.parse({
      ...base,
      id: 'multiple-select',
      type: 'multiple_select',
      clueIds: ['clue-fallback'],
      content: {
        prompt: 'Choose all',
        options: [
          { id: 'correct-a', label: 'Correct A', clueIds: ['clue-not-missed'] },
          { id: 'correct-b', label: 'Correct B' },
          { id: 'wrong', label: 'Wrong', clueIds: ['clue-wrong-selection'] },
        ],
        correctOptionIds: ['correct-a', 'correct-b'],
        scoringMode: 'partial',
        minSelections: 1,
        explanation: 'Explanation',
      },
    })

    expect(
      resolveMissedClueIds({
        primitive,
        response: ['correct-a', 'wrong'],
        score: 0.5,
      }),
    ).toEqual(['clue-wrong-selection'])
  })

  it('resolves incorrect anatomy levels from structures and level fallbacks', () => {
    const primitive = anatomyLocatePrimitiveSchema.parse({
      ...base,
      id: 'anatomy-locate',
      type: 'anatomy_locate',
      clueIds: ['clue-step'],
      content: {
        anatomyMapId: 'map',
        prompt: 'Locate',
        levels: [
          {
            levelId: 'region',
            input: 'model',
            targetStructureId: 'target',
            clueIds: ['clue-level'],
          },
          {
            levelId: 'detail',
            input: 'choice',
            options: [
              { id: 'detail-correct', label: 'Correct' },
              { id: 'detail-wrong', label: 'Wrong' },
            ],
            correctOptionId: 'detail-correct',
            clueIds: ['clue-detail'],
          },
        ],
      },
    })
    const anatomyMap = anatomyMapSchema.parse({
      schemaVersion: '0.1',
      id: 'map',
      modelAssetId: 'model',
      levels: [
        { id: 'region', label: 'Region' },
        { id: 'detail', label: 'Detail' },
      ],
      structures: [
        { id: 'target', levelId: 'region', label: 'Target', meshNames: ['Target'] },
        {
          id: 'selected',
          levelId: 'region',
          label: 'Selected',
          meshNames: ['Selected'],
          clueIds: ['clue-structure'],
        },
      ],
      waypoints: [
        {
          id: 'start',
          label: 'Start',
          position: [0, 0, 0],
          lookAt: [0, 0, 1],
          next: [],
        },
      ],
    })

    expect(
      resolveMissedClueIds({
        primitive,
        response: { region: 'selected', detail: 'detail-wrong' },
        score: 0.5,
        anatomyMap,
      }),
    ).toEqual(['clue-structure', 'clue-detail'])
  })

  it('supports true-false, classification, image-region, and scenario overrides', () => {
    const trueFalse = trueFalsePrimitiveSchema.parse({
      ...base,
      id: 'true-false',
      type: 'true_false',
      clueIds: ['clue-fallback'],
      content: {
        statement: 'Statement',
        answer: true,
        explanation: 'Explanation',
        responseClueIds: { false: ['clue-false'] },
      },
    })
    const classification = classificationPrimitiveSchema.parse({
      ...base,
      id: 'classification',
      type: 'classification',
      clueIds: ['clue-fallback'],
      content: {
        prompt: 'Classify',
        categories: [
          { id: 'expected', label: 'Expected' },
          { id: 'selected', label: 'Selected', clueIds: ['clue-category'] },
        ],
        items: [
          { id: 'finding', label: 'Finding', categoryId: 'expected' },
          { id: 'finding-two', label: 'Finding two', categoryId: 'selected' },
        ],
        scoringMode: 'partial',
        explanation: 'Explanation',
      },
    })
    const imageHotspot = imageHotspotPrimitiveSchema.parse({
      ...base,
      id: 'image-hotspot',
      type: 'image_hotspot',
      content: {
        mode: 'assess',
        assetId: 'image',
        alt: 'Image',
        prompt: 'Select',
        regions: [
          {
            id: 'target',
            label: 'Target',
            shape: 'circle',
            x: 0.25,
            y: 0.25,
            radius: 0.1,
          },
          {
            id: 'wrong',
            label: 'Wrong',
            shape: 'circle',
            x: 0.75,
            y: 0.75,
            radius: 0.1,
            clueIds: ['clue-region'],
          },
        ],
        targetRegionIds: ['target'],
        explanation: 'Explanation',
      },
    })
    const scenario = scenarioPrimitiveSchema.parse({
      ...base,
      id: 'scenario',
      type: 'scenario',
      content: {
        startNodeId: 'decision',
        nodes: [
          {
            id: 'decision',
            type: 'decision',
            prompt: 'Choose',
            choices: [
              { id: 'best', label: 'Best', consequence: 'Best', next: 'done', score: 1 },
              {
                id: 'wrong',
                label: 'Wrong',
                consequence: 'Wrong',
                next: 'done',
                score: 0,
                clueIds: ['clue-scenario'],
              },
            ],
          },
          { id: 'done', type: 'outcome', title: 'Done', body: 'Done', result: 'Done' },
        ],
      },
    })

    expect(resolveMissedClueIds({ primitive: trueFalse, response: false, score: 0 })).toEqual([
      'clue-false',
    ])
    expect(
      resolveMissedClueIds({
        primitive: classification,
        response: { finding: 'selected', 'finding-two': 'selected' },
        score: 0.5,
      }),
    ).toEqual(['clue-category'])
    expect(
      resolveMissedClueIds({
        primitive: imageHotspot,
        response: { x: 0.75, y: 0.75 },
        score: 0,
      }),
    ).toEqual(['clue-region'])
    expect(
      resolveMissedClueIds({
        primitive: scenario,
        response: [{ nodeId: 'decision', choiceId: 'wrong' }],
        score: 0,
      }),
    ).toEqual(['clue-scenario'])
  })

  it('deduplicates resolved titles and reopens an existing clue idempotently', () => {
    const parsedPrimitive = multipleChoicePrimitiveSchema.parse({
      ...base,
      id: 'choice',
      type: 'multiple_choice',
      clueIds: ['clue-a'],
      content: {
        prompt: 'Choose',
        options: [
          { id: 'correct', label: 'Correct' },
          { id: 'wrong', label: 'Wrong' },
        ],
        correctOptionId: 'correct',
        explanation: 'Explanation',
      },
    })
    const primitive = { ...parsedPrimitive, clueIds: ['clue-a', 'clue-a'] }
    const clues = [{ id: 'clue-a', title: 'Clue A' }]

    expect(resolveMissedClues({ primitive, response: 'wrong', score: 0, clues })).toEqual([
      { id: 'clue-a', title: 'Clue A' },
    ])

    const opened = ['clue-a']
    const reopened = openClue(opened, 'clue-a')
    expect(reopened).toEqual({ openedClueIds: opened, newlyOpened: false })
    expect(reopened.openedClueIds).toBe(opened)
    expect(openClue(opened, 'clue-b')).toEqual({
      openedClueIds: ['clue-a', 'clue-b'],
      newlyOpened: true,
    })
  })

  it('separates review signals for static, media and interactive clues', () => {
    expect(isClueReviewSignal('rich_text', { method: 'completion' }, 0.8)).toBe(false)
    expect(isClueReviewSignal('rich_text', { method: 'dwell' }, 0.8)).toBe(true)
    expect(isClueReviewSignal('audio', { method: 'media_progress', progress: 0.75 }, 0.8)).toBe(
      false,
    )
    expect(isClueReviewSignal('audio', { method: 'media_progress', progress: 0.8 }, 0.8)).toBe(true)
    expect(isClueReviewSignal('video', { method: 'completion' }, 0.8)).toBe(true)
    expect(isClueReviewSignal('image_compare', { method: 'interaction' }, 0.8)).toBe(true)
  })

  it('reviews each clue idempotently', () => {
    const reviewed = ['clue-a']
    const repeated = reviewClue(reviewed, 'clue-a')
    expect(repeated).toEqual({ reviewedClueIds: reviewed, newlyReviewed: false })
    expect(repeated.reviewedClueIds).toBe(reviewed)
    expect(reviewClue(reviewed, 'clue-b')).toEqual({
      reviewedClueIds: ['clue-a', 'clue-b'],
      newlyReviewed: true,
    })
  })
})
