import type { ImageRegion, NormalizedPoint } from '@/content/schema/primitives'

export interface DicomSeriesGeometry {
  rows: number
  columns: number
  pixelSpacingMm: readonly [number, number]
  sliceThicknessMm: number
}

export interface DicomSliceRange {
  from: number
  to: number
}

export interface DicomLine {
  slice: number
  start: NormalizedPoint
  end: NormalizedPoint
}

export function isSliceInRange(slice: number, range: DicomSliceRange): boolean {
  return Number.isInteger(slice) && slice >= range.from && slice <= range.to
}

export function normalizedLineLengthMm(
  line: Pick<DicomLine, 'start' | 'end'>,
  geometry: DicomSeriesGeometry,
): number {
  const horizontal = (line.end.x - line.start.x) * geometry.columns * geometry.pixelSpacingMm[1]
  const vertical = (line.end.y - line.start.y) * geometry.rows * geometry.pixelSpacingMm[0]
  return Math.hypot(horizontal, vertical)
}

export function pointInRegion(point: NormalizedPoint, region: ImageRegion): boolean {
  if (region.shape === 'circle') {
    return Math.hypot(point.x - region.x, point.y - region.y) <= region.radius
  }
  if (region.shape === 'rect') {
    return (
      point.x >= region.x &&
      point.x <= region.x + region.width &&
      point.y >= region.y &&
      point.y <= region.y + region.height
    )
  }

  let inside = false
  for (
    let current = 0, previous = region.points.length - 1;
    current < region.points.length;
    previous = current++
  ) {
    const a = region.points[current]
    const b = region.points[previous]
    if (!a || !b) continue
    const crosses =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    if (crosses) inside = !inside
  }
  return inside
}
