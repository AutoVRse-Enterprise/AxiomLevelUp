import { describe, expect, it } from 'vitest'

import { experienceBuilds } from '@/experiences/builds'
import { EXPERIENCE_IDS } from '@/lib/experienceIds'

describe('experience build metadata', () => {
  it('has one build record with a matching id for every known experience', () => {
    expect(Object.keys(experienceBuilds)).toEqual(EXPERIENCE_IDS)
    for (const id of EXPERIENCE_IDS) expect(experienceBuilds[id].id).toBe(id)
  })
})
