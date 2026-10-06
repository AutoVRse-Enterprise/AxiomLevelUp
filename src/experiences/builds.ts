import { defaultBuild } from './default/build'
import { sanofiBuild } from './sanofi/build'
import type { ExperienceBuildMetadata } from './types'
import type { ExperienceId } from '../lib/experienceIds'

export const experienceBuilds = {
  default: defaultBuild,
  sanofi: sanofiBuild,
} satisfies Record<ExperienceId, ExperienceBuildMetadata>

export function getExperienceBuild(id: ExperienceId): ExperienceBuildMetadata {
  return experienceBuilds[id]
}
