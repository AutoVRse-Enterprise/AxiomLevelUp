import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  message: string
  icon?: ReactNode
  action?: ReactNode
  secondaryAction?: ReactNode
  tone?: 'neutral' | 'brand'
  titleAs?: 'h1' | 'h2' | 'h3'
  titleId?: string
}

export function EmptyState({
  title,
  message,
  icon,
  action,
  secondaryAction,
  tone = 'neutral',
  titleAs: Heading = 'h1',
  titleId,
}: EmptyStateProps) {
  return (
    <div
      className={`mx-auto max-w-md rounded-xl border p-6 text-center sm:p-8 ${
        tone === 'brand'
          ? 'border-brand-200 bg-brand-50'
          : 'border-neutral-200 bg-neutral-50'
      }`}
    >
      {icon ? (
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-white text-brand-700 shadow-sm">
          {icon}
        </div>
      ) : null}
      <Heading className="text-heading font-bold" id={titleId}>{title}</Heading>
      <p className="mt-2 text-neutral-600">{message}</p>
      {action || secondaryAction ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}
