import {
  Beaker,
  BookOpen,
  Check,
  ClipboardCheck,
  Flag,
  FlaskConical,
  LockKeyhole,
  Target,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Card, Chip, ProgressBar } from '@/components/ui'
import { emitEvent } from '@/events/bus'
import { today } from '@/lib/clock'
import { cn } from '@/lib/cn'
import { useLearnerStore } from '@/state/learnerStore'
import { selectPathwayView } from '@/state/selectors'

const nodeIcons = {
  lesson: BookOpen,
  assessment: ClipboardCheck,
  case: Beaker,
  challenge: Target,
  practice: FlaskConical,
  checkpoint: Flag,
} as const

export function PathwayPage() {
  const { pathwayId } = useParams()
  const { appConfig, catalogCourses, lessonById } = useContent()
  const learner = useLearnerStore((state) => state.learner)
  const xp = useLearnerStore((state) => state.xp)
  const weeklyGoal = useLearnerStore((state) => state.weeklyGoal)
  const lessonProgress = useLearnerStore((state) => state.lessonProgress)
  const challenges = useLearnerStore((state) => state.challenges)
  const badges = useLearnerStore((state) => state.badges)
  const mastery = useLearnerStore((state) => state.mastery)
  const stats = useLearnerStore((state) => state.stats)
  const gamification = useLearnerStore((state) => state.gamification)
  const [openLock, setOpenLock] = useState<string | null>(null)
  const pathway = appConfig.pathways.find(({ id }) => id === pathwayId)

  useEffect(() => {
    if (pathway) emitEvent({ event: 'pathway_opened', pathwayId: pathway.id })
  }, [pathway])

  if (!pathway) {
    return <EmptyState title="Pathway not found" message="This pathway is not configured." />
  }

  const view = selectPathwayView(
    { learner, xp, weeklyGoal, lessonProgress, challenges, badges, mastery, stats, gamification },
    pathway,
    lessonById,
    appConfig.challenges,
    today(),
    appConfig.product.weekStartsOn,
  )
  const completed = view.nodes.filter(({ status }) => status === 'completed').length

  const destinationFor = (node: (typeof view.nodes)[number]) => {
    if (node.type === 'challenge') return '/challenge'
    const course = catalogCourses.find(({ lessons }) => lessons.some(({ id }) => id === node.refId))
    return course ? `/learn/courses/${course.id}/lessons/${node.refId}` : '/learn'
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="text-center">
        <Chip tone="brand">Active pathway</Chip>
        <h1 className="mt-3 text-display font-bold">{pathway.title}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-neutral-600">{pathway.description}</p>
        <ProgressBar
          className="mx-auto mt-6 max-w-lg"
          label="Pathway progress"
          max={view.nodes.length}
          value={completed}
        />
      </header>

      <ol className="relative mt-10 space-y-6" aria-label={`${pathway.title} learning journey`}>
        {view.layers.map((layer, layerIndex) => (
          <li className="relative" key={`layer-${layerIndex}`}>
            {layerIndex > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -top-6 left-1/2 h-6 w-px bg-neutral-300"
              />
            ) : null}
            <div
              aria-label={layer.length > 1 ? 'Optional branch: choose either activity' : undefined}
              className={cn('grid gap-4', layer.length > 1 && 'sm:grid-cols-2')}
              role={layer.length > 1 ? 'group' : undefined}
            >
              {layer.map((node) => {
                const Icon = nodeIcons[node.type]
                const step = view.nodes.findIndex(({ id }) => id === node.id) + 1
                const label = `Step ${step} of ${view.nodes.length}, ${node.status.replace('_', ' ')}, ${node.type}${node.estimatedMinutes ? `, ${node.estimatedMinutes} minutes` : ''}`
                const body = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={cn(
                          'grid size-11 place-items-center rounded-full',
                          node.status === 'completed' && 'bg-success-50 text-success-700',
                          node.status === 'in_progress' && 'bg-brand-700 text-white',
                          node.status === 'available' && 'bg-brand-100 text-brand-800',
                          node.status === 'new' && 'bg-warning-50 text-warning-700',
                          node.status === 'locked' && 'bg-neutral-100 text-neutral-500',
                        )}
                      >
                        {node.status === 'completed' ? (
                          <Check aria-hidden="true" size={21} />
                        ) : node.status === 'locked' ? (
                          <LockKeyhole aria-hidden="true" size={19} />
                        ) : (
                          <Icon aria-hidden="true" size={20} />
                        )}
                      </span>
                      <Chip>{node.optional ? 'Optional' : node.type}</Chip>
                    </div>
                    <h2 className="mt-4 text-heading font-bold">{node.title}</h2>
                    <p className="mt-1 text-small capitalize text-neutral-600">
                      {node.status.replace('_', ' ')}
                      {node.estimatedMinutes ? ` · ${node.estimatedMinutes} min` : ''}
                    </p>
                  </>
                )
                return node.status === 'locked' ? (
                  <div key={node.id}>
                    <button
                      aria-label={`${label}. Show why this activity is locked`}
                      className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-left opacity-85 focus-visible:outline-2"
                      onClick={() => setOpenLock(openLock === node.id ? null : node.id)}
                      type="button"
                    >
                      {body}
                    </button>
                    {openLock === node.id ? (
                      <p
                        className="mt-2 rounded-md bg-neutral-100 p-3 text-small text-neutral-700"
                        role="status"
                      >
                        Complete the preceding activity
                        {node.unmetPrerequisites.length
                          ? ` (${node.unmetPrerequisites.join(', ')})`
                          : ''}{' '}
                        to unlock this step.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    aria-label={label}
                    className="block rounded-lg border border-neutral-200 bg-white p-5 shadow-card transition hover:border-brand-300 focus-visible:outline-2"
                    key={node.id}
                    to={destinationFor(node)}
                  >
                    {body}
                  </Link>
                )
              })}
            </div>
          </li>
        ))}
      </ol>

      {view.currentNode ? (
        <Card className="mt-8 text-center">
          <p className="text-small font-semibold text-brand-700">Current position</p>
          <p className="mt-1 text-heading font-bold">{view.currentNode.title}</p>
        </Card>
      ) : null}
    </div>
  )
}
