import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import appConfig from '../../../public/experiences/sanofi/content/app-config.json'
import assetManifest from '../../../public/experiences/sanofi/content/assets.json'
import manifest from '../../../public/experiences/sanofi/content/manifest.json'
import seed from '../../../public/experiences/sanofi/content/seeds/fresh.json'
import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import { HomePage } from '@/experiences/sanofi/HomePage'
import { createSanofiRoutes } from '@/experiences/sanofi/routes'
import { sanofiExperienceShell } from '@/experiences/sanofi/shell'

const registry = validateContentBundle({
  manifestFile: 'manifest.json',
  manifest,
  appConfigFile: 'app-config.json',
  appConfig,
  courseFiles: [],
  caseFiles: [],
  anatomyMapFiles: [],
  roundFiles: [],
  gameFiles: [],
  seedFile: 'seeds/fresh.json',
  seed,
  assetManifestFile: 'assets.json',
  assetManifest,
})

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (!value || typeof value !== 'object') return []
  return Object.values(value).flatMap(collectStrings)
}

describe('sanofi stub experience', () => {
  it('renders configured app and game names with a disabled action', () => {
    render(
      <ContentContext.Provider value={registry}>
        <HomePage />
      </ContentContext.Provider>,
    )

    expect(screen.getByRole('heading', { name: 'Respiratory Challenge' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Start a quick challenge' })).toBeDisabled()
    expect(screen.getByText('Coming soon')).toBeVisible()
    expect(registry.appConfig.app.name).toBe('Autovrse LevelUp')
    expect(registry.seed.learner.name).toBe('You')
  })

  it('registers Home, game play, result and the shared not-found route', () => {
    const paths = createSanofiRoutes().flatMap(
      ({ children }) => children?.map(({ index, path }) => (index ? '/' : path)) ?? [],
    )
    expect(paths).toEqual(['/', 'results/:runId', '*', 'play/:gameId'])
  })

  it('contains no client name or LMS vocabulary in player-visible copy', () => {
    const text = collectStrings([appConfig, sanofiExperienceShell])
    const forbidden =
      /\b(?:sanofi|course|lesson|learning path|training module|curriculum|learning objective|complete lesson|certification|course progress|continue learning|assessment|pass|fail|grade|learning outcome|course completed|xp)\b/i

    expect(text.filter((value) => forbidden.test(value))).toEqual([])
  })
})
