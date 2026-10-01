import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  message: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-md py-14 text-center">
      {icon ? <div className="mx-auto mb-4 w-fit text-neutral-500">{icon}</div> : null}
      <h1 className="text-heading font-bold">{title}</h1>
      <p className="mt-2 text-neutral-600">{message}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
