import type { CaseDocument, CaseLabConfig } from '@/content/schema'

export function formatCaseTier(caseLab: CaseLabConfig, tier: CaseDocument['tier']): string {
  return caseLab.tiers[tier].label
}

export function formatCaseOrganSystem(caseLab: CaseLabConfig, organSystem: string): string {
  return caseLab.organSystems[organSystem] ?? 'Unknown organ system'
}

export function formatEstimatedMinutes(minutes: number, approximate = false): string {
  return `${approximate ? '~' : ''}${minutes} min`
}

export function formatDuration(seconds: number): string {
  const roundedSeconds = Math.max(0, Math.round(seconds))
  return `${Math.floor(roundedSeconds / 60)}:${String(roundedSeconds % 60).padStart(2, '0')}`
}

export function formatScore(score: number): string {
  return `${score}/100`
}

export function formatXp(xp: number): string {
  return `${xp.toLocaleString('en-US')} XP`
}
