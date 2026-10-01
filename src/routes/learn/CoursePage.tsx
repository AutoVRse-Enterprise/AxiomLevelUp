import { useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'

export function CoursePage() {
  const { courseId } = useParams()
  const { courseById } = useContent()
  const course = courseId ? courseById.get(courseId) : undefined
  if (!course) return <EmptyState title="Course not found" message="This course is not configured." />
  return <h1 className="text-display font-bold">{course.title}</h1>
}
