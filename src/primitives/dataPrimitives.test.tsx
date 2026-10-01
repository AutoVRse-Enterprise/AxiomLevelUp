import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  chartPrimitiveSchema,
  dataTablePrimitiveSchema,
  formulaPrimitiveSchema,
} from '@/content/schema/primitives'
import { ChartPrimitive } from '@/primitives/components/ChartPrimitive'
import { DataTablePrimitive } from '@/primitives/components/DataTablePrimitive'
import { FormulaPrimitive } from '@/primitives/components/FormulaPrimitive'
import {
  fourParameterLogistic,
  linearScale,
  linearTicks,
  logScale,
  logTicks,
} from '@/primitives/definitions/chartMath'

const base = {
  conceptIds: [],
  completion: { mode: 'viewed' as const },
  scoring: { weight: 1 },
  feedback: {},
  assets: [],
}

const callbacks = {
  attempt: 0,
  mode: 'interactive' as const,
  draft: null,
  onInteract: vi.fn(),
  onDraftChange: vi.fn(),
  onSubmit: vi.fn(),
  onComplete: vi.fn(),
}

const dataTable = dataTablePrimitiveSchema.parse({
  ...base,
  id: 'results',
  type: 'data_table',
  content: {
    caption: 'Study results',
    columns: [
      { id: 'group', label: 'Group', emphasis: true },
      { id: 'mean', label: 'Mean', unit: 'mg', alignment: 'decimal' },
    ],
    rows: [
      {
        id: 'treatment',
        highlight: { marker: 'Key', label: 'Primary result' },
        cells: [
          { columnId: 'group', value: 'Treatment' },
          {
            columnId: 'mean',
            value: 4.2,
            highlight: { marker: '▲', label: 'Statistically significant' },
          },
        ],
      },
    ],
  },
})

const doseChart = chartPrimitiveSchema.parse({
  ...base,
  id: 'dose',
  type: 'chart',
  content: {
    chartType: 'dose_response',
    title: 'Dose response',
    summary: 'Response increases and reaches a plateau.',
    axes: {
      x: { label: 'Dose', unit: 'µM', scale: 'log' },
      y: { label: 'Response', unit: '%', scale: 'linear' },
    },
    series: [
      {
        id: 'observed',
        label: 'Observed',
        points: [
          { id: 'low', x: 0.1, y: 10 },
          { id: 'high', x: 10, y: 90 },
        ],
      },
      {
        id: 'replicate',
        label: 'Replicate',
        points: [{ id: 'middle', x: 1, y: 52 }],
      },
    ],
    fourParameterLogistic: {
      bottom: 5,
      top: 95,
      ec50: 1,
      hill: 1,
      showEc50Marker: true,
    },
  },
})

describe('data primitive schemas', () => {
  it('requires every data-table row to cover every column exactly once', () => {
    const invalid = structuredClone(dataTable)
    invalid.content.rows[0]?.cells.pop()
    expect(dataTablePrimitiveSchema.safeParse(invalid).success).toBe(false)
  })

  it('requires chart summaries and positive logarithmic values', () => {
    const missingSummary = structuredClone(doseChart) as Record<string, unknown>
    const content = missingSummary.content as Record<string, unknown>
    delete content.summary
    expect(chartPrimitiveSchema.safeParse(missingSummary).success).toBe(false)

    const invalidLogPoint = structuredClone(doseChart)
    if (invalidLogPoint.content.chartType === 'dose_response') {
      const series = invalidLogPoint.content.series[0]
      if (series) series.points[0]!.x = 0
    }
    expect(chartPrimitiveSchema.safeParse(invalidLogPoint).success).toBe(false)
  })

  it('requires labelled formula expressions', () => {
    expect(
      formulaPrimitiveSchema.safeParse({
        ...base,
        id: 'formula',
        type: 'formula',
        content: { expressions: [{ id: 'eq', tex: 'x', display: true }] },
      }).success,
    ).toBe(false)
  })
})

describe('chart math', () => {
  it('maps linear and logarithmic domains', () => {
    expect(linearScale(5, { min: 0, max: 10 }, { min: 0, max: 100 })).toBe(50)
    expect(logScale(10, { min: 1, max: 100 }, { min: 0, max: 100 })).toBe(50)
  })

  it('produces stable linear and logarithmic ticks', () => {
    expect(linearTicks({ min: 0, max: 10 }, 6)).toEqual([0, 2, 4, 6, 8, 10])
    expect(logTicks({ min: 0.1, max: 100 })).toEqual([0.1, 1, 10, 100])
  })

  it('evaluates the four-parameter logistic midpoint', () => {
    expect(fourParameterLogistic(2, { bottom: 10, top: 90, ec50: 2, hill: 1 })).toBe(50)
  })

  it('rejects non-positive logarithmic inputs', () => {
    expect(() => logScale(0, { min: 1, max: 10 }, { min: 0, max: 1 })).toThrow(RangeError)
    expect(() => fourParameterLogistic(0, { bottom: 0, top: 1, ec50: 1, hill: 1 })).toThrow(
      RangeError,
    )
  })
})

describe('data primitive components', () => {
  it('renders semantic table scopes, markers and an expanded overlay', async () => {
    const user = userEvent.setup()
    render(<DataTablePrimitive primitive={dataTable} {...callbacks} />)

    expect(screen.getByRole('columnheader', { name: /Mean/ })).toHaveAttribute('scope', 'col')
    expect(screen.getByRole('rowheader', { name: /Treatment/ })).toHaveAttribute('scope', 'row')
    expect(screen.getByLabelText('Statistically significant')).toHaveTextContent('▲')
    expect(screen.getByRole('region', { name: /horizontal scroll region/ })).toHaveAttribute(
      'tabindex',
      '0',
    )

    await user.click(screen.getByRole('button', { name: 'Expand table' }))
    expect(screen.getByRole('dialog')).toBeVisible()
  })

  it('renders focusable shape-distinguished points, an EC50 marker and data table', async () => {
    const user = userEvent.setup()
    render(<ChartPrimitive primitive={doseChart} {...callbacks} />)

    expect(screen.getByText('EC50 1')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Observed, low.*circle marker/ })).toHaveAttribute(
      'tabindex',
      '0',
    )
    expect(screen.getByRole('img', { name: /Replicate, middle.*square marker/ })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Show data table' }))
    expect(screen.getByRole('table', { name: 'Data represented by the chart' })).toBeVisible()
  })

  it('renders KaTeX chemistry with authored accessible labels and variables', () => {
    const formula = formulaPrimitiveSchema.parse({
      ...base,
      id: 'binding',
      type: 'formula',
      content: {
        title: 'Binding equilibrium',
        expressions: [
          {
            id: 'reaction',
            tex: String.raw`\ce{A + B <=> AB}`,
            display: true,
            ariaLabel: 'A plus B reversibly forms A B',
          },
        ],
        variables: [{ symbol: 'A', definition: 'Ligand', unit: 'mol/L' }],
      },
    })

    const { container } = render(<FormulaPrimitive primitive={formula} {...callbacks} />)
    const renderedFormula = container.querySelector('[role="math"]')
    expect(renderedFormula).toHaveAttribute('aria-label', 'A plus B reversibly forms A B')
    expect(renderedFormula).toHaveTextContent('A')
    expect(screen.getByText('Ligand (mol/L)')).toBeVisible()
  })
})
