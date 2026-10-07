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
  onTap?: (point: Point, transform: PanZoomTransform) => void
  onPointerPosition?: (point: Point, transform: PanZoomTransform) => void
}

export interface PanZoomHandlers {
  onPointerDown: PointerEventHandler<HTMLElement>
  onPointerMove: PointerEventHandler<HTMLElement>
  onPointerUp: PointerEventHandler<HTMLElement>
  onPointerCancel: PointerEventHandler<HTMLElement>
  onWheel: WheelEventHandler<HTMLElement>
}

export function usePanZoom({
  viewport,
  content,
  minScale = 1,
  maxScale = 4,
  onTap,
  onPointerPosition,
}: UsePanZoomOptions) {
  const viewportWidth = viewport.width
  const viewportHeight = viewport.height
  const contentWidth = content.width
  const contentHeight = content.height
  const initial = clampPanZoom(
    { x: 0, y: 0, scale: minScale },
    viewport,
    content,
    minScale,
    maxScale,
  )
  const [transform, setTransform] = useState<PanZoomTransform>(initial)
  const drag = useRef<{ pointerId: number; point: Point; start: Point; moved: boolean } | null>(
    null,
  )
  const pointers = useRef(new Map<number, Point>())
  const pinch = useRef<{
    pointerIds: [number, number]
    distance: number
    transform: PanZoomTransform
  } | null>(null)

  const constrain = useCallback(
    (next: PanZoomTransform) =>
      clampPanZoom(
        next,
        { width: viewportWidth, height: viewportHeight },
        { width: contentWidth, height: contentHeight },
        minScale,
        maxScale,
      ),
    [contentHeight, contentWidth, maxScale, minScale, viewportHeight, viewportWidth],
  )
  const constrainedTransform = constrain(transform)

  const reset = useCallback(() => {
    setTransform(
      clampPanZoom(
        { x: 0, y: 0, scale: minScale },
        { width: viewportWidth, height: viewportHeight },
        { width: contentWidth, height: contentHeight },
        minScale,
        maxScale,
      ),
    )
  }, [contentHeight, contentWidth, maxScale, minScale, viewportHeight, viewportWidth])

  const panBy = useCallback(
    (x: number, y: number) => {
      setTransform((current) => constrain({ ...current, x: current.x + x, y: current.y + y }))
    },
    [constrain],
  )

  const zoomTo = useCallback(
    (scale: number, point: Point = { x: viewportWidth / 2, y: viewportHeight / 2 }) => {
      setTransform((current) => constrain(zoomAtPoint(current, scale, point, minScale, maxScale)))
    },
    [constrain, maxScale, minScale, viewportHeight, viewportWidth],
  )

  const ensureVisible = useCallback(
    (point: Point, margin = 24) => {
      const screen = {
        x: constrainedTransform.x + point.x * contentWidth * constrainedTransform.scale,
        y: constrainedTransform.y + point.y * contentHeight * constrainedTransform.scale,
      }
      const safeX = Math.min(margin, viewportWidth / 2)
      const safeY = Math.min(margin, viewportHeight / 2)
      const dx =
        screen.x < safeX
          ? safeX - screen.x
          : screen.x > viewportWidth - safeX
            ? viewportWidth - safeX - screen.x
            : 0
      const dy =
        screen.y < safeY
          ? safeY - screen.y
          : screen.y > viewportHeight - safeY
            ? viewportHeight - safeY - screen.y
            : 0
      if (dx || dy) panBy(dx, dy)
    },
    [constrainedTransform, contentHeight, contentWidth, panBy, viewportHeight, viewportWidth],
  )

  const releasePointer: PointerEventHandler<HTMLElement> = useCallback(
    (event) => {
      const releasedDrag = drag.current?.pointerId === event.pointerId ? drag.current : null
      const wasPinching = pinch.current !== null
      if (releasedDrag && !releasedDrag.moved && !wasPinching && pointers.current.size === 1) {
        const bounds = event.currentTarget.getBoundingClientRect()
        onTap?.(
          { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
          constrainedTransform,
        )
      }
      pointers.current.delete(event.pointerId)
      if (releasedDrag) drag.current = null
      pinch.current = null
      const remaining = [...pointers.current.entries()][0]
      if (remaining) {
        drag.current = {
          pointerId: remaining[0],
          point: remaining[1],
          start: remaining[1],
          moved: false,
        }
      }
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    },
    [constrainedTransform, onTap],
  )

  const handlers: PanZoomHandlers = {
    onPointerDown: (event) => {
      if (event.button !== 0) return
      const point = { x: event.clientX, y: event.clientY }
      pointers.current.set(event.pointerId, point)
      drag.current = {
        pointerId: event.pointerId,
        point,
        start: point,
        moved: false,
      }
      const activePointers = [...pointers.current.entries()]
      if (activePointers.length === 2) {
        const [first, second] = activePointers as [[number, Point], [number, Point]]
        pinch.current = {
          pointerIds: [first[0], second[0]],
          distance: Math.hypot(second[1].x - first[1].x, second[1].y - first[1].y),
          transform: constrainedTransform,
        }
        drag.current = null
      }
      event.currentTarget.setPointerCapture?.(event.pointerId)
    },
    onPointerMove: (event) => {
      const bounds = event.currentTarget.getBoundingClientRect()
      onPointerPosition?.(
        { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
        constrainedTransform,
      )
      if (pointers.current.has(event.pointerId)) {
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      }
      if (pinch.current) {
        const [firstId, secondId] = pinch.current.pointerIds
        const first = pointers.current.get(firstId)
        const second = pointers.current.get(secondId)
        if (!first || !second || pinch.current.distance === 0) return
        const distance = Math.hypot(second.x - first.x, second.y - first.y)
        const midpoint = {
          x: (first.x + second.x) / 2 - bounds.left,
          y: (first.y + second.y) / 2 - bounds.top,
        }
        setTransform(
          constrain(
            zoomAtPoint(
              pinch.current.transform,
              pinch.current.transform.scale * (distance / pinch.current.distance),
              midpoint,
              minScale,
              maxScale,
            ),
          ),
        )
        return
      }
      if (drag.current?.pointerId !== event.pointerId) return
      const previous = drag.current.point
      drag.current.point = { x: event.clientX, y: event.clientY }
      if (
        Math.hypot(event.clientX - drag.current.start.x, event.clientY - drag.current.start.y) >= 6
      ) {
        drag.current.moved = true
      }
      panBy(event.clientX - previous.x, event.clientY - previous.y)
    },
    onPointerUp: releasePointer,
    onPointerCancel: releasePointer,
    onWheel: (event) => {
      event.preventDefault()
      const bounds = event.currentTarget.getBoundingClientRect()
      const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
      const factor = event.deltaY < 0 ? 1.2 : 1 / 1.2
      zoomTo(constrainedTransform.scale * factor, point)
    },
  }

  return {
    transform: constrainedTransform,
    style: {
      transform: `translate3d(${constrainedTransform.x}px, ${constrainedTransform.y}px, 0) scale(${constrainedTransform.scale})`,
      transformOrigin: '0 0',
    },
    handlers,
    panBy,
    zoomTo,
    ensureVisible,
    reset,
  }
}
