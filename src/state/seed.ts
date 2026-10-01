import { learnerSeedSchema, type LearnerSeed } from '@/content/schema'
import { useLearnerStore } from '@/state/learnerStore'

export type SeedProfile = LearnerSeed['seedProfile']

export async function loadLearnerSeed(profile: SeedProfile) {
  const response = await fetch(`/content/seeds/${profile}.json`)
  if (!response.ok) {
    throw new Error(`Could not load the ${profile} demo seed (${response.status}).`)
  }
  return learnerSeedSchema.parse(await response.json())
}

export async function replaceWithSeed(profile: SeedProfile) {
  const seed = await loadLearnerSeed(profile)
  useLearnerStore.getState().replaceWithSeed(seed)
}
