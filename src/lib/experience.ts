import { resolveExperienceId, type ExperienceId } from '@/lib/experienceIds'

export const activeExperienceId = resolveExperienceId(
  import.meta.env.VITE_EXPERIENCE,
  import.meta.env.MODE,
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
