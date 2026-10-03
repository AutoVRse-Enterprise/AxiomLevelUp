import { Lightbulb, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button, Chip, Sheet } from '@/components/ui'
import type { CaseClue, CaseLabConfig } from '@/content/schema'
import { PrimitiveRenderer } from '@/primitives/registry'

interface ClueBoardProps {
  clues: readonly CaseClue[]
  categoryLabels: ReadonlyMap<string, string>
  openedClueIds: readonly string[]
  selectedClueId: string | null
  presenterOpen: boolean
  labelEssentialClues: boolean
  optionalClueCost: number
  variant: 'mobile' | 'desktop'
  onPresentClue: (clueId: string) => void
  onPresenterOpenChange: (open: boolean) => void
  onBlockingChange?: (blocking: boolean) => void
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
  onPresentClue,
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
                      onClick={() => onPresentClue(clue.id)}
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

function useMobileViewport() {
  const [mobile, setMobile] = useState(() =>
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 767px)').matches
      : window.innerWidth < 768,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(max-width: 767px)')
    const update = () => setMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return mobile
}

export function ClueBoard(props: ClueBoardProps) {
  const mobileViewport = useMobileViewport()
  const { onBlockingChange, variant } = props
  const mobileOpen = variant === 'mobile' && mobileViewport && props.presenterOpen
  const openedCount = props.clues.filter(({ id }) => props.openedClueIds.includes(id)).length

  useEffect(() => {
    if (variant !== 'mobile') return
    onBlockingChange?.(mobileOpen)
    return () => onBlockingChange?.(false)
  }, [mobileOpen, onBlockingChange, variant])

  if (variant === 'desktop') {
    return (
      <>
        {!props.presenterOpen ? (
          <button
            aria-controls="case-clue-rail"
            aria-expanded="false"
            className="fixed top-1/2 right-0 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-lg border border-r-0 border-brand-200 bg-white px-3 py-4 font-semibold text-brand-800 shadow-overlay hover:bg-brand-50 focus-visible:outline-2"
            type="button"
            onClick={() => props.onPresenterOpenChange(true)}
          >
            <Lightbulb aria-hidden="true" size={18} />
            <span className="[writing-mode:vertical-rl]">
              Clues {openedCount}/{props.clues.length}
            </span>
          </button>
        ) : (
          <div
            className="fixed top-[calc(5rem+env(safe-area-inset-top))] right-4 bottom-4 z-40 w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-5 shadow-overlay"
            id="case-clue-rail"
          >
            <div className="mb-3 flex justify-end">
              <Button
                leadingIcon={<X aria-hidden="true" size={17} />}
                size="sm"
                variant="secondary"
                onClick={() => props.onPresenterOpenChange(false)}
              >
                Close clues
              </Button>
            </div>
            <Board {...props} />
          </div>
        )}
      </>
    )
  }

  const selected = props.clues.find(({ id }) => id === props.selectedClueId)
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-nav border-t border-neutral-200 bg-white/95 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-overlay backdrop-blur-lg md:hidden"
      data-case-clue-actions=""
    >
      <Button
        className="w-full"
        disabled={props.clues.length === 0}
        leadingIcon={<Lightbulb aria-hidden="true" size={18} />}
        variant="secondary"
        onClick={() => props.onPresenterOpenChange(true)}
      >
        Clues ({openedCount}/{props.clues.length})
      </Button>
      <Sheet
        open={mobileOpen}
        title={selected?.title ?? 'Clue board'}
        description={
          selected
            ? (props.categoryLabels.get(selected.category) ?? selected.category)
            : 'Review the available evidence.'
        }
        className="pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        onOpenChange={props.onPresenterOpenChange}
      >
        <Board {...props} />
      </Sheet>
    </div>
  )
}

export type CaseClueCategory = CaseLabConfig['clueCategories'][number]
