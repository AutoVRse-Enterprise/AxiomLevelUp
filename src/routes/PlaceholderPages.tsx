import { BookOpen, Construction, Target, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'

import { Button, Card, Chip, ProgressBar } from '@/components/ui'

export function HomePage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-small font-semibold text-brand-700">Good afternoon</p>
        <h1 className="mt-1 text-display font-bold tracking-tight">Welcome back, Maya</h1>
        <p className="mt-2 text-neutral-600">Continue building scientific confidence.</p>
      </header>
      <Card>
        <Chip tone="brand">Continue learning</Chip>
        <h2 className="mt-4 text-title font-bold">Scientific Imaging Foundations</h2>
        <p className="mt-2 text-neutral-600">Current lesson: Interpreting thoracic CT</p>
        <ProgressBar className="mt-5" label="Course progress" value={62} />
        <Button className="mt-6" leadingIcon={<BookOpen aria-hidden="true" size={18} />}>
          Continue lesson
        </Button>
      </Card>
    </div>
  )
}

export function LearnPage() {
  return (
    <Placeholder
      icon={<BookOpen size={28} />}
      title="Learning pathways"
      description="Four configured courses and their progression states will appear here."
      action={
        <Button onClick={() => undefined}>
          Browse active pathway
        </Button>
      }
    />
  )
}

export function ChallengePage() {
  return (
    <Placeholder
      icon={<Target size={28} />}
      title="Today's challenge"
      description="Five focused interactions · approximately 3 minutes · +75 XP"
    />
  )
}

export function LeaderboardPage() {
  return (
    <Placeholder
      icon={<Trophy size={28} />}
      title="R&D Learning Cohort"
      description="Maya is currently #8 this week and has moved up three positions."
    />
  )
}

export function ProfilePage() {
  return (
    <Placeholder
      title="Maya Chen"
      description="R&D Scientist · Level 7 · 4,820 lifetime XP · 8 day streak"
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
