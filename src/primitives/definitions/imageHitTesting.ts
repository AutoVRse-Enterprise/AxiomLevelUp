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

function distanceToSegment(
  point: NormalizedPoint,
  start: NormalizedPoint,
  end: NormalizedPoint,
): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const squaredLength = dx * dx + dy * dy
  if (squaredLength <= epsilon) return Math.hypot(point.x - start.x, point.y - start.y)
  const fraction = Math.min(
    1,
    Math.max(0, ((point.x - start.x) * dx + (point.y - start.y) * dy) / squaredLength),
  )
  return Math.hypot(point.x - (start.x + fraction * dx), point.y - (start.y + fraction * dy))
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

export function distanceToImageRegion(point: NormalizedPoint, region: ImageRegion): number {
  if (isPointInImageRegion(point, region)) return 0
  switch (region.shape) {
    case 'circle':
      return Math.max(0, Math.hypot(point.x - region.x, point.y - region.y) - region.radius)
    case 'rect': {
      const nearestX = Math.min(Math.max(point.x, region.x), region.x + region.width)
      const nearestY = Math.min(Math.max(point.y, region.y), region.y + region.height)
      return Math.hypot(point.x - nearestX, point.y - nearestY)
    }
    case 'polygon':
      return Math.min(
        ...region.points.map((start, index) =>
          distanceToSegment(point, start, region.points[(index + 1) % region.points.length]!),
        ),
      )
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
