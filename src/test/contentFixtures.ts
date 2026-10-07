import appConfig from '../../public/content/app-config.json'
import assets from '../../public/content/assets.json'
import lungMap from '../../public/content/anatomy/lung-map.json'
import asthmaFoundation from '../../public/content/cases/asthma-foundation.json'
import copdIntermediate from '../../public/content/cases/copd-intermediate.json'
import exacerbationAdvanced from '../../public/content/cases/exacerbation-advanced.json'
import wheezeQuick from '../../public/content/cases/wheeze-quick.json'
import clinicalResearch from '../../public/content/courses/clinical-research.json'
import dataInterpretation from '../../public/content/courses/data-interpretation.json'
import runtimeShowcase from '../../public/content/courses/runtime-showcase.json'
import safetyAssessment from '../../public/content/courses/safety-assessment.json'
import scientificImaging from '../../public/content/courses/scientific-imaging.json'
import manifest from '../../public/content/manifest.json'
import advancedSeed from '../../public/content/seeds/advanced.json'
import freshSeed from '../../public/content/seeds/fresh.json'

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

const caseDocuments = [
  ['cases/asthma-foundation.json', asthmaFoundation],
  ['cases/copd-intermediate.json', copdIntermediate],
  ['cases/exacerbation-advanced.json', exacerbationAdvanced],
  ['cases/wheeze-quick.json', wheezeQuick],
] as const

export function makeValidContentBundle(): ContentBundleInput {
  const fixtureManifest = structuredClone(manifest) as unknown as { cases: string[] }
  fixtureManifest.cases = []
  const fixtureAppConfig = structuredClone(appConfig) as unknown as {
    caseLab?: unknown
    challenges: Array<Record<string, unknown>>
    pathways: Array<{
      nodes: Array<{ id: string; type: string; refId: string }>
    }>
  }
  delete fixtureAppConfig.caseLab
  fixtureAppConfig.challenges = fixtureAppConfig.challenges.filter(
    (challenge) => !('recordedOpponent' in challenge),
  )
  fixtureAppConfig.pathways.forEach((pathway) => {
    pathway.nodes.forEach((node) => {
      if (node.type !== 'case') return
      node.type = 'lesson'
      node.refId = 'imaging-case-practice'
    })
  })
  fixtureAppConfig.challenges[0] = {
    id: 'daily-imaging-interpretation',
    type: 'daily',
    title: 'Fixture daily question',
    description: 'Inline challenge fixture for primitive validation.',
    estimatedMinutes: 3,
    rewardXp: 50,
    itemCount: 5,
    items: [
      {
        id: 'fixture-daily-question',
        type: 'multiple_choice',
        conceptIds: ['image-windowing'],
        content: {
          prompt: 'Which display emphasizes aerated lung?',
          options: [
            { id: 'lung', label: 'Lung window' },
            { id: 'bone', label: 'Bone window' },
          ],
          correctOptionId: 'lung',
          explanation: 'The lung window emphasizes aerated lung.',
        },
        assets: [],
        completion: { mode: 'answer' },
        scoring: { weight: 1, difficulty: 'foundation' },
        feedback: {},
      },
      {
        id: 'fixture-daily-question-2',
        type: 'multiple_choice',
        conceptIds: ['clinical-trial-design'],
        content: {
          prompt: 'Which second fixture option is supported?',
          options: [
            { id: 'supported', label: 'Supported' },
            { id: 'unsupported', label: 'Unsupported' },
          ],
          correctOptionId: 'supported',
          explanation: 'The supported option is configured as correct.',
        },
        assets: [],
        completion: { mode: 'answer' },
        scoring: { weight: 1, difficulty: 'foundation' },
        feedback: {},
      },
      {
        id: 'fixture-daily-question-3',
        type: 'multiple_choice',
        conceptIds: ['biostatistics'],
        content: {
          prompt: 'Which third fixture option is supported?',
          options: [
            { id: 'supported', label: 'Supported' },
            { id: 'unsupported', label: 'Unsupported' },
          ],
          correctOptionId: 'supported',
          explanation: 'The supported option is configured as correct.',
        },
        assets: [],
        completion: { mode: 'answer' },
        scoring: { weight: 1, difficulty: 'foundation' },
        feedback: {},
      },
      {
        id: 'fixture-daily-question-4',
        type: 'multiple_choice',
        conceptIds: ['safety-signals'],
        content: {
          prompt: 'Which fourth fixture option is supported?',
          options: [
            { id: 'supported', label: 'Supported' },
            { id: 'unsupported', label: 'Unsupported' },
          ],
          correctOptionId: 'supported',
          explanation: 'The supported option is configured as correct.',
        },
        assets: [],
        completion: { mode: 'answer' },
        scoring: { weight: 1, difficulty: 'foundation' },
        feedback: {},
      },
      {
        id: 'fixture-daily-question-5',
        type: 'multiple_choice',
        conceptIds: ['dose-response'],
        content: {
          prompt: 'Which fifth fixture option is supported?',
          options: [
            { id: 'supported', label: 'Supported' },
            { id: 'unsupported', label: 'Unsupported' },
          ],
          correctOptionId: 'supported',
          explanation: 'The supported option is configured as correct.',
        },
        assets: [],
        completion: { mode: 'answer' },
        scoring: { weight: 1, difficulty: 'foundation' },
        feedback: {},
      },
    ],
  }

  return structuredClone({
    manifestFile: 'manifest.json',
    manifest: fixtureManifest,
    appConfigFile: 'app-config.json',
    appConfig: fixtureAppConfig,
    courseFiles: courseDocuments.map(([file, data]) => ({ file, data })),
    caseFiles: [],
    anatomyMapFiles: [{ file: 'anatomy/lung-map.json', data: lungMap }],
    roundFiles: [],
    gameFiles: [],
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
  ['/content/seeds/fresh.json', freshSeed],
  ...courseDocuments.map(([file, data]) => [`/content/${file}`, data] as const),
  ...caseDocuments.map(([file, data]) => [`/content/${file}`, data] as const),
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
