import type { ImageRegion, NormalizedPoint } from '@/content/schema/primitives'

const epsilon = 1e-10

function pointOnSegment(
  point: NormalizedPoint,
  start: NormalizedPoint,
  end: NormalizedPoint,
): boolean {
  const cross = (point.y - start.y) * (end.x - start.x) - (point.x - start.x) * (end.y - start.y)
  if (Math.abs(cross) > epsilon) return false

  const dot = (point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)
  const squaredLength = (end.x - start.x) ** 2 + (end.y - start.y) ** 2
  return dot >= -epsilon && dot <= squaredLength + epsilon
}

function pointInPolygon(point: NormalizedPoint, vertices: readonly NormalizedPoint[]): boolean {
  let inside = false
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index++) {
    const start = vertices[previous]!
    const end = vertices[index]!
    if (pointOnSegment(point, start, end)) return true

    const crosses =
      start.y > point.y !== end.y > point.y &&
      point.x < ((end.x - start.x) * (point.y - start.y)) / (end.y - start.y) + start.x
    if (crosses) inside = !inside
  }
  return inside
}

export function isPointInImageRegion(point: NormalizedPoint, region: ImageRegion): boolean {
  switch (region.shape) {
    case 'circle':
      return (point.x - region.x) ** 2 + (point.y - region.y) ** 2 <= region.radius ** 2 + epsilon
    case 'rect':
      return (
        point.x >= region.x &&
        point.x <= region.x + region.width &&
        point.y >= region.y &&
        point.y <= region.y + region.height
      )
    case 'polygon':
      return pointInPolygon(point, region.points)
  }
}

export function hitImageRegions(
  point: NormalizedPoint,
  regions: readonly ImageRegion[],
): ImageRegion[] {
  return regions.filter((region) => isPointInImageRegion(point, region))
}

export function isNormalizedPoint(value: unknown): value is NormalizedPoint {
  if (typeof value !== 'object' || value === null) return false
  const point = value as Record<string, unknown>
  return (
    typeof point.x === 'number' &&
    Number.isFinite(point.x) &&
    point.x >= 0 &&
    point.x <= 1 &&
    typeof point.y === 'number' &&
    Number.isFinite(point.y) &&
    point.y >= 0 &&
    point.y <= 1
  )
}
