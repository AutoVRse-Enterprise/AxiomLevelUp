import { useState } from 'react'

import { Button } from '@/components/ui'
import type { GameConfig, RoundDocument } from '@/content/schema/game'
import type { PlannedRound } from '@/engines/games/plan'
import type { GameRoundSession } from '@/engines/games/session'
import { StepActionSlot } from '@/player/StepActionSlot'
import { PrimitiveRenderer } from '@/primitives/registry'
import type { PrimitiveInteraction } from '@/primitives/types'

type GameCopy = NonNullable<GameConfig['copy']>

export function SpatialRoundStage({
  round,
  plannedRound,
  roundSession,
  copy,
  disabled,
  onDraftChange,
  onInteract,
  onSubmit,
}: {
  round: RoundDocument
  plannedRound: PlannedRound
  roundSession: GameRoundSession
  copy: GameCopy
  disabled: boolean
  onDraftChange: (draft: unknown) => void
  onInteract: (
    primitiveId: string,
    primitiveType: string,
    interaction: PrimitiveInteraction,
  ) => void
  onSubmit: (response: unknown) => void
}) {
  const [answerOpen, setAnswerOpen] = useState(false)
  const [exploreDraft, setExploreDraft] = useState<unknown>(null)
  if (!plannedRound.explore) return null

  return (
    <div
      aria-disabled={disabled}
      className={`relative pb-28 pt-4 ${disabled ? 'pointer-events-none opacity-80' : ''}`}
    >
      <section className="overflow-hidden rounded-2xl bg-white text-neutral-950 shadow-overlay">
        <PrimitiveRenderer
          attempt={1}
          disabled={disabled}
          draft={exploreDraft}
          mode="interactive"
          onComplete={() => undefined}
          onDraftChange={setExploreDraft}
          onInteract={(interaction) =>
            onInteract(plannedRound.explore!.id, plannedRound.explore!.type, interaction)
          }
          onSubmit={() => undefined}
          primitive={plannedRound.explore}
        />
      </section>

      {!answerOpen ? (
        <StepActionSlot>
          <Button className="w-full sm:w-auto" onClick={() => setAnswerOpen(true)}>
            {copy.openAnswerDrawer}
          </Button>
        </StepActionSlot>
      ) : (
        <section
          aria-label={copy.answerDrawerTitle}
          className="fixed inset-x-0 bottom-0 z-20 max-h-[72dvh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-28 pt-4 text-neutral-950 shadow-overlay md:static md:mt-4 md:max-h-none md:rounded-2xl md:p-6"
        >
          <div className="mb-3 flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => setAnswerOpen(false)}>
              {copy.backToScene}
            </Button>
          </div>
          <PrimitiveRenderer
            attempt={1}
            disabled={disabled}
            draft={roundSession.draft}
            mode="interactive"
            onComplete={() => undefined}
            onDraftChange={onDraftChange}
            onInteract={(interaction) =>
              onInteract(plannedRound.primitive.id, plannedRound.primitive.type, interaction)
            }
            onSubmit={onSubmit}
            primitive={plannedRound.primitive}
          />
        </section>
      )}
      <span className="sr-only">{round.title}</span>
    </div>
  )
}
