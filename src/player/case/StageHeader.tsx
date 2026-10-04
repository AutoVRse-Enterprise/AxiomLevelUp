import { CircleHelp } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui'
import type { CaseStageBoundary } from '@/engines/cases/plan'

interface StageHeaderProps {
  stages: readonly CaseStageBoundary[]
  currentStage: CaseStageBoundary
  onShowWalkthrough: () => void
  clock?: ReactNode
}

export function StageHeader({
  stages,
  currentStage,
  onShowWalkthrough,
  clock,
}: StageHeaderProps) {
  const currentIndex = stages.findIndex(({ stageId }) => stageId === currentStage.stageId)

  return (
    <header className="rounded-xl border border-brand-100 bg-brand-50 p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <p className="font-bold text-neutral-950">Case progress</p>
        <div className="flex flex-wrap items-center gap-2">
          {clock}
          <Button
            aria-label="Replay how this case works"
            leadingIcon={<CircleHelp aria-hidden="true" size={16} />}
            size="sm"
            variant="secondary"
            onClick={onShowWalkthrough}
          >
            How this works
          </Button>
        </div>
      </div>
      <ol
        className="mt-3 grid gap-2 sm:mt-4"
        style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
        aria-label="Case stages"
      >
        {stages.map((stage, index) => (
          <li
            key={stage.stageId}
            aria-label={`${stage.title}: ${index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming'}`}
            aria-current={index === currentIndex ? 'step' : undefined}
          >
            <span
              aria-hidden="true"
              className={`block h-1.5 rounded-full ${
                index <= currentIndex ? 'bg-brand-700' : 'bg-brand-200'
              }`}
            />
            <span
              className={`mt-1 block truncate text-caption font-semibold ${
                index === currentIndex ? 'text-brand-800' : 'text-neutral-600'
              }`}
            >
              {stage.title}
            </span>
          </li>
        ))}
      </ol>
    </header>
  )
}
