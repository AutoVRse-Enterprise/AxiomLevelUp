import { useMemo, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'

import { Button } from '@/components/ui'
import type { OrderingPrimitive as OrderingPrimitiveConfig } from '@/content/schema/primitives'
import { ReviewMark } from '@/primitives/shared/ReviewMark'
import { seededUnsolvedOrder } from '@/primitives/shared/seededShuffle'
import type { EvaluationResult, PrimitiveComponentProps } from '@/primitives/types'

type OrderingItem = OrderingPrimitiveConfig['content']['items'][number]

interface SortableOrderingItemProps {
  item: OrderingItem
  index: number
  count: number
  readOnly: boolean
  status?: NonNullable<EvaluationResult['items']>[string]
  revealAnswer: boolean
  correctPosition: number
  onMove: (from: number, to: number) => void
}

function SortableOrderingItem({
  item,
  index,
  count,
  readOnly,
  status,
  revealAnswer,
  correctPosition,
  onMove,
}: SortableOrderingItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: readOnly,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border bg-white p-3 shadow-sm ${
        isDragging ? 'border-brand-500 opacity-80' : 'border-neutral-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-small font-semibold text-neutral-700">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1 font-medium text-neutral-950">{item.label}</span>
        {status ? <ReviewMark status={status} /> : null}
        <button
          type="button"
          aria-label={`Drag ${item.label}`}
          disabled={readOnly}
          className="inline-flex size-11 touch-none items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" size={20} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          leadingIcon={<ArrowUp aria-hidden="true" size={16} />}
          disabled={readOnly || index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          Move up
        </Button>
        <Button
          size="sm"
          variant="secondary"
          leadingIcon={<ArrowDown aria-hidden="true" size={16} />}
          disabled={readOnly || index === count - 1}
          onClick={() => onMove(index, index + 1)}
        >
          Move down
        </Button>
        {revealAnswer && status !== 'correct' ? (
          <span className="text-small font-medium text-success-700">
            Correct position: {correctPosition}
          </span>
        ) : null}
      </div>
    </li>
  )
}

function initialItems(
  primitive: OrderingPrimitiveConfig,
  attempt: number,
  mode: PrimitiveComponentProps['mode'],
  response: unknown,
): OrderingItem[] {
  const itemById = new Map(primitive.content.items.map((item) => [item.id, item] as const))
  if (
    Array.isArray(response) &&
    response.length === primitive.content.items.length &&
    new Set(response).size === response.length &&
    response.every((id) => typeof id === 'string' && itemById.has(id))
  ) {
    return response.map((id) => itemById.get(id as string)!)
  }

  return mode === 'review'
    ? primitive.content.items
    : seededUnsolvedOrder(primitive.content.items, `${primitive.id}:${attempt}`, (item) => item.id)
}

export function OrderingPrimitive({
  primitive,
  attempt,
  mode,
  review,
  draft,
  disabled,
  onInteract,
  onDraftChange,
  onSubmit,
}: PrimitiveComponentProps<OrderingPrimitiveConfig>) {
  const [items, setItems] = useState(() =>
    initialItems(primitive, attempt, mode, mode === 'review' ? review?.response : draft),
  )
  const [announcement, setAnnouncement] = useState('')
  const readOnly = disabled || mode === 'review'
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const itemIds = useMemo(() => items.map((item) => item.id), [items])
  const correctPositions = useMemo(
    () => new Map(primitive.content.items.map((item, index) => [item.id, index + 1] as const)),
    [primitive.content.items],
  )

  const commitOrder = (next: OrderingItem[], movedItem: OrderingItem) => {
    setItems(next)
    const response = next.map((item) => item.id)
    onDraftChange(response)
    onInteract({ name: 'ordering_item_moved', key: movedItem.id })
    setAnnouncement(`${movedItem.label} moved to position ${next.indexOf(movedItem) + 1}.`)
  }

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return
    const movedItem = items[from]!
    commitOrder(arrayMove(items, from, to), movedItem)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((item) => item.id === active.id)
    const to = items.findIndex((item) => item.id === over.id)
    if (from >= 0 && to >= 0) moveItem(from, to)
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(items.map((item) => item.id))
      }}
    >
      <fieldset disabled={readOnly}>
        <legend className="text-lg font-semibold text-neutral-950">
          {primitive.content.prompt}
        </legend>
        {mode === 'interactive' ? (
          <p className="mt-2 text-small text-neutral-600">
            Drag by a handle, use the keyboard on a handle, or use the move buttons.
          </p>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements: {
              onDragStart({ active }) {
                const item = items.find((candidate) => candidate.id === active.id)
                return item ? `Picked up ${item.label}.` : 'Picked up item.'
              },
              onDragOver({ active, over }) {
                const item = items.find((candidate) => candidate.id === active.id)
                const position = over
                  ? items.findIndex((candidate) => candidate.id === over.id) + 1
                  : 0
                return item && position
                  ? `${item.label} is over position ${position}.`
                  : 'Item is no longer over a position.'
              },
              onDragEnd({ active, over }) {
                const item = items.find((candidate) => candidate.id === active.id)
                const position = over
                  ? items.findIndex((candidate) => candidate.id === over.id) + 1
                  : 0
                return item && position
                  ? `${item.label} was dropped at position ${position}.`
                  : 'Drag cancelled.'
              },
              onDragCancel({ active }) {
                const item = items.find((candidate) => candidate.id === active.id)
                return item ? `Moving ${item.label} was cancelled.` : 'Drag cancelled.'
              },
            },
          }}
        >
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <ol className="mt-5 grid gap-3">
              {items.map((item, index) => (
                <SortableOrderingItem
                  key={item.id}
                  item={item}
                  index={index}
                  count={items.length}
                  readOnly={readOnly}
                  status={mode === 'review' ? review?.evaluation.items?.[item.id] : undefined}
                  revealAnswer={mode === 'review' && Boolean(review?.revealAnswer)}
                  correctPosition={correctPositions.get(item.id)!}
                  onMove={moveItem}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      </fieldset>

      {mode === 'interactive' ? (
        <Button className="mt-6 w-full sm:w-auto" type="submit" disabled={disabled}>
          Check answer
        </Button>
      ) : null}
    </form>
  )
}
