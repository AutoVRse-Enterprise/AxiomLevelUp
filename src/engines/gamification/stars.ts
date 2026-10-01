import type { AppConfig, Lesson } from '@/content/schema'

export function starsForScore(
  score: number,
  thresholds: NonNullable<Lesson['starThresholds']> | AppConfig['gamification']['stars'],
) {
  if (score >= thresholds.three) return 3
  if (score >= thresholds.two) return 2
  if (score >= thresholds.one) return 1
  return 0
}
