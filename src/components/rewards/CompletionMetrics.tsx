import { Award, Brain, Medal, Star } from 'lucide-react'

import { Chip } from '@/components/ui'

interface CompletionMetricsProps {
  awardedXp?: number | null
  stars: number
  masteryDelta?: Record<string, number>
  badgeLabels?: readonly string[]
}

function formatMastery(delta: Record<string, number>) {
  const total = Object.values(delta).reduce((sum, value) => sum + value, 0)
  if (total === 0) return 'No mastery change'
  const rounded = Math.round(total * 100) / 100
  return `${rounded > 0 ? '+' : ''}${rounded} mastery`
}

export function CompletionMetrics({
  awardedXp,
  stars,
  masteryDelta,
  badgeLabels,
}: CompletionMetricsProps) {
  return (
    <div aria-label="Completion outcomes" className="flex flex-wrap gap-2">
      <Chip aria-label={`${stars} of 3 stars`}>
        <Star aria-hidden="true" className="mr-1 text-star" size={14} />
        {stars} {stars === 1 ? 'star' : 'stars'}
      </Chip>
      <Chip>
        <Award aria-hidden="true" className="mr-1" size={14} />
        {awardedXp === undefined || awardedXp === null
          ? 'XP unavailable'
          : `${awardedXp.toLocaleString()} XP awarded`}
      </Chip>
      {masteryDelta === undefined ? null : (
        <Chip>
          <Brain aria-hidden="true" className="mr-1" size={14} />
          {formatMastery(masteryDelta)}
        </Chip>
      )}
      {badgeLabels?.length ? (
        <Chip>
          <Medal aria-hidden="true" className="mr-1" size={14} />
          Badge: {badgeLabels.join(', ')}
        </Chip>
      ) : null}
    </div>
  )
}
