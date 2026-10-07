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
  onExploreDraftChange,
  onInteract,
  onSubmit,
  onRoundStepChange,
}: {
  round: RoundDocument
  plannedRound: PlannedRound
  roundSession: GameRoundSession
  copy: GameCopy
  disabled: boolean
  onDraftChange: (draft: unknown) => void
  onExploreDraftChange: (draft: unknown) => void
  onInteract: (
    primitiveId: string,
    primitiveType: string,
    interaction: PrimitiveInteraction,
  ) => void
  onSubmit: (response: unknown) => void
  onRoundStepChange: (step: 'explore' | 'answer') => void
}) {
  if (!plannedRound.explore) return null
  const answerOpen = (roundSession.roundStep ?? 'explore') === 'answer'
  const replaceScene = round.mechanic === 'spatial_explore'

  return (
    <div
      aria-disabled={disabled}
      className={`relative pb-28 pt-4 ${disabled ? 'pointer-events-none opacity-80' : ''}`}
    >
      {!answerOpen || !replaceScene ? (
        <section className="overflow-hidden rounded-2xl bg-white text-neutral-950 shadow-overlay">
          <PrimitiveRenderer
            attempt={1}
            disabled={disabled}
            draft={roundSession.exploreDraft ?? null}
            mode="interactive"
            onComplete={() => undefined}
            onDraftChange={onExploreDraftChange}
            onInteract={(interaction) =>
              onInteract(plannedRound.explore!.id, plannedRound.explore!.type, interaction)
            }
            onSubmit={() => undefined}
            primitive={plannedRound.explore}
          />
        </section>
      ) : null}

      {!answerOpen ? (
        <StepActionSlot>
          <Button className="w-full sm:w-auto" onClick={() => onRoundStepChange('answer')}>
            {copy.openAnswerDrawer}
          </Button>
        </StepActionSlot>
      ) : (
        <section
          aria-label={copy.answerDrawerTitle}
          className="fixed inset-x-0 bottom-0 z-20 max-h-[72dvh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-28 pt-4 text-neutral-950 shadow-overlay md:static md:mt-4 md:max-h-none md:rounded-2xl md:p-6"
        >
          <div className="mb-3 flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => onRoundStepChange('explore')}>
              {replaceScene ? copy.backToAirway : copy.backToScene}
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
