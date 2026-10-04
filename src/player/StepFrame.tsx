import { X } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'

import { IconButton, ProgressBar } from '@/components/ui'
import {
  CaseWorkspace,
  type WorkspaceSegment,
} from '@/player/case/CaseWorkspace'
import { StepActionScope, StepActionSlot } from '@/player/StepActionSlot'
import type { PrimitiveLayout } from '@/primitives/definitions'

interface StepFrameProps {
  title: string
  definitionLabel: string
  progress?: number
  layout: PrimitiveLayout
  onExit: () => void
  children: ReactNode
  footer?: ReactNode
  timer?: ReactNode
  chromeHeader?: ReactNode
  chromeAside?: ReactNode
  chromeNotes?: ReactNode
  evidenceAnnouncement?: string
  workspaceSegment?: WorkspaceSegment
  onWorkspaceSegmentChange?: (segment: WorkspaceSegment) => void
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
  chromeHeader,
  chromeAside,
  chromeNotes,
  evidenceAnnouncement,
  workspaceSegment,
  onWorkspaceSegmentChange,
}: StepFrameProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!chromeHeader) headingRef.current?.focus()
  }, [chromeHeader, title])

  const task = (
    <>
      <section
        className={`animate-slide-up rounded-xl border border-neutral-200 bg-white shadow-card ${
          layout === 'viewer' ? 'p-2 sm:p-4' : 'p-5 sm:p-8'
        }`}
      >
        <h1 ref={headingRef} tabIndex={-1} className="sr-only">
          {title}
        </h1>
        <div className="mb-5 flex min-h-7 items-center justify-between gap-4">
          <p className="text-caption font-bold tracking-wide text-brand-700 uppercase">
            {definitionLabel}
          </p>
          {timer ? <div>{timer}</div> : null}
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
      {footer ? (
        <StepActionSlot className="pb-[env(safe-area-inset-bottom)]">{footer}</StepActionSlot>
      ) : null}
    </>
  )

  return (
    <StepActionScope sticky={Boolean(chromeAside && chromeNotes)}>
      <div
        className={`mx-auto px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:py-8 ${
          chromeAside && chromeNotes
            ? 'max-w-7xl'
            : layout === 'viewer'
              ? 'max-w-7xl'
              : layout === 'split'
                ? 'max-w-6xl'
                : 'max-w-3xl'
        }`}
        data-layout={layout}
      >
        <div className="flex items-start gap-4">
          {chromeHeader ? (
            <div className="min-w-0 flex-1">{chromeHeader}</div>
          ) : progress !== undefined ? (
            <ProgressBar className="min-w-0 flex-1" value={progress} label="Activity progress" />
          ) : (
            <div className="flex-1" />
          )}
          <IconButton label="Exit activity" icon={<X aria-hidden="true" />} onClick={onExit} />
        </div>
        {chromeHeader && progress !== undefined ? (
          <ProgressBar className="mt-5" value={progress} label="Activity progress" />
        ) : null}
        <div className="mt-5 sm:mt-8">
          {chromeAside && chromeNotes ? (
            <CaseWorkspace
              task={task}
              evidence={chromeAside}
              notes={chromeNotes}
              evidenceAnnouncement={evidenceAnnouncement}
              segment={workspaceSegment ?? 'task'}
              onSegmentChange={onWorkspaceSegmentChange ?? (() => undefined)}
            />
          ) : (
            <>
              {task}
              {chromeAside ? <aside className="hidden md:block">{chromeAside}</aside> : null}
            </>
          )}
        </div>
      </div>
    </StepActionScope>
  )
}
