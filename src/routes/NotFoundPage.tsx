import { Link } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'

export function NotFoundPage() {
  return (
    <EmptyState
      action={
        <Link className="font-semibold text-brand-700 underline" to="/">
          Return home
        </Link>
      }
      message="The address does not match a learning experience."
      title="Page not found"
    />
  )
}
