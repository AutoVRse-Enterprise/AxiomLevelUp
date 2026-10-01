import appConfig from '../../public/content/app-config.json'
import assets from '../../public/content/assets.json'
import clinicalResearch from '../../public/content/courses/clinical-research.json'
import dataInterpretation from '../../public/content/courses/data-interpretation.json'
import safetyAssessment from '../../public/content/courses/safety-assessment.json'
import scientificImaging from '../../public/content/courses/scientific-imaging.json'
import manifest from '../../public/content/manifest.json'
import advancedSeed from '../../public/content/seeds/advanced.json'

import type { ContentBundleInput } from '@/content/loader'

const courseDocuments = [
  ['courses/scientific-imaging.json', scientificImaging],
  ['courses/clinical-research.json', clinicalResearch],
  ['courses/data-interpretation.json', dataInterpretation],
  ['courses/safety-assessment.json', safetyAssessment],
] as const

export function makeValidContentBundle(): ContentBundleInput {
  return structuredClone({
    manifestFile: 'manifest.json',
    manifest,
    appConfigFile: 'app-config.json',
    appConfig,
    courseFiles: courseDocuments.map(([file, data]) => ({ file, data })),
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
  ['/content/seeds/advanced.json', advancedSeed],
  ...courseDocuments.map(([file, data]) => [`/content/${file}`, data] as const),
])
