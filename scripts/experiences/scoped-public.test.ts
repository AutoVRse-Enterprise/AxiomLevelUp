import { describe, expect, it } from 'vitest'

import { getExperienceBuild } from '@/experiences/builds'

import { resolveScopedPublicRelease } from './scoped-public.ts'

describe('scoped Sanofi public release', () => {
  it('packs the thoracic CT series and leaves it out of the service-worker precache', () => {
    const release = resolveScopedPublicRelease(process.cwd(), getExperienceBuild('sanofi'))
    expect(release).not.toBeNull()
    const dicomFiles = [...(release?.publicFiles ?? [])].filter((file) =>
      file.startsWith('assets/dicom/thoracic-ct/'),
    )
    expect(dicomFiles).toContain('assets/dicom/thoracic-ct/manifest.json')
    expect(dicomFiles.filter((file) => file.endsWith('.dcm'))).toHaveLength(125)
    expect(release?.precacheEntries.some((entry) => entry.url.includes('thoracic-ct'))).toBe(false)
  })
})
