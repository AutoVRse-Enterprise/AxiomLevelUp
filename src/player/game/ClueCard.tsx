import { ChevronDown, Lightbulb } from 'lucide-react'
import { useState } from 'react'

import type { GameClue } from '@/content/schema/game'
import { PrimitiveRenderer } from '@/primitives/registry'
import type { PrimitiveInteraction } from '@/primitives/types'

export function ClueCard({
  clue,
  available,
  paid,
  cost,
  revealLabel,
  onReveal,
  onInteract,
}: {
  clue: GameClue
  available: boolean
  paid: boolean
  cost: number
  revealLabel: string
  onReveal: () => void
  onInteract: (interaction: PrimitiveInteraction) => void
}) {
  const [open, setOpen] = useState(!paid)
  if (!available) {
    return (
      <button
        className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 p-4 text-left text-white"
        onClick={onReveal}
        type="button"
      >
        <span className="font-semibold">{clue.title}</span>
        <span className="text-sm text-brand-200">
          {revealLabel.replace('{cost}', String(cost))}
        </span>
      </button>
    )
  }
  return (
    <section className="rounded-xl border border-white/15 bg-white/5 text-white">
      <button
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Lightbulb aria-hidden="true" className="size-4 text-brand-300" />
        <span className="flex-1 font-semibold">{clue.title}</span>
        <ChevronDown aria-hidden="true" className={`size-4 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="border-t border-white/10 bg-white p-4 text-neutral-950">
          <PrimitiveRenderer
            attempt={1}
            draft={null}
            mode="interactive"
            onComplete={() => undefined}
            onDraftChange={() => undefined}
            onInteract={onInteract}
            onSubmit={() => undefined}
            primitive={clue.primitive}
          />
        </div>
      ) : null}
    </section>
  )
}
