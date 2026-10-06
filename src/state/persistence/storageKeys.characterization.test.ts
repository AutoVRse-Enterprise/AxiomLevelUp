import { describe, expect, it } from 'vitest'

import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { useEventLogStore } from '@/events/eventLogStore'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import {
  PASSIVE_DICOM_CACHE,
  SIMULATED_OFFLINE_KEY,
  VERIFIED_PACKAGE_CACHE,
  VERSIONED_MODEL_CACHE,
} from '@/pwa/cachePolicy'
import { useLearnerStore } from '@/state/learnerStore'
import { DEFAULT_STORAGE_CONTRACT } from '@/state/persistence/defaultStorageContract'

describe('default persistence contract', () => {
  it('keeps every persisted Zustand store on its legacy name', () => {
    expect([
      useLearnerStore.persist.getOptions().name,
      useActivitySessionStore.persist.getOptions().name,
      useEventLogStore.persist.getOptions().name,
      useOfflineLibraryStore.persist.getOptions().name,
    ]).toEqual(DEFAULT_STORAGE_CONTRACT.persistedStores)
  })

  it('keeps local, session, service-worker and cache names literal', () => {
    expect(DEFAULT_STORAGE_CONTRACT).toMatchObject({
      idbPrefix: 'axiom-runtime:',
      preferencesKey: 'axiom-runtime:preferences',
      simulatedOfflineKey: 'axiom-runtime:simulated-offline',
      pathwayKeyPrefix: 'axiom-runtime:pathway:',
      serviceWorkerDatabase: 'axiom-runtime-service-worker',
    })
    expect(SIMULATED_OFFLINE_KEY).toBe(DEFAULT_STORAGE_CONTRACT.simulatedOfflineKey)
    expect({
      verifiedPackages: VERIFIED_PACKAGE_CACHE,
      passiveDicom: PASSIVE_DICOM_CACHE,
      versionedModels: VERSIONED_MODEL_CACHE,
    }).toEqual(DEFAULT_STORAGE_CONTRACT.caches)
  })
})
