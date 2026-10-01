export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface ScreenBounds extends Size {
  left: number
  top: number
}

export interface PanZoomTransform {
  x: number
  y: number
  scale: number
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

function clampAxis(offset: number, viewportLength: number, contentLength: number): number {
  if (contentLength <= viewportLength) return (viewportLength - contentLength) / 2
  return clamp(offset, viewportLength - contentLength, 0)
}

export function clampPanZoom(
  transform: PanZoomTransform,
  viewport: Size,
  content: Size,
  minimumScale = 1,
  maximumScale = 4,
): PanZoomTransform {
  const scale = clamp(transform.scale, minimumScale, maximumScale)

  return {
    scale,
    x: clampAxis(transform.x, viewport.width, content.width * scale),
    y: clampAxis(transform.y, viewport.height, content.height * scale),
  }
}

export function zoomAtPoint(
  transform: PanZoomTransform,
  requestedScale: number,
  point: Point,
  minimumScale = 1,
  maximumScale = 4,
): PanZoomTransform {
  const scale = clamp(requestedScale, minimumScale, maximumScale)
  const ratio = scale / transform.scale

  return {
    scale,
    x: point.x - (point.x - transform.x) * ratio,
    y: point.y - (point.y - transform.y) * ratio,
  }
}

export function screenToNormalized(
  point: Point,
  bounds: ScreenBounds,
  transform: PanZoomTransform = { x: 0, y: 0, scale: 1 },
): Point {
  if (bounds.width <= 0 || bounds.height <= 0 || transform.scale <= 0) {
    return { x: 0, y: 0 }
  }

  return {
    x: clamp((point.x - bounds.left - transform.x) / (bounds.width * transform.scale), 0, 1),
    y: clamp((point.y - bounds.top - transform.y) / (bounds.height * transform.scale), 0, 1),
  }
}

export function normalizedToScreen(
  point: Point,
  bounds: ScreenBounds,
  transform: PanZoomTransform = { x: 0, y: 0, scale: 1 },
): Point {
  return {
    x: bounds.left + transform.x + point.x * bounds.width * transform.scale,
    y: bounds.top + transform.y + point.y * bounds.height * transform.scale,
  }
}
