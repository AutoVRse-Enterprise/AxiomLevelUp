import { useContent } from '@/app/contentContext'

export function LearnPage() {
  const { courses } = useContent()
  return (
    <div>
      <h1 className="text-display font-bold">Learn</h1>
      <p className="mt-2 text-neutral-600">{courses.length} configured courses</p>
    </div>
  )
}
