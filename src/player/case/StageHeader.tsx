import type { ReactNode } from 'react'

import { Chip } from '@/components/ui'
import type { CaseStageBoundary } from '@/engines/cases/plan'

interface StageHeaderProps {
  stages: readonly CaseStageBoundary[]
  currentStage: CaseStageBoundary
  currentStepIndex: number
  tierLabel: string
  clock?: ReactNode
}

export function StageHeader({
  stages,
  currentStage,
  currentStepIndex,
  tierLabel,
  clock,
}: StageHeaderProps) {
  const currentIndex = stages.findIndex(({ stageId }) => stageId === currentStage.stageId)
  const taskCount = currentStage.endIndex - currentStage.startIndex
  const taskIndex = currentStepIndex - currentStage.startIndex + 1

  return (
    <header className="rounded-xl border border-brand-100 bg-brand-50 p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:items-start sm:gap-3">
        <div className="min-w-0">
          <p className="text-caption font-bold tracking-wide text-brand-700 uppercase">
            Stage {currentIndex + 1} of {stages.length}
          </p>
          <h2 className="truncate text-base font-bold text-neutral-950 sm:mt-1 sm:text-heading">
            {currentStage.title}
          </h2>
          <p className="text-caption font-semibold text-neutral-600">
            Task {taskIndex} of {taskCount}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden sm:inline-flex">
            <Chip tone="brand">{tierLabel}</Chip>
          </span>
          {clock}
        </div>
      </div>
      <ol
        className="mt-2 grid gap-1 sm:mt-4"
        style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
        aria-label="Case stages"
      >
        {stages.map((stage, index) => (
          <li
            key={stage.stageId}
            className={`h-1.5 rounded-full ${
              index <= currentIndex ? 'bg-brand-700' : 'bg-brand-200'
            }`}
            aria-label={`${stage.title}: ${index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming'}`}
          />
        ))}
      </ol>
    </header>
  )
}
