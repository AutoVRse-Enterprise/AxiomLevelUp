import { Lightbulb } from 'lucide-react'
import { useState } from 'react'

import { Button, Chip, Sheet } from '@/components/ui'
import type { CaseClue, CaseLabConfig } from '@/content/schema'
import { PrimitiveRenderer } from '@/primitives/registry'

interface ClueBoardProps {
  clues: readonly CaseClue[]
  categoryLabels: ReadonlyMap<string, string>
  openedClueIds: readonly string[]
  selectedClueId: string | null
  labelEssentialClues: boolean
  optionalClueCost: number
  variant: 'mobile' | 'desktop'
  onOpenClue: (clueId: string) => void
  onSelectedClueChange: (clueId: string | null) => void
}

function ClueContent({ clue }: { clue: CaseClue }) {
  const [draft, setDraft] = useState<unknown>(null)

  return (
    <PrimitiveRenderer
      primitive={clue.primitive}
      attempt={0}
      mode="interactive"
      draft={draft}
      onDraftChange={setDraft}
      onComplete={() => undefined}
      onInteract={() => undefined}
      onSubmit={() => undefined}
    />
  )
}

function Board({
  clues,
  categoryLabels,
  openedClueIds,
  selectedClueId,
  labelEssentialClues,
  optionalClueCost,
  onOpenClue,
  onSelectedClueChange,
}: Omit<ClueBoardProps, 'variant'>) {
  const selected = clues.find(({ id }) => id === selectedClueId)
  const grouped = clues.reduce((groups, clue) => {
    const current = groups.get(clue.category) ?? []
    current.push(clue)
    groups.set(clue.category, current)
    return groups
  }, new Map<string, CaseClue[]>())
  const openedVisibleCount = clues.filter(({ id }) => openedClueIds.includes(id)).length

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-heading font-bold text-neutral-950">Clue board</h2>
        <Chip>
          {openedVisibleCount}/{clues.length} opened
        </Chip>
      </div>
      <div className="mt-4 space-y-5">
        {[...grouped].map(([category, categoryClues]) => (
          <section key={category}>
            <h3 className="text-caption font-bold tracking-wide text-neutral-600 uppercase">
              {categoryLabels.get(category) ?? category}
            </h3>
            <ul className="mt-2 space-y-2">
              {categoryClues.map((clue) => {
                const opened = openedClueIds.includes(clue.id)
                return (
                  <li key={clue.id}>
                    <button
                      className="w-full rounded-lg border border-neutral-200 p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-2"
                      type="button"
                      onClick={() => {
                        onOpenClue(clue.id)
                        onSelectedClueChange(clue.id)
                      }}
                    >
                      <span className="block font-semibold text-neutral-900">{clue.title}</span>
                      <span className="mt-1 block text-caption text-neutral-600">
                        {opened
                          ? 'Opened'
                          : clue.essential && labelEssentialClues
                            ? 'Recommended'
                            : clue.essential
                              ? 'Available'
                              : optionalClueCost > 0
                                ? `Optional · −${optionalClueCost} points`
                                : 'Optional'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
      {selected ? (
        <section className="mt-5 border-t border-neutral-200 pt-5">
          <h3 className="mb-4 text-title font-bold text-neutral-950">{selected.title}</h3>
          <ClueContent key={selected.id} clue={selected} />
        </section>
      ) : null}
    </div>
  )
}

export function ClueBoard(props: ClueBoardProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  if (props.variant === 'desktop') {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
        <Board {...props} />
      </div>
    )
  }

  const selected = props.clues.find(({ id }) => id === props.selectedClueId)
  return (
    <div className="mt-3 lg:hidden">
      <Button
        disabled={props.clues.length === 0}
        leadingIcon={<Lightbulb aria-hidden="true" size={18} />}
        variant="secondary"
        onClick={() => {
          props.onSelectedClueChange(props.selectedClueId ?? props.clues[0]?.id ?? null)
          setMobileOpen(true)
        }}
      >
        Clues ({props.clues.filter(({ id }) => props.openedClueIds.includes(id)).length}/
        {props.clues.length})
      </Button>
      <Sheet
        open={mobileOpen}
        title={selected?.title ?? 'Clue board'}
        description={
          selected
            ? (props.categoryLabels.get(selected.category) ?? selected.category)
            : 'Review the available evidence.'
        }
        onOpenChange={(open) => {
          setMobileOpen(open)
        }}
      >
        <Board {...props} />
      </Sheet>
    </div>
  )
}

export type CaseClueCategory = CaseLabConfig['clueCategories'][number]
