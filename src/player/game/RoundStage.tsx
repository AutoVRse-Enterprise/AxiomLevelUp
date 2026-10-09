import type { GameConfig, RoundDocument } from '@/content/schema/game'
import type { PlannedRound } from '@/engines/games/plan'
import type { GameRoundSession } from '@/engines/games/session'
import { ClueTray } from '@/player/game/ClueTray'
import { DicomExploreRoundStage } from '@/player/game/DicomExploreRoundStage'
import { SpatialRoundStage } from '@/player/game/SpatialRoundStage'
import { StepActionScope } from '@/player/StepActionSlot'
import { PrimitiveRenderer } from '@/primitives/registry'
import type { PrimitiveInteraction } from '@/primitives/types'

export function RoundStage({
  round,
  plannedRound,
  roundSession,
  copy,
  onDraftChange,
  onExploreDraftChange,
  onRoundStepChange,
  onFailureChange,
  onSkip,
  allowSkip,
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
  onExploreDraftChange: (draft: unknown) => void
  onRoundStepChange: (step: 'explore' | 'answer') => void
  onFailureChange: (failed: boolean) => void
  onSkip: () => void
  allowSkip: boolean
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
        allowSkip={allowSkip}
        onDraftChange={onDraftChange}
        onExploreDraftChange={onExploreDraftChange}
        onInteract={onInteract}
        onFailureChange={onFailureChange}
        onSkip={onSkip}
        onSubmit={onSubmit}
        onRoundStepChange={onRoundStepChange}
        plannedRound={plannedRound}
        round={round}
        roundSession={roundSession}
      />
    )
  }
  if (round.mechanic === 'dicom_explore') {
    return (
      <DicomExploreRoundStage
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
  const clinical = round.mechanic === 'clinical_call'
  return (
    <div
      aria-disabled={disabled}
      className={`${clinical ? 'grid gap-6 md:grid-cols-[minmax(16rem,0.8fr)_minmax(22rem,1.2fr)]' : 'mx-auto max-w-4xl'} pb-28 pt-6 md:pb-6 ${disabled ? 'pointer-events-none opacity-80' : ''}`}
    >
      {clinical ? (
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
      ) : null}
      <StepActionScope placement={clinical ? 'inline' : 'game'}>
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
      </StepActionScope>
    </div>
  )
}
