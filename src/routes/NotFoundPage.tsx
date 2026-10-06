import { Link } from 'react-router'

import { useExperienceShell } from '@/app/experienceShell'
import { EmptyState } from '@/components/feedback/EmptyState'

export function NotFoundPage() {
  const { copy } = useExperienceShell()
  return (
    <EmptyState
      action={
        <Link className="font-semibold text-brand-700 underline" to="/">
          {copy.notFound.homeLabel}
        </Link>
      }
      message={copy.notFound.message}
      title={copy.notFound.title}
    />
  )
}
