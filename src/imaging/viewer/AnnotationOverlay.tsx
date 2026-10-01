import type { ImageRegion, NormalizedPoint } from '@/content/schema/primitives'
import type { DicomLine } from '@/imaging/geometry'
import type { DicomViewerController } from '@/imaging/viewer/controller'

interface AnnotationOverlayProps {
  controller: DicomViewerController | null
  marker?: NormalizedPoint
  region?: ImageRegion
  line?: DicomLine
  currentSlice: number
}

export function AnnotationOverlay({
  controller,
  marker,
  region,
  line,
  currentSlice,
}: AnnotationOverlayProps) {
  const point = (value: NormalizedPoint) => controller?.imagePointToCanvas(value) ?? null
  const markerCanvas = marker ? point(marker) : null
  const lineStart = line?.slice === currentSlice ? point(line.start) : null
  const lineEnd = line?.slice === currentSlice ? point(line.end) : null

  let regionShape = null
  if (region?.shape === 'circle') {
    const center = point({ x: region.x, y: region.y })
    const edge = point({ x: region.x + region.radius, y: region.y })
    if (center && edge) {
      regionShape = (
        <circle cx={center.x} cy={center.y} r={Math.hypot(edge.x - center.x, edge.y - center.y)} />
      )
    }
  } else if (region?.shape === 'rect') {
    const start = point({ x: region.x, y: region.y })
    const end = point({ x: region.x + region.width, y: region.y + region.height })
    if (start && end) {
      regionShape = (
        <rect
          x={Math.min(start.x, end.x)}
          y={Math.min(start.y, end.y)}
          width={Math.abs(end.x - start.x)}
          height={Math.abs(end.y - start.y)}
        />
      )
    }
  } else if (region?.shape === 'polygon') {
    const points = region.points.map(point)
    if (points.every(Boolean)) {
      regionShape = <polygon points={points.map((value) => `${value!.x},${value!.y}`).join(' ')} />
    }
  }

  if (!markerCanvas && !regionShape && !(lineStart && lineEnd)) return null

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      <g className="fill-warning-400/20 stroke-warning-400" strokeWidth="3">
        {regionShape}
        {lineStart && lineEnd ? (
          <line x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y} />
        ) : null}
        {markerCanvas ? <circle cx={markerCanvas.x} cy={markerCanvas.y} r="7" /> : null}
      </g>
    </svg>
  )
}
