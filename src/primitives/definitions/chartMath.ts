export interface NumericDomain {
  min: number
  max: number
}

export function numericExtent(values: readonly number[]): NumericDomain {
  if (values.length === 0) return { min: 0, max: 1 }
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) {
    const padding = Math.abs(min) * 0.1 || 1
    return { min: min - padding, max: max + padding }
  }
  return { min, max }
}

export function linearScale(value: number, domain: NumericDomain, range: NumericDomain): number {
  if (domain.max === domain.min) return (range.min + range.max) / 2
  const ratio = (value - domain.min) / (domain.max - domain.min)
  return range.min + ratio * (range.max - range.min)
}

export function logScale(value: number, domain: NumericDomain, range: NumericDomain): number {
  if (value <= 0 || domain.min <= 0 || domain.max <= 0) {
    throw new RangeError('log scales require positive values and domains')
  }
  return linearScale(
    Math.log10(value),
    { min: Math.log10(domain.min), max: Math.log10(domain.max) },
    range,
  )
}

export function linearTicks(domain: NumericDomain, count = 5): number[] {
  if (count < 2) return [domain.min]
  const rawStep = (domain.max - domain.min) / (count - 1)
  if (rawStep === 0) return [domain.min]
  const magnitude = 10 ** Math.floor(Math.log10(Math.abs(rawStep)))
  const normalized = Math.abs(rawStep) / magnitude
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const step = niceNormalized * magnitude
  const first = Math.ceil(domain.min / step) * step
  const last = Math.floor(domain.max / step) * step
  const ticks: number[] = []
  for (let value = first; value <= last + step / 2; value += step) {
    ticks.push(Number(value.toPrecision(12)))
  }
  return ticks.length > 0 ? ticks : [domain.min, domain.max]
}

export function logTicks(domain: NumericDomain): number[] {
  if (domain.min <= 0 || domain.max <= 0) {
    throw new RangeError('log ticks require a positive domain')
  }
  const firstPower = Math.ceil(Math.log10(domain.min))
  const lastPower = Math.floor(Math.log10(domain.max))
  const ticks: number[] = []
  for (let power = firstPower; power <= lastPower; power += 1) {
    ticks.push(10 ** power)
  }
  return ticks.length > 0 ? ticks : [domain.min, domain.max]
}

export function fourParameterLogistic(
  x: number,
  parameters: { bottom: number; top: number; ec50: number; hill: number },
): number {
  if (x <= 0 || parameters.ec50 <= 0) {
    throw new RangeError('4PL x and ec50 must be positive')
  }
  return (
    parameters.bottom +
    (parameters.top - parameters.bottom) / (1 + (parameters.ec50 / x) ** parameters.hill)
  )
}
