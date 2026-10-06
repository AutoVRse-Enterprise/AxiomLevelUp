import { describe, expect, it } from 'vitest'

import { cacheNameFor, serviceWorkerDatabaseFor, storagePrefixFor } from '@/lib/experience'
import { EXPERIENCE_IDS, resolveExperienceId } from '@/lib/experienceIds'

describe('experience resolution', () => {
  it('defaults an unset or blank value to the default experience', () => {
    expect(resolveExperienceId(undefined, 'development')).toBe('default')
    expect(resolveExperienceId('  ', 'production')).toBe('default')
  })

  it.each(EXPERIENCE_IDS)('accepts the known %s experience', (id) => {
    expect(resolveExperienceId(id, id)).toBe(id)
  })

  it('rejects unknown identifiers with the valid choices', () => {
    expect(() => resolveExperienceId('other', 'development')).toThrow(
      'Unknown VITE_EXPERIENCE "other". Expected one of: default, sanofi.',
    )
  })

  it('rejects an experience mode overridden by a conflicting process value', () => {
    expect(() => resolveExperienceId('sanofi', 'default')).toThrow(
      'Process environment variables override .env.[mode]',
    )
  })
})

describe('experience namespaces', () => {
  it('preserves default names and scopes non-default names', () => {
    expect(storagePrefixFor('default')).toBe('axiom-runtime:')
    expect(storagePrefixFor('sanofi')).toBe('axiom-runtime:sanofi:')
    expect(cacheNameFor('default', 'offline-courses-v1')).toBe('offline-courses-v1')
    expect(cacheNameFor('sanofi', 'offline-courses-v1')).toBe('sanofi-offline-courses-v1')
    expect(serviceWorkerDatabaseFor('default')).toBe('axiom-runtime-service-worker')
    expect(serviceWorkerDatabaseFor('sanofi')).toBe('axiom-runtime-sanofi-service-worker')
  })
})
