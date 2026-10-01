import { DatabaseBackup, Plus, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { Button, Card, Chip } from '@/components/ui'
import { emitEvent } from '@/events/bus'
import { useEventLogStore } from '@/events/eventLogStore'
import { useLearnerStore } from '@/state/learnerStore'
import { replaceWithSeed, type SeedProfile } from '@/state/seed'

const tools = [
  { to: '/dev/tokens', title: 'Design tokens', description: 'Palette, type and base components' },
  {
    to: '/dev/primitives',
    title: 'Primitive gallery',
    description: 'Every standard primitive with local-only controls',
  },
  {
    to: '/learn/courses/runtime-showcase/lessons/primitive-showcase',
    title: 'Runtime showcase lesson',
    description: 'Exercise all standard primitives through the real lesson route',
  },
  {
    to: '/dev/dicom-spike',
    title: 'DICOM/PWA spike',
    description: 'Lazy Cornerstone3D feasibility route',
  },
]

export function DevPage() {
  const [message, setMessage] = useState<string | null>(null)
  const xp = useLearnerStore((state) => state.xp)
  const seedProfile = useLearnerStore((state) => state.seedProfile)
  const events = useEventLogStore((state) => state.events)
  const clearEvents = useEventLogStore((state) => state.clear)

  async function applySeed(profile: SeedProfile, clearLog = false) {
    setMessage(`Loading ${profile} seed…`)
    try {
      await replaceWithSeed(profile)
      if (clearLog) clearEvents()
      setMessage(`${profile === 'advanced' ? 'Advanced' : 'Fresh'} seed applied.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Seed update failed.')
    }
  }

  return (
    <div className="space-y-8">
      <Chip tone="warning">URL-only development area</Chip>
      <h1 className="mt-3 text-title font-bold">Runtime tools</h1>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Demo state</h2>
            <p className="mt-1 text-small text-neutral-600">
              Seed: {seedProfile} · {xp.total.toLocaleString()} XP
            </p>
          </div>
          {message ? (
            <span aria-live="polite" className="text-small text-neutral-700">
              {message}
            </span>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            leadingIcon={<RotateCcw aria-hidden="true" size={18} />}
            variant="danger"
            onClick={() => void applySeed('advanced', true)}
          >
            Reset demo
          </Button>
          <Button
            leadingIcon={<DatabaseBackup aria-hidden="true" size={18} />}
            variant="secondary"
            onClick={() => void applySeed('fresh')}
          >
            Seed fresh account
          </Button>
          <Button variant="secondary" onClick={() => void applySeed('advanced')}>
            Seed advanced account
          </Button>
          <Button
            leadingIcon={<Plus aria-hidden="true" size={18} />}
            onClick={() =>
              emitEvent({ event: 'xp_awarded', amount: 10, reason: 'Developer simulation' })
            }
          >
            Add 10 XP
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button disabled variant="ghost">
            Unlock all · Phase 5
          </Button>
          <Button disabled variant="ghost">
            Simulate badge · Phase 5
          </Button>
          <Button disabled variant="ghost">
            Simulate level-up · Phase 5
          </Button>
          <Button disabled variant="ghost">
            Toggle offline · Phase 7
          </Button>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link className="rounded-lg focus-visible:outline-2" key={tool.to} to={tool.to}>
            <Card className="h-full transition-transform hover:-translate-y-0.5">
              <h2 className="font-bold">{tool.title}</h2>
              <p className="mt-2 text-small text-neutral-600">{tool.description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold">Learner event log</h2>
            <p className="mt-1 text-small text-neutral-600">
              {events.length} of 500 retained events
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={clearEvents}>
            Clear
          </Button>
        </div>
        {events.length ? (
          <ol className="mt-5 max-h-80 space-y-2 overflow-y-auto">
            {[...events]
              .reverse()
              .slice(0, 20)
              .map((event) => (
                <li
                  className="grid gap-1 rounded-md bg-neutral-50 p-3 text-small sm:grid-cols-[1fr_auto]"
                  key={event.id}
                >
                  <code className="font-semibold text-brand-800">{event.event}</code>
                  <time className="text-caption text-neutral-600">
                    {new Date(event.occurredAt).toLocaleTimeString()}
                  </time>
                </li>
              ))}
          </ol>
        ) : (
          <p className="mt-5 text-small text-neutral-600">No events recorded.</p>
        )}
      </Card>

      <div className="flex items-center gap-2 text-small text-neutral-600">
        <Sparkles aria-hidden="true" size={16} />
        Phase 5 will add full reward simulation.
      </div>
    </div>
  )
}
