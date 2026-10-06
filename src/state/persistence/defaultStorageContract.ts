export const DEFAULT_STORAGE_CONTRACT = {
  idbPrefix: 'axiom-runtime:',
  persistedStores: ['learner', 'activity-session', 'event-log', 'offline-library'],
  preferencesKey: 'axiom-runtime:preferences',
  simulatedOfflineKey: 'axiom-runtime:simulated-offline',
  pathwayKeyPrefix: 'axiom-runtime:pathway:',
  serviceWorkerDatabase: 'axiom-runtime-service-worker',
  caches: {
    verifiedPackages: 'offline-courses-v1',
    passiveDicom: 'dicom-studies-v1',
    versionedModels: 'versioned-case-models-v1',
  },
} as const
