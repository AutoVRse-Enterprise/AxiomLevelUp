export const EXPERIENCE_IDS = ['default', 'sanofi'] as const

export type ExperienceId = (typeof EXPERIENCE_IDS)[number]

export function isExperienceId(value: string): value is ExperienceId {
  return EXPERIENCE_IDS.some((id) => id === value)
}

export function resolveExperienceId(
  rawExperience: string | undefined,
  mode?: string,
): ExperienceId {
  const value = rawExperience?.trim() || 'default'
  if (!isExperienceId(value)) {
    throw new Error(
      `Unknown VITE_EXPERIENCE "${value}". Expected one of: ${EXPERIENCE_IDS.join(', ')}.`,
    )
  }
  if (mode && isExperienceId(mode) && mode !== value) {
    throw new Error(
      `Vite mode "${mode}" conflicts with VITE_EXPERIENCE="${value}". ` +
        'Process environment variables override .env.[mode]; unset the variable or use the matching mode.',
    )
  }
  return value
}
