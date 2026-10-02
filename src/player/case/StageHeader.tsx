import type { ReactNode } from 'react'

import { Chip } from '@/components/ui'
import type { CaseStageBoundary } from '@/engines/cases/plan'

interface StageHeaderProps {
  stages: readonly CaseStageBoundary[]
  currentStage: CaseStageBoundary
  tierLabel: string
  clock?: ReactNode
}

export function StageHeader({ stages, currentStage, tierLabel, clock }: StageHeaderProps) {
  const currentIndex = stages.findIndex(({ stageId }) => stageId === currentStage.stageId)

  return (
    <header className="rounded-xl border border-brand-100 bg-brand-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption font-bold tracking-wide text-brand-700 uppercase">
            Stage {currentIndex + 1} of {stages.length} · {currentStage.kind}
          </p>
          <h2 className="mt-1 text-heading font-bold text-neutral-950">{currentStage.title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="brand">{tierLabel}</Chip>
          {clock}
        </div>
      </div>
      <ol
        className="mt-4 grid gap-1"
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
