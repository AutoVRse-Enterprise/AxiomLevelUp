import { activeExperienceId, cacheNameFor, storagePrefixFor } from '@/lib/experience'

export const APP_CACHE_PREFIX =
  activeExperienceId === 'default' ? 'axiom-runtime' : `axiom-runtime-${activeExperienceId}`
export const VERIFIED_PACKAGE_CACHE = cacheNameFor(activeExperienceId, 'offline-courses-v1')
export const VERIFIED_COURSE_CACHE = VERIFIED_PACKAGE_CACHE
export const PASSIVE_DICOM_CACHE = cacheNameFor(activeExperienceId, 'dicom-studies-v1')
export const PASSIVE_DICOM_MAX_ENTRIES = 180
export const PASSIVE_DICOM_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
export const VERSIONED_MODEL_CACHE = cacheNameFor(activeExperienceId, 'versioned-case-models-v1')
export const VERSIONED_MODEL_MAX_ENTRIES = 4
export const VERSIONED_MODEL_MAX_AGE_SECONDS = 60 * 60 * 24 * 14

export const SIMULATED_OFFLINE_KEY = `${storagePrefixFor(activeExperienceId)}simulated-offline`
