export interface TimeRangesLike {
  length: number
  start(index: number): number
  end(index: number): number
}

export function calculatePlayedCoverage(ranges: TimeRangesLike, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0

  const played: Array<[number, number]> = []
  for (let index = 0; index < ranges.length; index += 1) {
    const start = Math.max(0, Math.min(duration, ranges.start(index)))
    const end = Math.max(start, Math.min(duration, ranges.end(index)))
    if (end > start) played.push([start, end])
  }
  played.sort(([left], [right]) => left - right)

  let covered = 0
  let rangeStart = 0
  let rangeEnd = 0
  for (const [start, end] of played) {
    if (start > rangeEnd) {
      covered += rangeEnd - rangeStart
      rangeStart = start
      rangeEnd = end
    } else {
      rangeEnd = Math.max(rangeEnd, end)
    }
  }
  covered += rangeEnd - rangeStart

  return Math.min(1, covered / duration)
}

export function crossedCoverageSteps(previous: number, coverage: number, step = 0.05): number[] {
  const safePrevious = Math.min(1, Math.max(0, previous))
  const safeCoverage = Math.min(1, Math.max(safePrevious, coverage))
  const first = Math.floor((safePrevious + Number.EPSILON) / step) + 1
  const last = Math.floor((safeCoverage + Number.EPSILON) / step)

  return Array.from({ length: Math.max(0, last - first + 1) }, (_, offset) =>
    Math.min(1, Number(((first + offset) * step).toFixed(2))),
  )
}
