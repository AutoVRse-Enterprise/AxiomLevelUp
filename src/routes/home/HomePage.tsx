import { useContent } from '@/app/contentContext'
import { Card } from '@/components/ui'
import { useLearnerStore } from '@/state/learnerStore'
import { selectContinueLearning } from '@/state/selectors'

export function HomePage() {
  const { courses, lessonById, courseById } = useContent()
  const lessonProgress = useLearnerStore((state) => state.lessonProgress)
  const summary = selectContinueLearning({ lessonProgress }, courses, lessonById, courseById)

  return (
    <Card>
      <h1 className="text-title font-bold">Welcome back</h1>
      <p className="mt-2 text-neutral-600">
        {summary?.nextLesson ? `Continue with ${summary.nextLesson.title}.` : 'Choose a course to begin.'}
      </p>
    </Card>
  )
}
