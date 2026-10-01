import { z } from 'zod'

import { idSchema, primitiveBaseSchema } from '../primitiveBase'
import type { PrimitiveContentSchema } from './types'

const tableHighlightSchema = z.strictObject({
  marker: z.string().trim().min(1),
  label: z.string().trim().min(1).optional(),
})

const tableColumnSchema = z.strictObject({
  id: idSchema,
  label: z.string().trim().min(1),
  unit: z.string().trim().min(1).optional(),
  alignment: z.enum(['start', 'center', 'end', 'decimal']).default('start'),
  emphasis: z.boolean().default(false),
})

const tableCellSchema = z.strictObject({
  columnId: idSchema,
  value: z.union([z.string(), z.number()]),
  highlight: tableHighlightSchema.optional(),
})

const tableRowSchema = z.strictObject({
  id: idSchema,
  cells: z.array(tableCellSchema).min(1),
  highlight: tableHighlightSchema.optional(),
})

export const dataTablePrimitiveSchema = primitiveBaseSchema.extend({
  type: z.literal('data_table'),
  content: z
    .strictObject({
      caption: z.string().trim().min(1),
      columns: z.array(tableColumnSchema).min(1),
      rows: z.array(tableRowSchema).min(1),
    })
    .superRefine((content, context) => {
      const columnIds = content.columns.map((column) => column.id)
      const knownColumns = new Set(columnIds)
      if (knownColumns.size !== columnIds.length) {
        context.addIssue({
          code: 'custom',
          path: ['columns'],
          message: 'column IDs must be unique',
        })
      }

      const rowIds = content.rows.map((row) => row.id)
      if (new Set(rowIds).size !== rowIds.length) {
        context.addIssue({ code: 'custom', path: ['rows'], message: 'row IDs must be unique' })
      }

      content.rows.forEach((row, rowIndex) => {
        const cellIds = row.cells.map((cell) => cell.columnId)
        if (
          new Set(cellIds).size !== cellIds.length ||
          cellIds.length !== columnIds.length ||
          cellIds.some((id) => !knownColumns.has(id))
        ) {
          context.addIssue({
            code: 'custom',
            path: ['rows', rowIndex, 'cells'],
            message: 'each row must contain exactly one cell for every column',
          })
        }
      })
    }),
})

export type DataTablePrimitive = z.infer<typeof dataTablePrimitiveSchema>

export const dataTableContentSchema = {
  schema: dataTablePrimitiveSchema,
  assetRefs: () => [],
} satisfies PrimitiveContentSchema<DataTablePrimitive>
