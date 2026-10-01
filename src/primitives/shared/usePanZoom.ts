import {
  useCallback,
  useRef,
  useState,
  type PointerEventHandler,
  type WheelEventHandler,
} from 'react'

import {
  clampPanZoom,
  zoomAtPoint,
  type PanZoomTransform,
  type Point,
  type Size,
} from '@/primitives/shared/panZoomMath'

interface UsePanZoomOptions {
  viewport: Size
  content: Size
  minScale?: number
  maxScale?: number
}

export interface PanZoomHandlers {
  onPointerDown: PointerEventHandler<HTMLElement>
  onPointerMove: PointerEventHandler<HTMLElement>
  onPointerUp: PointerEventHandler<HTMLElement>
  onPointerCancel: PointerEventHandler<HTMLElement>
  onWheel: WheelEventHandler<HTMLElement>
}

export function usePanZoom({ viewport, content, minScale = 1, maxScale = 4 }: UsePanZoomOptions) {
  const initial = clampPanZoom(
    { x: 0, y: 0, scale: minScale },
    viewport,
    content,
    minScale,
    maxScale,
  )
  const [transform, setTransform] = useState<PanZoomTransform>(initial)
  const drag = useRef<{ pointerId: number; point: Point } | null>(null)

  const constrain = useCallback(
    (next: PanZoomTransform) => clampPanZoom(next, viewport, content, minScale, maxScale),
    [content, maxScale, minScale, viewport],
  )

  const reset = useCallback(() => {
    setTransform(
      clampPanZoom({ x: 0, y: 0, scale: minScale }, viewport, content, minScale, maxScale),
    )
  }, [content, maxScale, minScale, viewport])

  const panBy = useCallback(
    (x: number, y: number) => {
      setTransform((current) => constrain({ ...current, x: current.x + x, y: current.y + y }))
    },
    [constrain],
  )

  const zoomTo = useCallback(
    (scale: number, point: Point = { x: viewport.width / 2, y: viewport.height / 2 }) => {
      setTransform((current) => constrain(zoomAtPoint(current, scale, point, minScale, maxScale)))
    },
    [constrain, maxScale, minScale, viewport.height, viewport.width],
  )

  const releasePointer: PointerEventHandler<HTMLElement> = useCallback((event) => {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }, [])

  const handlers: PanZoomHandlers = {
    onPointerDown: (event) => {
      if (event.button !== 0) return
      drag.current = {
        pointerId: event.pointerId,
        point: { x: event.clientX, y: event.clientY },
      }
      event.currentTarget.setPointerCapture?.(event.pointerId)
    },
    onPointerMove: (event) => {
      if (drag.current?.pointerId !== event.pointerId) return
      const previous = drag.current.point
      drag.current.point = { x: event.clientX, y: event.clientY }
      panBy(event.clientX - previous.x, event.clientY - previous.y)
    },
    onPointerUp: releasePointer,
    onPointerCancel: releasePointer,
    onWheel: (event) => {
      event.preventDefault()
      const bounds = event.currentTarget.getBoundingClientRect()
      const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
      const factor = event.deltaY < 0 ? 1.2 : 1 / 1.2
      zoomTo(transform.scale * factor, point)
    },
  }

  return {
    transform,
    style: {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
      transformOrigin: '0 0',
    },
    handlers,
    panBy,
    zoomTo,
    reset,
  }
}
