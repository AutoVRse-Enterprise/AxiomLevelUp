import { Lightbulb, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button, Chip, Sheet } from '@/components/ui'
import type { CaseClue, CaseLabConfig } from '@/content/schema'
import { isClueReviewSignal, type CaseClueReviewMethod } from '@/engines/cases/clues'
import { PrimitiveRenderer } from '@/primitives/registry'
import type { PrimitiveInteraction } from '@/primitives/types'

interface ClueBoardProps {
  clues: readonly CaseClue[]
  caseClueCount: number
  availableClueCount: number
  categoryLabels: ReadonlyMap<string, string>
  openedClueIds: readonly string[]
  reviewedClueIds: readonly string[]
  selectedClueId: string | null
  presenterOpen: boolean
  labelEssentialClues: boolean
  optionalClueCost: number
  clueReview: CaseLabConfig['clueReview']
  variant: 'mobile' | 'desktop'
  onPresentClue: (clueId: string) => void
  onReviewClue: (clueId: string, method: CaseClueReviewMethod) => void
  onPresenterOpenChange: (open: boolean) => void
  onBlockingChange?: (blocking: boolean) => void
}

function ClueContent({
  clue,
  active,
  clueReview,
  onReview,
}: {
  clue: CaseClue
  active: boolean
  clueReview: CaseLabConfig['clueReview']
  onReview: (method: CaseClueReviewMethod) => void
}) {
  const [draft, setDraft] = useState<unknown>(null)
  const onReviewRef = useRef(onReview)

  useEffect(() => {
    onReviewRef.current = onReview
  }, [onReview])

  useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(() => {
      if (
        isClueReviewSignal(
          clue.primitive.type,
          { method: 'dwell' },
          clueReview.mediaProgressThreshold,
        )
      ) {
        onReviewRef.current('dwell')
      }
    }, clueReview.minVisibleMs)
    return () => window.clearTimeout(timer)
  }, [active, clue.primitive.type, clueReview.mediaProgressThreshold, clueReview.minVisibleMs])

  const handleComplete = useCallback(() => {
    if (
      active &&
      isClueReviewSignal(
        clue.primitive.type,
        { method: 'completion' },
        clueReview.mediaProgressThreshold,
      )
    ) {
      onReviewRef.current('completion')
    }
  }, [active, clue.primitive.type, clueReview.mediaProgressThreshold])

  const handleInteract = useCallback(
    (interaction: PrimitiveInteraction) => {
      const signal =
        interaction.name === 'media_progress' && 'fraction' in interaction
          ? ({ method: 'media_progress', progress: interaction.fraction } as const)
          : ({ method: 'interaction' } as const)
      if (
        active &&
        isClueReviewSignal(clue.primitive.type, signal, clueReview.mediaProgressThreshold)
      ) {
        onReviewRef.current(signal.method)
      }
    },
    [active, clue.primitive.type, clueReview.mediaProgressThreshold],
  )

  return (
    <PrimitiveRenderer
      primitive={clue.primitive}
      attempt={0}
      mode="interactive"
      draft={draft}
      onDraftChange={setDraft}
      onComplete={handleComplete}
      onInteract={handleInteract}
      onSubmit={handleComplete}
    />
  )
}

function Board({
  clues,
  caseClueCount,
  availableClueCount,
  categoryLabels,
  openedClueIds,
  reviewedClueIds,
  selectedClueId,
  labelEssentialClues,
  optionalClueCost,
  clueReview,
  onPresentClue,
  onReviewClue,
  presenterOpen,
}: Omit<ClueBoardProps, 'variant'>) {
  const selected = clues.find(({ id }) => id === selectedClueId)
  const grouped = clues.reduce((groups, clue) => {
    const current = groups.get(clue.category) ?? []
    current.push(clue)
    groups.set(clue.category, current)
    return groups
  }, new Map<string, CaseClue[]>())
  const reviewedCount = reviewedClueIds.length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-heading font-bold text-neutral-950">Clue board</h2>
        <Chip>
          Case: {reviewedCount}/{caseClueCount} reviewed
        </Chip>
      </div>
      <p className="mt-2 text-small text-neutral-600">Available this stage: {availableClueCount}</p>
      <div className="mt-4 space-y-5">
        {[...grouped].map(([category, categoryClues]) => (
          <section key={category}>
            <h3 className="text-caption font-bold tracking-wide text-neutral-600 uppercase">
              {categoryLabels.get(category) ?? category}
            </h3>
            <ul className="mt-2 space-y-2">
              {categoryClues.map((clue) => {
                const opened = openedClueIds.includes(clue.id)
                const reviewed = reviewedClueIds.includes(clue.id)
                const state = reviewed ? 'Reviewed' : opened ? 'Opened' : 'Unopened'
                const availabilityLabel = clue.essential
                  ? 'Recommended'
                  : optionalClueCost > 0
                    ? `Optional · −${optionalClueCost} points`
                    : 'Optional'
                return (
                  <li key={clue.id}>
                    <button
                      className="w-full rounded-lg border border-neutral-200 p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-2"
                      type="button"
                      aria-current={selectedClueId === clue.id ? 'true' : undefined}
                      onClick={() => onPresentClue(clue.id)}
                    >
                      <span className="block font-semibold text-neutral-900">{clue.title}</span>
                      <span className="mt-1 block text-caption text-neutral-600">
                        {state}
                        {labelEssentialClues ? ` · ${availabilityLabel}` : ''}
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
          <ClueContent
            key={selected.id}
            clue={selected}
            active={presenterOpen && !reviewedClueIds.includes(selected.id)}
            clueReview={clueReview}
            onReview={(method) => onReviewClue(selected.id, method)}
          />
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
  const reviewedCount = props.reviewedClueIds.length
  const status = `Case: ${reviewedCount}/${props.caseClueCount} reviewed`

  useEffect(() => {
    if (variant !== 'mobile') return
    onBlockingChange?.(mobileOpen)
    return () => onBlockingChange?.(false)
  }, [mobileOpen, onBlockingChange, variant])

  if (variant === 'desktop') {
    if (mobileViewport) return null
    return (
      <>
        {!props.presenterOpen ? (
          <button
            aria-controls="case-clue-rail"
            aria-expanded="false"
            aria-label={`Clues. Open clue board. ${status}. Available this stage: ${props.availableClueCount}`}
            className="fixed top-1/2 right-0 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-lg border border-r-0 border-brand-200 bg-white px-3 py-4 font-semibold text-brand-800 shadow-overlay hover:bg-brand-50 focus-visible:outline-2"
            type="button"
            onClick={() => props.onPresenterOpenChange(true)}
          >
            <Lightbulb aria-hidden="true" size={18} />
            <span aria-hidden="true" className="[writing-mode:vertical-rl]">
              {status}
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
        Clues · {status} · Available this stage: {props.availableClueCount}
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
