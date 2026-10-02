import appConfig from '../../public/content/app-config.json'
import assets from '../../public/content/assets.json'
import lungMap from '../../public/content/anatomy/lung-map.json'
import clinicalResearch from '../../public/content/courses/clinical-research.json'
import dataInterpretation from '../../public/content/courses/data-interpretation.json'
import runtimeShowcase from '../../public/content/courses/runtime-showcase.json'
import safetyAssessment from '../../public/content/courses/safety-assessment.json'
import scientificImaging from '../../public/content/courses/scientific-imaging.json'
import manifest from '../../public/content/manifest.json'
import advancedSeed from '../../public/content/seeds/advanced.json'

import type { ContentBundleInput } from '@/content/loader'
import { primitiveBaseSchema } from '@/content/schema'
import type { ActivityDefinition } from '@/engines/learning/plan'

const courseDocuments = [
  ['courses/scientific-imaging.json', scientificImaging],
  ['courses/clinical-research.json', clinicalResearch],
  ['courses/data-interpretation.json', dataInterpretation],
  ['courses/safety-assessment.json', safetyAssessment],
  ['courses/runtime-showcase.json', runtimeShowcase],
] as const

export function makeValidContentBundle(): ContentBundleInput {
  return structuredClone({
    manifestFile: 'manifest.json',
    manifest,
    appConfigFile: 'app-config.json',
    appConfig,
    courseFiles: courseDocuments.map(([file, data]) => ({ file, data })),
    caseFiles: [],
    anatomyMapFiles: [{ file: 'anatomy/lung-map.json', data: lungMap }],
    seedFile: 'seeds/advanced.json',
    seed: advancedSeed,
    assetManifestFile: 'assets.json',
    assetManifest: assets,
  })
}

export const contentResponses = new Map<string, unknown>([
  ['/content/manifest.json', manifest],
  ['/content/app-config.json', appConfig],
  ['/content/assets.json', assets],
  ['/content/anatomy/lung-map.json', lungMap],
  ['/content/seeds/advanced.json', advancedSeed],
  ...courseDocuments.map(([file, data]) => [`/content/${file}`, data] as const),
])

const richText = primitiveBaseSchema.parse({
  id: 'fixture-text',
  type: 'rich_text',
  conceptIds: ['thoracic-imaging'],
  content: { heading: 'Observe', body: 'Review the evidence before answering.' },
  completion: { mode: 'viewed' },
})
const question = primitiveBaseSchema.parse({
  id: 'fixture-question',
  type: 'multiple_choice',
  conceptIds: ['thoracic-imaging'],
  content: {
    prompt: 'Which option is supported?',
    options: [
      { id: 'supported', label: 'Supported' },
      { id: 'unsupported', label: 'Unsupported' },
    ],
    correctOptionId: 'supported',
    explanation: 'The configured evidence supports this option.',
  },
  completion: { mode: 'answer' },
  scoring: { weight: 1 },
})
const unsupported = primitiveBaseSchema.parse({
  id: 'fixture-unsupported',
  type: 'scenario',
  conceptIds: ['thoracic-imaging'],
  content: { startNodeId: 'start', nodes: [] },
  completion: { mode: 'outcome' },
})

const activity = (
  id: string,
  primitives: ActivityDefinition['primitives'],
): ActivityDefinition => ({
  kind: 'lesson',
  id,
  courseId: 'fixture-course',
  version: '1.0',
  title: `Fixture ${id}`,
  description: 'Player behavior fixture.',
  estimatedMinutes: 3,
  conceptIds: ['thoracic-imaging'],
  primitives,
})

export const playerFixtures = {
  allTyped: activity('all-typed', [richText, question]),
  mixedUnsupported: activity('mixed-unsupported', [richText, unsupported, question]),
  allUnsupported: activity('all-unsupported', [unsupported]),
  emptyChallenge: {
    ...activity('empty-challenge', []),
    kind: 'challenge',
    courseId: undefined,
  } satisfies ActivityDefinition,
}
