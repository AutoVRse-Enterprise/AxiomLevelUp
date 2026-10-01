import { BookOpen, Construction, Target, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { Button, Card, Chip, ProgressBar } from '@/components/ui'
import { useLearnerStore } from '@/state/learnerStore'
import { selectCourseCompletion, selectLeaderboardRank, selectLevel } from '@/state/selectors'

export function HomePage() {
  const { courseById } = useContent()
  const learner = useLearnerStore((state) => state.learner)
  const lessonProgress = useLearnerStore((state) => state.lessonProgress)
  const course = courseById.get('scientific-imaging')
  const progress = course ? selectCourseCompletion({ lessonProgress }, course) : 0

  return (
    <div className="space-y-6">
      <header>
        <p className="text-small font-semibold text-brand-700">Good afternoon</p>
        <h1 className="mt-1 text-display font-bold tracking-tight">
          Welcome back, {learner.name.split(' ')[0]}
        </h1>
        <p className="mt-2 text-neutral-600">Continue building scientific confidence.</p>
      </header>
      <Card>
        <Chip tone="brand">Continue learning</Chip>
        <h2 className="mt-4 text-title font-bold">{course?.title ?? 'Continue learning'}</h2>
        <p className="mt-2 text-neutral-600">Current lesson: Interpreting thoracic CT</p>
        <ProgressBar className="mt-5" label="Course progress" value={progress} />
        <Button className="mt-6" leadingIcon={<BookOpen aria-hidden="true" size={18} />}>
          Continue lesson
        </Button>
      </Card>
    </div>
  )
}

export function LearnPage() {
  const { courses } = useContent()
  return (
    <Placeholder
      icon={<BookOpen size={28} />}
      title="Learning pathways"
      description={`${courses.length} configured courses and ${courses.reduce((sum, course) => sum + course.lessons.length, 0)} lessons are ready for the Phase 2 surfaces.`}
      action={
        <Button onClick={() => undefined}>
          Browse active pathway
        </Button>
      }
    />
  )
}

export function ChallengePage() {
  const { appConfig } = useContent()
  const challenge = appConfig.challenges.find(({ type }) => type === 'daily')
  return (
    <Placeholder
      icon={<Target size={28} />}
      title={challenge?.title ?? "Today's challenge"}
      description={`${challenge?.itemCount ?? 0} focused interactions · approximately ${challenge?.estimatedMinutes ?? 0} minutes · +${challenge?.rewardXp ?? 0} XP`}
    />
  )
}

export function LeaderboardPage() {
  const { appConfig } = useContent()
  const learner = useLearnerStore((state) => state.learner)
  const xp = useLearnerStore((state) => state.xp)
  const rank = selectLeaderboardRank({ learner, xp }, appConfig.leaderboard.entries) ?? 0
  const current = appConfig.leaderboard.entries.find(({ id }) => id === learner.id)
  const movement = current?.previousRank ? current.previousRank - rank : 0
  return (
    <Placeholder
      icon={<Trophy size={28} />}
      title={appConfig.leaderboard.scope}
      description={`${learner.name} is currently #${rank} this week and has moved up ${movement} positions.`}
    />
  )
}

export function ProfilePage() {
  const { appConfig } = useContent()
  const learner = useLearnerStore((state) => state.learner)
  const xp = useLearnerStore((state) => state.xp)
  const streak = useLearnerStore((state) => state.streak)
  const level = selectLevel({ xp }, appConfig.gamification.levels)
  return (
    <Placeholder
      title={learner.name}
      description={`${learner.role} · Level ${level} · ${xp.total.toLocaleString()} lifetime XP · ${streak.currentDays} day streak`}
    />
  )
}

export function ParameterPage({ kind }: { kind: string }) {
  const params = useParams()
  const id = Object.values(params)[0] ?? 'unknown'

  return <Placeholder title={`${kind}: ${id}`} description="This configured surface arrives in Phase 2." />
}

export function ImmersivePlaceholder({ kind }: { kind: string }) {
  const params = useParams()
  return (
    <div className="grid min-h-[calc(100dvh-3.5rem)] place-items-center p-6">
      <Placeholder
        icon={<Construction size={28} />}
        title={`${kind} shell`}
        description={`Immersive navigation is active for ${Object.values(params)[0] ?? 'this activity'}.`}
      />
    </div>
  )
}

export function NotFoundPage() {
  return (
    <Placeholder
      title="Page not found"
      description="The address does not match a learning experience."
      action={
        <Link className="font-semibold text-brand-700 underline" to="/">
          Return home
        </Link>
      }
    />
  )
}

function Placeholder({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <Card className="mx-auto max-w-2xl">
      {icon ? <div className="text-brand-700">{icon}</div> : null}
      <h1 className="mt-3 text-title font-bold">{title}</h1>
      <p className="mt-2 text-neutral-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  )
}
