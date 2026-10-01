import type { AppConfig } from '@/content/schema'

export function levelForXp(xp: number, levels: AppConfig['gamification']['levels']) {
  return [...levels]
    .sort((left, right) => left.minimumXp - right.minimumXp)
    .reduce(
      (current, candidate) => (xp >= candidate.minimumXp ? candidate.level : current),
      levels[0]?.level ?? 1,
    )
}

export function xpToNextLevel(xp: number, levels: AppConfig['gamification']['levels']) {
  const next = [...levels]
    .sort((left, right) => left.minimumXp - right.minimumXp)
    .find(({ minimumXp }) => minimumXp > xp)
  return next ? next.minimumXp - xp : 0
}
