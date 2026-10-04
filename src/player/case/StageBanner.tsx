import { useEffect, useRef } from 'react'

import type { CaseStageBoundary } from '@/engines/cases/plan'

interface StageBannerProps {
  stage: CaseStageBoundary
}

export function StageBanner({ stage }: StageBannerProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [stage.stageId])

  return (
    <section
      aria-atomic="true"
      aria-labelledby={`case-stage-${stage.stageId}`}
      aria-live="polite"
      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <p className="text-caption font-bold tracking-wide text-brand-700 uppercase">Current stage</p>
      <h2
        className="mt-1 text-heading font-bold text-neutral-950 focus:outline-none"
        id={`case-stage-${stage.stageId}`}
        ref={headingRef}
        tabIndex={-1}
      >
        {stage.title}
      </h2>
      <p className="mt-2 text-small text-neutral-700">{stage.purpose}</p>
      {stage.update ? (
        <div className="mt-4 border-l-4 border-brand-300 bg-brand-50 px-3 py-2">
          <p className="text-caption font-bold text-brand-800">{stage.update.timeLabel}</p>
          <p className="mt-1 text-small text-neutral-800">{stage.update.narrative}</p>
        </div>
      ) : null}
    </section>
  )
}
