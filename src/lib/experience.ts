/// <reference types="vite/client" />

import { resolveExperienceId, type ExperienceId } from '@/lib/experienceIds'

const environment = (
  import.meta as ImportMeta & {
    env?: ImportMetaEnv
  }
).env

export const activeExperienceId = resolveExperienceId(
  environment?.VITE_EXPERIENCE,
  environment?.MODE,
)

export function storagePrefixFor(id: ExperienceId): string {
  return id === 'default' ? 'axiom-runtime:' : `axiom-runtime:${id}:`
}

export function cacheNameFor(id: ExperienceId, legacyName: string): string {
  return id === 'default' ? legacyName : `${id}-${legacyName}`
}

export function serviceWorkerDatabaseFor(id: ExperienceId): string {
  return id === 'default' ? 'axiom-runtime-service-worker' : `axiom-runtime-${id}-service-worker`
}
