import { X } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'

import { IconButton, ProgressBar } from '@/components/ui'
import type { PrimitiveLayout } from '@/primitives/definitions'

interface StepFrameProps {
  title: string
  definitionLabel: string
  progress: number
  layout: PrimitiveLayout
  onExit: () => void
  children: ReactNode
  footer?: ReactNode
  timer?: ReactNode
}

export function StepFrame({
  title,
  definitionLabel,
  progress,
  layout,
  onExit,
  children,
  footer,
  timer,
}: StepFrameProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [title])

  return (
    <div
      className={`mx-auto px-4 py-5 sm:px-6 sm:py-8 ${
        layout === 'split' ? 'max-w-6xl' : 'max-w-3xl'
      }`}
      data-layout={layout}
    >
      <div className="flex items-start gap-4">
        <ProgressBar className="min-w-0 flex-1" value={progress} label="Activity progress" />
        <IconButton label="Exit activity" icon={<X aria-hidden="true" />} onClick={onExit} />
      </div>
      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-8">
        <h1 ref={headingRef} tabIndex={-1} className="sr-only">
          {title}
        </h1>
        <div className="mb-5 flex min-h-7 items-center justify-between gap-4">
          <p className="text-caption font-bold tracking-wide text-brand-700 uppercase">
            {definitionLabel}
          </p>
          {timer ? <div aria-label="Activity timer">{timer}</div> : null}
        </div>
        <div
          className={
            layout === 'split'
              ? 'grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start'
              : undefined
          }
        >
          {children}
        </div>
      </section>
      {footer ? <div className="mt-5 flex justify-end">{footer}</div> : null}
    </div>
  )
}
