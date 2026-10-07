import type { GameConfig, RoundDocument } from '@/content/schema/game'
import type { PlannedRound } from '@/engines/games/plan'
import type { GameRoundSession } from '@/engines/games/session'
import { ClueTray } from '@/player/game/ClueTray'
import { SpatialRoundStage } from '@/player/game/SpatialRoundStage'
import { PrimitiveRenderer } from '@/primitives/registry'
import type { PrimitiveInteraction } from '@/primitives/types'

export function RoundStage({
  round,
  plannedRound,
  roundSession,
  copy,
  onDraftChange,
  onSubmit,
  onClueReveal,
  onConfirmOpenChange,
  onInteract,
  disabled = false,
}: {
  round: RoundDocument
  plannedRound: PlannedRound
  roundSession: GameRoundSession
  copy: NonNullable<GameConfig['copy']>
  onDraftChange: (draft: unknown) => void
  onSubmit: (response: unknown) => void
  onClueReveal: (clueId: string) => void
  onConfirmOpenChange: (open: boolean) => void
  onInteract: (
    primitiveId: string,
    primitiveType: string,
    interaction: PrimitiveInteraction,
  ) => void
  disabled?: boolean
}) {
  if (round.mechanic === 'spatial_look' || round.mechanic === 'spatial_explore') {
    return (
      <SpatialRoundStage
        copy={copy}
        disabled={disabled}
        onDraftChange={onDraftChange}
        onInteract={onInteract}
        onSubmit={onSubmit}
        plannedRound={plannedRound}
        round={round}
        roundSession={roundSession}
      />
    )
  }
  return (
    <div
      aria-disabled={disabled}
      className={`grid gap-6 pb-28 pt-6 md:grid-cols-[minmax(16rem,0.8fr)_minmax(22rem,1.2fr)] md:pb-6 ${disabled ? 'pointer-events-none opacity-80' : ''}`}
    >
      {round.mechanic === 'clinical_call' ? (
        <ClueTray
          copy={copy}
          onConfirmOpenChange={onConfirmOpenChange}
          onInteract={(clueId, interaction) => {
            const clue = round.clues.find(({ id }) => id === clueId)
            if (clue) onInteract(clue.primitive.id, clue.primitive.type, interaction)
          }}
          onReveal={onClueReveal}
          plannedRound={plannedRound}
          revealedClueIds={roundSession.revealedClueIds}
          round={round}
        />
      ) : (
        <div />
      )}
      <section className="rounded-2xl bg-white p-5 text-neutral-950 shadow-overlay sm:p-7">
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
    </div>
  )
}
