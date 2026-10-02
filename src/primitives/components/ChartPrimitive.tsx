import { Table2 } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Data points and overflow regions require keyboard focus. */

import type { ChartPrimitive as ChartPrimitiveConfig } from '@/content/schema/primitives'
import { Button } from '@/components/ui'
import {
  fourParameterLogistic,
  linearScale,
  linearTicks,
  logScale,
  logTicks,
  numericExtent,
  type NumericDomain,
} from '@/primitives/definitions/chartMath'
import type { PrimitiveComponentProps } from '@/primitives/types'

const WIDTH = 720
const HEIGHT = 420
const PLOT = { left: 76, right: 686, top: 24, bottom: 352 }
const colors = ['#0f766e', '#b45309', '#1d4ed8', '#9333ea'] as const
const shapes = ['circle', 'square', 'triangle', 'diamond'] as const

type ChartContent = ChartPrimitiveConfig['content']
type NumericContent = Exclude<ChartContent, { chartType: 'bar' }>

function labelWithUnit(axis: { label: string; unit?: string }) {
  return axis.unit ? `${axis.label} (${axis.unit})` : axis.label
}

function formatValue(value: number) {
  if (Math.abs(value) >= 1000 || (Math.abs(value) > 0 && Math.abs(value) < 0.01)) {
    return value.toExponential(1)
  }
  return Number(value.toPrecision(4)).toString()
}

function scaleValue(
  value: number,
  domain: NumericDomain,
  range: NumericDomain,
  scale: 'linear' | 'log',
) {
  return scale === 'log' ? logScale(value, domain, range) : linearScale(value, domain, range)
}

function axisTicks(domain: NumericDomain, scale: 'linear' | 'log') {
  return scale === 'log' ? logTicks(domain) : linearTicks(domain)
}

function PointShape({
  shape,
  x,
  y,
  color,
  label,
}: {
  shape: (typeof shapes)[number]
  x: number
  y: number
  color: string
  label: string
}) {
  const common = {
    fill: color,
    stroke: '#ffffff',
    strokeWidth: 2,
    tabIndex: 0,
    role: 'img',
    'aria-label': `${label}; ${shape} marker`,
    className: 'outline-none focus:stroke-neutral-950 focus:stroke-[4]',
  }
  if (shape === 'square') return <rect x={x - 5} y={y - 5} width={10} height={10} {...common} />
  if (shape === 'triangle') {
    return <polygon points={`${x},${y - 7} ${x - 7},${y + 6} ${x + 7},${y + 6}`} {...common} />
  }
  if (shape === 'diamond') {
    return (
      <polygon points={`${x},${y - 7} ${x - 7},${y} ${x},${y + 7} ${x + 7},${y}`} {...common} />
    )
  }
  return <circle cx={x} cy={y} r={6} {...common} />
}

