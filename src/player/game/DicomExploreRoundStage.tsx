import { useState } from 'react'

import { Button } from '@/components/ui'
import type { GameConfig, RoundDocument } from '@/content/schema/game'
import type { DicomExplorePrimitive } from '@/content/schema/primitives'
import type { PlannedRound } from '@/engines/games/plan'
import type { GameRoundSession } from '@/engines/games/session'
import {
  exploreRequirementKeys,
  parseExploreObservation,
  satisfiedExploreRequirements,
} from '@/imaging/requirements'
import { StepActionScope, StepActionSlot } from '@/player/StepActionSlot'
import { PrimitiveRenderer } from '@/primitives/registry'
import type { PrimitiveInteraction } from '@/primitives/types'

type GameCopy = NonNullable<GameConfig['copy']>

export function DicomExploreRoundStage({
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
  const primitive = plannedRound.primitive as DicomExplorePrimitive
  const [liveDraft, setLiveDraft] = useState(roundSession.draft)
  const expected = exploreRequirementKeys(primitive)
  const observation = parseExploreObservation(liveDraft)
  const satisfied = new Set(
    observation ? satisfiedExploreRequirements(primitive, observation) : [],
  )
  const ready = expected.length > 0 && expected.every((key) => satisfied.has(key))

  return (
    <div
      aria-disabled={disabled}
      className={`relative pb-28 pt-4 ${disabled ? 'pointer-events-none opacity-80' : ''}`}
    >
      <section className="overflow-hidden rounded-2xl bg-clinical-950 text-white shadow-overlay">
        <PrimitiveRenderer
          attempt={1}
          disabled={disabled}
          draft={roundSession.draft}
          mode="interactive"
          onComplete={() => undefined}
          onDraftChange={(draft) => {
            setLiveDraft(draft)
            onDraftChange(draft)
          }}
          onInteract={(interaction) =>
            onInteract(plannedRound.primitive.id, plannedRound.primitive.type, interaction)
          }
          onSubmit={() => undefined}
          primitive={plannedRound.primitive}
        />
      </section>
      <StepActionScope placement="game">
        <StepActionSlot>
          <Button
            className="w-full sm:w-auto"
            disabled={disabled || !ready}
            onClick={() => onSubmit(liveDraft)}
          >
            {copy.lockIn}
          </Button>
        </StepActionSlot>
      </StepActionScope>
      <span className="sr-only">{round.title}</span>
    </div>
  )
}
