import type { ImageRegion } from '@/content/schema/primitives'

interface ImageRegionOverlayProps {
  regions: readonly ImageRegion[]
  visibleRegionIds?: ReadonlySet<string>
  className?: string
}

export function ImageRegionOverlay({
  regions,
  visibleRegionIds,
  className,
}: ImageRegionOverlayProps) {
  const visibleRegions = visibleRegionIds
    ? regions.filter(({ id }) => visibleRegionIds.has(id))
    : regions

  return (
    <svg
      aria-hidden="true"
      className={className ?? 'pointer-events-none absolute inset-0 size-full'}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {visibleRegions.map((region) => {
        const common = {
          className: 'fill-brand-400/25 stroke-brand-700',
          strokeWidth: 0.8,
          vectorEffect: 'non-scaling-stroke' as const,
        }
        switch (region.shape) {
          case 'circle':
            return (
              <circle
                key={region.id}
                {...common}
                cx={region.x * 100}
                cy={region.y * 100}
                r={region.radius * 100}
              />
            )
          case 'rect':
            return (
              <rect
                key={region.id}
                {...common}
                x={region.x * 100}
                y={region.y * 100}
                width={region.width * 100}
                height={region.height * 100}
              />
            )
          case 'polygon':
            return (
              <polygon
                key={region.id}
                {...common}
                points={region.points.map(({ x, y }) => `${x * 100},${y * 100}`).join(' ')}
              />
            )
        }
      })}
    </svg>
  )
}