function NumericChart({ content }: { content: NumericContent }) {
  const points = content.series.flatMap((series) => series.points)
  const fit = content.chartType === 'dose_response' ? content.fourParameterLogistic : undefined
  const xDomain = numericExtent(points.map((point) => point.x))
  const yDomain = numericExtent([
    ...points.map((point) => point.y),
    ...(fit ? [fit.bottom, fit.top] : []),
  ])
  const xScale = (value: number) =>
    scaleValue(value, xDomain, { min: PLOT.left, max: PLOT.right }, content.axes.x.scale)
  const yScale = (value: number) =>
    scaleValue(value, yDomain, { min: PLOT.bottom, max: PLOT.top }, content.axes.y.scale)
  const xTicks = axisTicks(xDomain, content.axes.x.scale)
  const yTicks = axisTicks(yDomain, content.axes.y.scale)

  const fittedPoints =
    fit && content.chartType === 'dose_response'
      ? Array.from({ length: 81 }, (_, index) => {
          const logMin = Math.log10(xDomain.min)
          const x = 10 ** (logMin + ((Math.log10(xDomain.max) - logMin) * index) / 80)
          return { x, y: fourParameterLogistic(x, fit) }
        })
      : []

  return (
    <>
      {xTicks.map((tick) => {
        const x = xScale(tick)
        return (
          <g key={`x-${tick}`}>
            <line x1={x} x2={x} y1={PLOT.top} y2={PLOT.bottom} stroke="#e5e7eb" />
            <text x={x} y={PLOT.bottom + 22} textAnchor="middle" fontSize="0.75rem" fill="#525252">
              {formatValue(tick)}
            </text>
          </g>
        )
      })}
      {yTicks.map((tick) => {
        const y = yScale(tick)
        return (
          <g key={`y-${tick}`}>
            <line x1={PLOT.left} x2={PLOT.right} y1={y} y2={y} stroke="#e5e7eb" />
            <text x={PLOT.left - 10} y={y + 4} textAnchor="end" fontSize="0.75rem" fill="#525252">
              {formatValue(tick)}
            </text>
          </g>
        )
      })}
      {fittedPoints.length > 0 ? (
        <path
          d={fittedPoints
            .map(
              (point, index) => `${index === 0 ? 'M' : 'L'}${xScale(point.x)},${yScale(point.y)}`,
            )
            .join(' ')}
          fill="none"
          stroke="#111827"
          strokeWidth={3}
          strokeDasharray="7 5"
          aria-label="Four parameter logistic fitted curve"
        />
      ) : null}
      {fit?.showEc50Marker ? (
        <g>
          <line
            x1={xScale(fit.ec50)}
            x2={xScale(fit.ec50)}
            y1={PLOT.top}
            y2={PLOT.bottom}
            stroke="#991b1b"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          <text
            x={xScale(fit.ec50)}
            y={PLOT.top + 14}
            textAnchor="middle"
            fontSize="0.75rem"
            fill="#991b1b"
          >
            EC50 {formatValue(fit.ec50)}
          </text>
        </g>
      ) : null}
      {content.series.map((series, seriesIndex) => {
        const color = colors[seriesIndex % colors.length] ?? colors[0]
        const shape = shapes[seriesIndex % shapes.length] ?? 'circle'
        const sortedPoints = [...series.points].sort((a, b) => a.x - b.x)
        return (
          <g key={series.id}>
            {content.chartType === 'line' ? (
              <path
                d={sortedPoints
                  .map(
                    (point, index) =>
                      `${index === 0 ? 'M' : 'L'}${xScale(point.x)},${yScale(point.y)}`,
                  )
                  .join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={3}
                aria-hidden="true"
              />
            ) : null}
            {series.points.map((point) => (
              <PointShape
                key={point.id}
                shape={shape}
                x={xScale(point.x)}
                y={yScale(point.y)}
                color={color}
                label={`${series.label}, ${point.label ?? point.id}: ${labelWithUnit(content.axes.x)} ${formatValue(point.x)}, ${labelWithUnit(content.axes.y)} ${formatValue(point.y)}`}
              />
            ))}
          </g>
        )
      })}
    </>
  )
}

function BarChart({ content }: { content: Extract<ChartContent, { chartType: 'bar' }> }) {
  const categories = Array.from(
    new Set(content.series.flatMap((series) => series.values.map((value) => value.category))),
  )
  const values = content.series.flatMap((series) => series.values.map((value) => value.value))
  const extent = numericExtent([...values, 0])
  const yDomain = content.axes.y.scale === 'log' ? numericExtent(values) : extent
  const yScale = (value: number) =>
    scaleValue(value, yDomain, { min: PLOT.bottom, max: PLOT.top }, content.axes.y.scale)
  const baseline = content.axes.y.scale === 'log' ? PLOT.bottom : yScale(0)
  const categoryWidth = (PLOT.right - PLOT.left) / categories.length
  const groupWidth = categoryWidth * 0.72
  const barWidth = groupWidth / content.series.length

  return (
    <>
      {axisTicks(yDomain, content.axes.y.scale).map((tick) => {
        const y = yScale(tick)
        return (
          <g key={tick}>
            <line x1={PLOT.left} x2={PLOT.right} y1={y} y2={y} stroke="#e5e7eb" />
            <text x={PLOT.left - 10} y={y + 4} textAnchor="end" fontSize="0.75rem" fill="#525252">
              {formatValue(tick)}
            </text>
          </g>
        )
      })}
      {categories.map((category, categoryIndex) => {
        const center = PLOT.left + categoryWidth * (categoryIndex + 0.5)
        return (
          <text
            key={category}
            x={center}
            y={PLOT.bottom + 22}
            textAnchor="middle"
            fontSize="0.75rem"
            fill="#525252"
          >
            {category}
          </text>
        )
      })}
      {content.series.flatMap((series, seriesIndex) =>
        series.values.map((value) => {
          const categoryIndex = categories.indexOf(value.category)
          const x =
            PLOT.left +
            categoryWidth * categoryIndex +
            (categoryWidth - groupWidth) / 2 +
            seriesIndex * barWidth
          const y = yScale(value.value)
          return (
            <rect
              key={`${series.id}-${value.id}`}
              x={x}
              y={Math.min(y, baseline)}
              width={Math.max(2, barWidth - 3)}
              height={Math.max(1, Math.abs(baseline - y))}
              fill={colors[seriesIndex % colors.length]}
              tabIndex={0}
              role="img"
              aria-label={`${series.label}, ${value.label ?? value.category}: ${formatValue(value.value)}${content.axes.y.unit ? ` ${content.axes.y.unit}` : ''}; rectangular marker`}
              className="outline-none focus:stroke-neutral-950 focus:stroke-[4]"
            />
          )
        }),
      )}
    </>
  )
}

function ChartDataTable({ content }: { content: ChartContent }) {
  return (
    <div
      className="overflow-x-auto rounded-xl border border-neutral-200"
      role="region"
      tabIndex={0}
      aria-label="Chart data horizontal scroll region"
    >
      <table className="w-full min-w-max border-collapse text-small">
        <caption className="sr-only">Data represented by the chart</caption>
        <thead className="bg-neutral-100">
          <tr>
            <th scope="col" className="px-3 py-2 text-left">
              Series
            </th>
            <th scope="col" className="px-3 py-2 text-left">
              {content.axes.x.label}
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              {content.axes.y.label}
            </th>
          </tr>
        </thead>
        <tbody>
          {content.series.flatMap((series) =>
            ('points' in series ? series.points : series.values).map((point) => (
              <tr key={`${series.id}-${point.id}`} className="border-t border-neutral-200">
                <th scope="row" className="px-3 py-2 text-left font-medium">
                  {series.label}
                </th>
                <td className="px-3 py-2">
                  {'x' in point ? formatValue(point.x) : point.category}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatValue('y' in point ? point.y : point.value)}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  )
}

export function ChartPrimitive({
  primitive,
  onComplete,
  onInteract,
}: PrimitiveComponentProps<ChartPrimitiveConfig>) {
  const [showTable, setShowTable] = useState(false)
  const titleId = useId()
  const summaryId = useId()
  const { content } = primitive

  useEffect(onComplete, [onComplete])

  return (
    <figure className="space-y-4">
      {content.title ? (
        <h3 id={titleId} className="font-semibold text-neutral-950">
          {content.title}
        </h3>
      ) : null}
      <p id={summaryId} className="text-small text-neutral-700">
        {content.summary}
      </p>
      <div className="overflow-x-auto">
        <svg
          className="min-w-[40rem]"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-labelledby={`${content.title ? titleId : ''} ${summaryId}`.trim()}
        >
          <line
            x1={PLOT.left}
            x2={PLOT.right}
            y1={PLOT.bottom}
            y2={PLOT.bottom}
            stroke="#404040"
            strokeWidth={2}
          />
          <line
            x1={PLOT.left}
            x2={PLOT.left}
            y1={PLOT.top}
            y2={PLOT.bottom}
            stroke="#404040"
            strokeWidth={2}
          />
          {content.chartType === 'bar' ? (
            <BarChart content={content} />
          ) : (
            <NumericChart content={content} />
          )}
          <text
            x={(PLOT.left + PLOT.right) / 2}
            y={HEIGHT - 18}
            textAnchor="middle"
            fontSize="0.875rem"
            fontWeight="600"
          >
            {labelWithUnit(content.axes.x)}
          </text>
          <text
            x={18}
            y={(PLOT.top + PLOT.bottom) / 2}
            textAnchor="middle"
            fontSize="0.875rem"
            fontWeight="600"
            transform={`rotate(-90 18 ${(PLOT.top + PLOT.bottom) / 2})`}
          >
            {labelWithUnit(content.axes.y)}
          </text>
        </svg>
      </div>
      <Button
        size="sm"
        variant="secondary"
        aria-expanded={showTable}
        leadingIcon={<Table2 className="size-4" aria-hidden="true" />}
        onClick={() => {
          setShowTable((visible) => !visible)
          onInteract({ name: 'chart_data_table_toggled' })
        }}
      >
        {showTable ? 'Hide data table' : 'Show data table'}
      </Button>
      {showTable ? <ChartDataTable content={content} /> : null}
    </figure>
  )
}
