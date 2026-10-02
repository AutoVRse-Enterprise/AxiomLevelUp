import { describe, expect, it } from 'vitest'

import fixtureCaseJson from '../../../public/content/fixtures/case.json'
import appConfigJson from '../../../public/content/app-config.json'

import { appConfigSchema, caseDocumentSchema, type AppConfig } from '@/content/schema'
import { buildCasePlan, stageForStep } from '@/engines/cases/plan'

function config(): AppConfig {
  return appConfigSchema.parse({
    ...structuredClone(appConfigJson),
    caseLab: {
      title: 'Case Lab',
      featuredCaseId: 'case-contract-fixture',
      caseIds: ['case-contract-fixture'],
      dailyQuickCaseId: 'case-contract-fixture',
      clueCategories: [{ id: 'evidence', label: 'Evidence' }],
      tiers: {
        foundation: {
          label: 'Basic',
          timing: 'none',
          hints: 'full',
          labelEssentialClues: true,
        },
        intermediate: {
          label: 'Intermediate',
          timing: 'stopwatch',
          hints: 'full',
          labelEssentialClues: true,
        },
        advanced: {
          label: 'Advanced',
          timing: 'countdown',
          hints: 'reduced',
          labelEssentialClues: false,
        },
      },
      scoring: {
        weights: { anatomy: 0.4, diagnosis: 0.4, speed: 0.2 },
        speedBlend: { perStep: 0.5, perCase: 0.5 },
        defaultStepTargetSeconds: 20,
        defaultStepMaxSeconds: 90,
        cluePenalty: { perOptionalClue: 2, cap: 10 },
      },
      xp: { caseComplete: 100, perfectCaseBonus: 40 },
      historyLimit: 10,
    },
  })
}

describe('case activity planning', () => {
  it('flattens stages through the activity planner and resolves case context', () => {
    const caseDoc = caseDocumentSchema.parse(fixtureCaseJson)
    const plan = buildCasePlan(caseDoc, config())

    expect(plan.activity).toMatchObject({
      kind: 'case',
      id: caseDoc.id,
      version: caseDoc.caseVersion,
    })
    expect(plan.steps.map(({ primitive }) => primitive.id)).toEqual([
      'identify-location',
      'select-conclusion',
    ])
    expect(plan.stageBoundaries).toEqual([
      expect.objectContaining({ stageId: 'stage-orient', startIndex: 0, endIndex: 1 }),
      expect.objectContaining({ stageId: 'stage-diagnose', startIndex: 1, endIndex: 2 }),
    ])
    expect(stageForStep(plan, 1)?.component).toBe('diagnosis')
    expect(plan.clueMap.get('clue-context')?.title).toBe('Context')
    expect(plan.tierPreset.label).toBe('Basic')
    expect(caseDoc.stages[0]?.steps[0]?.content.startView).toBeUndefined()
  })

  it('applies configured marker and endoscopic entry views without mutating the document', () => {
    const base = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      stages: [
        {
          ...structuredClone(fixtureCaseJson.stages[0]),
          steps: [
            {
              id: 'anatomy-entry',
              type: 'anatomy_explore',
              conceptIds: ['thoracic-imaging'],
              content: {
                anatomyMapId: 'fixture-anatomy',
                prompt: 'Explore',
                startView: { mode: 'overview' },
                navigation: 'both',
              },
              completion: { mode: 'viewed' },
              feedback: {},
            },
          ],
        },
      ],
    })
    const marker = buildCasePlan(base, config())
    expect(marker.steps[0]?.primitive.content.startView).toEqual({
      mode: 'marker',
      structureId: 'target-structure',
    })
    expect(base.stages[0]?.steps[0]?.content.startView).toEqual({ mode: 'overview' })

    const endoscopic = buildCasePlan(
      { ...base, entry: { mode: 'endoscopic', waypointId: 'entry-waypoint' } },
      config(),
    )
    expect(endoscopic.steps[0]?.primitive.content.startView).toEqual({
      mode: 'endoscopic',
      waypointId: 'entry-waypoint',
    })
  })

  it('fails clearly without case configuration', () => {
    const caseDoc = caseDocumentSchema.parse(fixtureCaseJson)
    const withoutCaseLab = appConfigSchema.parse(appConfigJson)
    expect(() => buildCasePlan(caseDoc, withoutCaseLab)).toThrow(/Case Lab configuration/)
  })

  it('treats clue-first entry evidence as essential', () => {
    const caseDoc = caseDocumentSchema.parse({
      ...structuredClone(fixtureCaseJson),
      entry: { mode: 'clue_first', clueId: 'clue-context' },
      clues: fixtureCaseJson.clues.map((clue) => ({ ...clue, essential: false })),
    })
    const plan = buildCasePlan(caseDoc, config())
    expect(plan.clueMap.get('clue-context')?.essential).toBe(true)
    expect(caseDoc.clues[0]?.essential).toBe(false)
  })
})
