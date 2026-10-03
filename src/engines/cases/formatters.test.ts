import appConfigJson from '../../../public/content/app-config.json'
import { describe, expect, it } from 'vitest'

import { appConfigSchema } from '@/content/schema'
import {
  formatCaseOrganSystem,
  formatCaseTier,
  formatDuration,
  formatEstimatedMinutes,
  formatScore,
  formatXp,
} from '@/engines/cases/formatters'
import { makeCaseRegistry } from '@/test/caseFixtures'

const caseLab = makeCaseRegistry().appConfig.caseLab!
const configuredCaseLab = appConfigSchema.parse(appConfigJson).caseLab!

describe('Case Lab formatters', () => {
  it('resolves configured tier and organ-system labels', () => {
    expect(formatCaseTier(caseLab, 'foundation')).toBe('Basic')
    expect(formatCaseOrganSystem(caseLab, 'generic')).toBe('Generic')
    expect(formatCaseOrganSystem(configuredCaseLab, 'respiratory')).toBe('Respiratory')
    expect(formatCaseOrganSystem(caseLab, 'unconfigured')).toBe('Unknown organ system')
  })

  it('formats time, scores, and XP consistently', () => {
    expect(formatEstimatedMinutes(4)).toBe('4 min')
    expect(formatEstimatedMinutes(3, true)).toBe('~3 min')
    expect(formatDuration(90.4)).toBe('1:30')
    expect(formatDuration(-2)).toBe('0:00')
    expect(formatScore(88)).toBe('88/100')
    expect(formatXp(1250)).toBe('1,250 XP')
  })
})
