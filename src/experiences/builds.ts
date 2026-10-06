import { defaultBuild } from '@/experiences/default/build'
import { sanofiBuild } from '@/experiences/sanofi/build'
import type { ExperienceBuildMetadata } from '@/experiences/types'
import type { ExperienceId } from '@/lib/experienceIds'

export const experienceBuilds = {
  default: defaultBuild,
  sanofi: sanofiBuild,
} satisfies Record<ExperienceId, ExperienceBuildMetadata>

export function getExperienceBuild(id: ExperienceId): ExperienceBuildMetadata {
  return experienceBuilds[id]
}
