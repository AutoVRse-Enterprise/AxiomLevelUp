import { useState } from 'react'

import type { GameConfig, RoundDocument } from '@/content/schema/game'
import type { PlannedRound } from '@/engines/games/plan'
import { ClueCard } from '@/player/game/ClueCard'
import { ClueRevealConfirm } from '@/player/game/ClueRevealConfirm'
import type { PrimitiveInteraction } from '@/primitives/types'

type GameCopy = NonNullable<GameConfig['copy']>

export function ClueTray({
  round,
  plannedRound,
  revealedClueIds,
  copy,
  onConfirmOpenChange,
  onReveal,
  onInteract,
}: {
  round: RoundDocument
  plannedRound: PlannedRound
  revealedClueIds: string[]
  copy: GameCopy
  onConfirmOpenChange: (open: boolean) => void
  onReveal: (clueId: string) => void
  onInteract: (clueId: string, interaction: PrimitiveInteraction) => void
}) {
  const [pendingClueId, setPendingClueId] = useState<string | null>(null)
  const pending = round.clues.find(({ id }) => id === pendingClueId)
  const setPending = (clueId: string | null) => {
    setPendingClueId(clueId)
    onConfirmOpenChange(clueId !== null)
  }

  return (
    <>
      <div aria-label={copy.cluesLabel} className="grid gap-3">
        {round.clues.map((clue) => {
          const paid = plannedRound.paidClueIds.includes(clue.id)
          const available = !paid || revealedClueIds.includes(clue.id)
          return (
            <ClueCard
              available={available}
              clue={clue}
              cost={plannedRound.clueCostPoints}
              key={`${clue.id}:${available}`}
              onInteract={(interaction) => onInteract(clue.id, interaction)}
              onReveal={() => setPending(clue.id)}
              paid={paid}
              revealLabel={copy.revealClue}
            />
          )
        })}
      </div>
      <ClueRevealConfirm
        cancelLabel={copy.cancel}
        confirmLabel={copy.revealClue.replace('{cost}', String(plannedRound.clueCostPoints))}
        description={copy.clueConfirmDescription.replace(
          '{cost}',
          String(plannedRound.clueCostPoints),
        )}
        onConfirm={() => {
          if (pending) onReveal(pending.id)
          setPending(null)
        }}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        open={pending !== undefined}
        title={copy.clueConfirmTitle}
      />
    </>
  )
}
