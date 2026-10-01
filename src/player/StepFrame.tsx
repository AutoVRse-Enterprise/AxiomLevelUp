import { X } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'

import { IconButton, ProgressBar } from '@/components/ui'

interface StepFrameProps {
  title: string
  progress: number
  onExit: () => void
  children: ReactNode
  footer?: ReactNode
}

export function StepFrame({ title, progress, onExit, children, footer }: StepFrameProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [title])

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="flex items-start gap-4">
        <ProgressBar
          className="min-w-0 flex-1"
          value={progress}
          label="Activity progress"
        />
        <IconButton label="Exit activity" icon={<X aria-hidden="true" />} onClick={onExit} />
      </div>
      <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-card sm:p-8">
        <h1 ref={headingRef} tabIndex={-1} className="sr-only">
          {title}
        </h1>
        {children}
      </section>
      {footer ? <div className="mt-5 flex justify-end">{footer}</div> : null}
    </div>
  )
}
