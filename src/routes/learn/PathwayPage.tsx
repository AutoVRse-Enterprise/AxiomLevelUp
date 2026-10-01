import { useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'

export function PathwayPage() {
  const { pathwayId } = useParams()
  const { appConfig } = useContent()
  const pathway = appConfig.pathways.find(({ id }) => id === pathwayId)
  if (!pathway) return <EmptyState title="Pathway not found" message="This pathway is not configured." />
  return <h1 className="text-display font-bold">{pathway.title}</h1>
}
