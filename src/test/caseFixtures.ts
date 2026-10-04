import fixtureCaseData from '../../public/content/fixtures/case.json'

import type { ContentRegistry } from '@/content/loader'
import { appConfigSchema, caseDocumentSchema } from '@/content/schema'
import { makeValidContentBundle } from '@/test/contentFixtures'
import { validateContentBundle } from '@/content/loader'

export const fixtureCase = caseDocumentSchema.parse(fixtureCaseData)

export function makeCaseRegistry(): ContentRegistry {
  const base = validateContentBundle(makeValidContentBundle())
  const appConfig = appConfigSchema.parse({
    ...structuredClone(base.appConfig),
    pathways: base.appConfig.pathways.map((pathway) => ({
      ...pathway,
      nodes: pathway.nodes.map((node) =>
        node.id === 'node-case' ? { ...node, type: 'case' as const, refId: fixtureCase.id } : node,
      ),
    })),
    caseLab: {
      title: 'Case Lab',
      featuredCaseId: fixtureCase.id,
      caseIds: [fixtureCase.id],
      dailyQuickCaseId: fixtureCase.id,
      howItWorks: [
        { id: 'first_attempt', title: 'First answer', description: 'Your first answer is scored.' },
        { id: 'optional_clues', title: 'Clues', description: 'Optional clues can cost points.' },
        { id: 'timing', title: 'Timing', description: 'Timing depends on the tier.' },
        { id: 'hints', title: 'Hints', description: 'Hint support depends on the tier.' },
      ],
      organSystems: { generic: 'Generic' },
      clueCategories: [{ id: 'evidence', label: 'Evidence' }],
      clueReview: { minVisibleMs: 1_200, mediaProgressThreshold: 0.8 },
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

  return {
    ...base,
    appConfig,
    cases: [fixtureCase],
    caseById: new Map([[fixtureCase.id, fixtureCase]]),
  }
}
