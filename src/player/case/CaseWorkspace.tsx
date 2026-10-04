import { FileQuestion, Lightbulb, NotebookTabs } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type WorkspaceSegment = 'task' | 'evidence' | 'notes'

interface CaseWorkspaceProps {
  task: ReactNode
  taskNotice?: ReactNode
  evidence: ReactNode
  notes: ReactNode
  evidenceAnnouncement?: string
  segment: WorkspaceSegment
  onSegmentChange: (segment: WorkspaceSegment) => void
}

const segments: Array<{
  id: WorkspaceSegment
  label: string
  icon: typeof FileQuestion
}> = [
  { id: 'task', label: 'Task', icon: FileQuestion },
  { id: 'evidence', label: 'Evidence', icon: Lightbulb },
  { id: 'notes', label: 'Notes', icon: NotebookTabs },
]

const desktopSegments = segments.slice(1) as Array<
  (typeof segments)[number] & { id: Exclude<WorkspaceSegment, 'task'> }
>

export function CaseWorkspace({
  task,
  taskNotice,
  evidence,
  notes,
  evidenceAnnouncement,
  segment,
  onSegmentChange,
}: CaseWorkspaceProps) {
  const desktopPanel = segment === 'notes' ? 'notes' : 'evidence'

  return (
    <div data-case-workspace="">
      <p className="sr-only" role="status" aria-live="polite">
        {evidenceAnnouncement}
      </p>

      <div
        className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 -mx-1 mb-4 grid grid-cols-3 gap-1 rounded-xl border border-neutral-200 bg-white/95 p-1 shadow-sm backdrop-blur md:hidden"
        role="tablist"
        aria-label="Case workspace"
      >
        {segments.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-controls={`case-workspace-${id}`}
            aria-selected={segment === id}
            className={cn(
              'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-small font-semibold focus-visible:outline-2',
              segment === id ? 'bg-brand-700 text-white' : 'text-neutral-700 hover:bg-neutral-50',
            )}
            onClick={() => onSegmentChange(id)}
          >
            <Icon aria-hidden="true" size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] md:items-start md:gap-6">
        <main
          id="case-workspace-task"
          role="tabpanel"
          aria-label="Task"
          className={cn(segment !== 'task' && 'hidden', 'min-w-0 md:block')}
          data-case-task=""
        >
          {taskNotice}
          {task}
        </main>

        <aside
          className={cn(
            segment === 'task' && 'hidden',
            'min-w-0 md:sticky md:top-[calc(5rem+env(safe-area-inset-top))] md:block md:max-h-[calc(100dvh-6rem)] md:overflow-y-auto md:overscroll-contain',
          )}
          aria-label="Case evidence workspace"
        >
          <div
            className="mb-3 hidden grid-cols-2 rounded-lg bg-neutral-100 p-1 md:grid"
            role="tablist"
            aria-label="Evidence workspace"
          >
            {desktopSegments.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-controls={`case-workspace-${id}`}
                aria-selected={desktopPanel === id}
                className={cn(
                  'min-h-10 rounded-md px-3 py-2 text-small font-semibold focus-visible:outline-2',
                  desktopPanel === id
                    ? 'bg-white text-brand-800 shadow-sm'
                    : 'text-neutral-700 hover:text-neutral-950',
                )}
                onClick={() => onSegmentChange(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <section
            id="case-workspace-evidence"
            role="tabpanel"
            aria-label="Evidence"
            className={cn(
              segment !== 'evidence' && 'hidden',
              desktopPanel === 'evidence' ? 'md:block' : 'md:hidden',
              'rounded-xl border border-neutral-200 bg-white p-4 shadow-card sm:p-5',
            )}
          >
            {evidence}
          </section>
          <section
            id="case-workspace-notes"
            role="tabpanel"
            aria-label="Notes"
            className={cn(
              segment !== 'notes' && 'hidden',
              desktopPanel === 'notes' ? 'md:block' : 'md:hidden',
              'rounded-xl border border-neutral-200 bg-white p-4 shadow-card sm:p-5',
            )}
          >
            {notes}
          </section>
        </aside>
      </div>
    </div>
  )
}
