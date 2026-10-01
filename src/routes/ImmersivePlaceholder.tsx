import { Construction } from 'lucide-react'
import { useParams } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'

export function ImmersivePlaceholder({ kind }: { kind: string }) {
  const params = useParams()
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] place-items-center p-6">
      <EmptyState
        icon={<Construction aria-hidden="true" size={28} />}
        message={`The ${kind.toLowerCase()} player for ${Object.values(params)[0] ?? 'this activity'} arrives in Phase 3.`}
        title={`${kind} player is next`}
      />
    </div>
  )
}
