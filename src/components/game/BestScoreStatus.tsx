import { Trophy } from 'lucide-react'

import { useContent } from '@/app/contentContext'
import { AnimatedNumber } from '@/components/ui'
import { useLearnerStore } from '@/state/learnerStore'

export function BestScoreStatus() {
  const { appConfig } = useContent()
  const games = useLearnerStore((state) => state.games)
  const config = appConfig.games
  const primaryFormat = config?.formats.find(({ id }) => id === config.hub.primaryFormatId)
  const best = primaryFormat?.gameId ? (games[primaryFormat.gameId]?.bestTotal ?? 0) : 0

  return (
    <span
      aria-label={`${config?.hub.bestScoreLabel ?? 'Best score'} ${best}`}
      className="flex items-center gap-1 text-small font-semibold text-brand-800"
    >
      <Trophy aria-hidden="true" size={17} />
      <AnimatedNumber value={best} />
    </span>
  )
}
