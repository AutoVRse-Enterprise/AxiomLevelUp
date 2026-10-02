import { Minus, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

import { IconButton } from '@/components/ui'
import { cn } from '@/lib/cn'
import { usePanZoom } from '@/primitives/shared/usePanZoom'

interface PanZoomImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  maxZoom: number
  overlay?: ReactNode
  className?: string
  dark?: boolean
}

function fittedSize(
  viewport: { width: number; height: number },
  aspectRatio: number,
): { width: number; height: number } {
  if (viewport.width / viewport.height > aspectRatio) {
    return { width: viewport.height * aspectRatio, height: viewport.height }
  }
  return { width: viewport.width, height: viewport.width / aspectRatio }
}

export function PanZoomImage({
  src,
  alt,
  width,
  height,
  maxZoom,
  overlay,
  className,
  dark = false,
}: PanZoomImageProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 1, height: 1 })
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null)
  const aspectRatio = width && height ? width / height : (naturalRatio ?? 4 / 3)
  const content = useMemo(() => fittedSize(viewport, aspectRatio), [aspectRatio, viewport])
  const panZoom = usePanZoom({ viewport, content, maxScale: maxZoom })

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const measure = () => {
      const bounds = element.getBoundingClientRect()
      setViewport({
        width: Math.max(1, bounds.width),
        height: Math.max(1, bounds.height),
      })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const panStep = event.shiftKey ? 80 : 24
    switch (event.key) {
      case '+':
      case '=':
        panZoom.zoomTo(panZoom.transform.scale * 1.25)
        break
      case '-':
      case '_':
        panZoom.zoomTo(panZoom.transform.scale / 1.25)
        break
      case 'ArrowLeft':
        panZoom.panBy(panStep, 0)
        break
      case 'ArrowRight':
        panZoom.panBy(-panStep, 0)
        break
      case 'ArrowUp':
        panZoom.panBy(0, panStep)
        break
      case 'ArrowDown':
        panZoom.panBy(0, -panStep)
        break
      case '0':
        panZoom.reset()
        break
      default:
        return
    }
    event.preventDefault()
  }

  return (
    <div
      ref={viewportRef}
      className={cn(
        'relative isolate min-h-64 w-full min-w-0 max-w-full overflow-hidden rounded-xl',
        dark ? 'bg-neutral-950' : 'bg-neutral-100',
        className,
      )}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-grab overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-2px] active:cursor-grabbing"
        aria-label="Interactive image viewer. Use plus and minus to zoom, arrow keys to pan, and zero to reset."
        onKeyDown={handleKeyDown}
        {...panZoom.handlers}
        style={{ touchAction: 'none' }}
      >
        <span
          className="absolute left-0 top-0 select-none"
          style={{
            ...panZoom.style,
            width: content.width,
            height: content.height,
          }}
        >
          <img
            className="pointer-events-none size-full object-fill"
            src={src}
            alt={alt}
            draggable={false}
            onLoad={(event) => {
              if (!width || !height) {
                setNaturalRatio(
                  event.currentTarget.naturalWidth / event.currentTarget.naturalHeight,
                )
              }
            }}
          />
          {overlay}
        </span>
      </button>
      <div
        className={cn(
          'absolute right-3 top-3 flex rounded-lg border p-1 shadow-sm',
          dark ? 'border-white/25 bg-neutral-950/85' : 'border-neutral-300 bg-white/90',
        )}
        role="toolbar"
        aria-label="Image zoom controls"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <IconButton
          className={dark ? 'text-white hover:bg-white/10' : undefined}
          label="Zoom out"
          icon={<Minus aria-hidden="true" />}
          disabled={panZoom.transform.scale <= 1}
          onClick={() => panZoom.zoomTo(panZoom.transform.scale / 1.25)}
        />
        <IconButton
          className={dark ? 'text-white hover:bg-white/10' : undefined}
          label="Zoom in"
          icon={<Plus aria-hidden="true" />}
          disabled={panZoom.transform.scale >= maxZoom}
          onClick={() => panZoom.zoomTo(panZoom.transform.scale * 1.25)}
        />
        <IconButton
          className={dark ? 'text-white hover:bg-white/10' : undefined}
          label="Reset image view"
          icon={<RotateCcw aria-hidden="true" />}
          onClick={panZoom.reset}
        />
      </div>
      <output className="sr-only" aria-live="polite">
        Zoom {Math.round(panZoom.transform.scale * 100)}%
      </output>
    </div>
  )
}
