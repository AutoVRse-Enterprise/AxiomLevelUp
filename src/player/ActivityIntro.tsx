import { Clock3, Layers3 } from 'lucide-react'

import { Button, Chip } from '@/components/ui'
import type { ActivityPlan } from '@/engines/learning/plan'

interface ActivityIntroProps {
  plan: ActivityPlan
  conceptNames: string[]
  canResume: boolean
  onStart: () => void
  onRestart: () => void
}

export function ActivityIntro({
  plan,
  conceptNames,
  canResume,
  onStart,
  onRestart,
}: ActivityIntroProps) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10 sm:py-16">
      <p className="text-small font-semibold text-brand-700">
        {plan.activity.kind === 'lesson'
          ? 'Lesson'
          : plan.activity.kind === 'challenge'
            ? 'Challenge'
            : 'Case'}
      </p>
      <h1 className="mt-2 text-display font-bold text-neutral-950">{plan.activity.title}</h1>
      <p className="mt-4 text-body text-neutral-700">{plan.activity.description}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Chip>
          <Clock3 aria-hidden="true" size={15} /> {plan.activity.estimatedMinutes} min
        </Chip>
        <Chip>
          <Layers3 aria-hidden="true" size={15} /> {plan.steps.length} activities
        </Chip>
        {conceptNames.map((concept) => (
          <Chip key={concept}>{concept}</Chip>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" onClick={onStart}>
          {canResume ? 'Resume' : 'Start'}
        </Button>
        {canResume ? (
          <Button size="lg" variant="secondary" onClick={onRestart}>
            Restart
          </Button>
        ) : null}
      </div>
    </section>
  )
}
