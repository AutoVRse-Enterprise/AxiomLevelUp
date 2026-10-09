import { describe, expect, it } from 'vitest'

import anatomyMap from '../../../public/experiences/sanofi/content/anatomy/respiratory-game-map.json'
import appConfig from '../../../public/experiences/sanofi/content/app-config.json'
import assets from '../../../public/experiences/sanofi/content/assets.json'
import anatomyHunt from '../../../public/experiences/sanofi/content/games/anatomy-hunt.json'
import respiratoryChallenge from '../../../public/experiences/sanofi/content/games/respiratory-challenge.json'
import spotTheFinding from '../../../public/experiences/sanofi/content/games/spot-the-finding.json'
import manifest from '../../../public/experiences/sanofi/content/manifest.json'
import airwayDropLook from '../../../public/experiences/sanofi/content/rounds/airway-drop-look.json'
import airwayExploreLower from '../../../public/experiences/sanofi/content/rounds/airway-explore-lower.json'
import airwayExploreUpper from '../../../public/experiences/sanofi/content/rounds/airway-explore-upper.json'
import clinicalCall from '../../../public/experiences/sanofi/content/rounds/clinical-call-t2.json'
import histologyDestruction from '../../../public/experiences/sanofi/content/rounds/histology-destruction-spot.json'
import histologyFibrosis from '../../../public/experiences/sanofi/content/rounds/histology-fibrosis-spot.json'
import histologyMucus from '../../../public/experiences/sanofi/content/rounds/histology-mucus-spot.json'
import thoracicCtScroll from '../../../public/experiences/sanofi/content/rounds/thoracic-ct-scroll.json'
import seed from '../../../public/experiences/sanofi/content/seeds/fresh.json'
import { validateContentBundle } from '@/content/loader'

describe('Sanofi content bundle', () => {
  it('accepts the Respiratory Challenge CT slot without warnings', () => {
    const registry = validateContentBundle({
      manifestFile: 'manifest.json',
      manifest,
      appConfigFile: 'app-config.json',
      appConfig,
      courseFiles: [],
      caseFiles: [],
      anatomyMapFiles: [{ file: 'anatomy/respiratory-game-map.json', data: anatomyMap }],
      roundFiles: [
        { file: 'rounds/clinical-call-t2.json', data: clinicalCall },
        { file: 'rounds/airway-drop-look.json', data: airwayDropLook },
        { file: 'rounds/airway-explore-lower.json', data: airwayExploreLower },
        { file: 'rounds/airway-explore-upper.json', data: airwayExploreUpper },
        { file: 'rounds/histology-mucus-spot.json', data: histologyMucus },
        { file: 'rounds/histology-destruction-spot.json', data: histologyDestruction },
        { file: 'rounds/histology-fibrosis-spot.json', data: histologyFibrosis },
        { file: 'rounds/thoracic-ct-scroll.json', data: thoracicCtScroll },
      ],
      gameFiles: [
        { file: 'games/respiratory-challenge.json', data: respiratoryChallenge },
        { file: 'games/anatomy-hunt.json', data: anatomyHunt },
        { file: 'games/spot-the-finding.json', data: spotTheFinding },
      ],
      seedFile: 'seeds/fresh.json',
      seed,
      assetManifestFile: 'assets.json',
      assetManifest: assets,
    })

    expect(registry.gameById.get('respiratory-challenge')?.slots.map(({ id }) => id)).toEqual([
      'orient',
      'navigate',
      'inspect',
      'image',
      'interpret',
    ])
    expect(registry.roundById.get('thoracic-ct-scroll')?.mechanic).toBe('dicom_explore')
    expect(registry.warnings).toEqual([])
  })
})
