import { Maximize2 } from 'lucide-react'
import { useEffect, useState } from 'react'

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Overflow regions must be keyboard-focusable. */

import type { DataTablePrimitive as DataTablePrimitiveConfig } from '@/content/schema/primitives'
import { Button } from '@/components/ui'
import { ArtifactOverlay } from '@/primitives/shared/ArtifactOverlay'
import { usePresentation } from '@/primitives/presentation/PresentationContext'
import type { PrimitiveComponentProps } from '@/primitives/types'

type TableContent = DataTablePrimitiveConfig['content']

function alignmentClass(alignment: TableContent['columns'][number]['alignment']) {
  if (alignment === 'center') return 'text-center'
  if (alignment === 'end' || alignment === 'decimal') return 'text-right tabular-nums'
  return 'text-left'
}

function HighlightMarker({ highlight }: { highlight?: { marker: string; label?: string } }) {
  if (!highlight) return null
  return (
    <span
      className="ml-2 inline-flex rounded bg-amber-100 px-1.5 py-0.5 text-caption font-bold text-amber-950"
      aria-label={highlight.label ?? `Highlighted: ${highlight.marker}`}
    >
      {highlight.marker}
    </span>
  )
}

function TableView({ content, expanded = false }: { content: TableContent; expanded?: boolean }) {
  return (
    <div
      className={
        expanded
          ? 'h-full overflow-auto bg-white p-4 text-neutral-950 sm:p-6'
          : 'overflow-x-auto rounded-xl border border-neutral-200 bg-white'
      }
      role="region"
      tabIndex={0}
      aria-label={`${content.caption} horizontal scroll region`}
    >
      <table className="w-full min-w-max border-collapse text-small">
        <caption className="sr-only">{content.caption}</caption>
        <thead>
          <tr className="border-b-2 border-neutral-300 bg-neutral-100">
            {content.columns.map((column, columnIndex) => (
              <th
                key={column.id}
                scope="col"
                className={[
                  'px-4 py-3 font-semibold text-neutral-950',
                  alignmentClass(column.alignment),
                  column.emphasis ? 'bg-brand-50 text-brand-900' : '',
                  columnIndex === 0
                    ? 'sticky left-0 z-20 border-r border-neutral-300 bg-neutral-100'
                    : '',
                ].join(' ')}
              >
                {column.label}
                {column.unit ? (
                  <span className="ml-1 font-normal text-neutral-600">({column.unit})</span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {content.rows.map((row) => {
            const cells = new Map(row.cells.map((cell) => [cell.columnId, cell]))
            return (
              <tr
                key={row.id}
                className={
                  row.highlight
                    ? 'border-b border-neutral-200 bg-amber-50'
                    : 'border-b border-neutral-200'
                }
              >
                {content.columns.map((column, columnIndex) => {
                  const cell = cells.get(column.id)
                  const Cell = columnIndex === 0 ? 'th' : 'td'
                  return (
                    <Cell
                      key={column.id}
                      {...(columnIndex === 0 ? { scope: 'row' as const } : {})}
                      className={[
                        'px-4 py-3',
                        alignmentClass(column.alignment),
                        column.emphasis ? 'bg-brand-50/70 font-semibold' : '',
                        cell?.highlight ? 'bg-amber-100 font-semibold' : '',
                        columnIndex === 0
                          ? 'sticky left-0 z-10 border-r border-neutral-200 bg-white font-medium'
                          : '',
                      ].join(' ')}
                    >
                      {String(cell?.value ?? '')}
                      <HighlightMarker highlight={cell?.highlight} />
                      {columnIndex === 0 ? <HighlightMarker highlight={row.highlight} /> : null}
                    </Cell>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function DataTablePrimitive({
  primitive,
  onComplete,
}: PrimitiveComponentProps<DataTablePrimitiveConfig>) {
  const { labels } = usePresentation()
  const [expanded, setExpanded] = useState(false)

  useEffect(onComplete, [onComplete])

  return (
    <figure className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <figcaption className="font-semibold text-neutral-950">
          {primitive.content.caption}
        </figcaption>
        <Button
          size="sm"
          variant="secondary"
          leadingIcon={<Maximize2 className="size-4" aria-hidden="true" />}
          onClick={() => setExpanded(true)}
        >
          {labels.expandTable}
        </Button>
      </div>
      <TableView content={primitive.content} />
      <ArtifactOverlay
        open={expanded}
        onOpenChange={setExpanded}
        title={primitive.content.caption}
        description={labels.expandedDataTable}
      >
        <TableView content={primitive.content} expanded />
      </ArtifactOverlay>
    </figure>
  )
}
