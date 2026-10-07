import type { ImageRegion, NormalizedPoint } from '@/content/schema/primitives'
import { ImageRegionOverlay } from '@/primitives/shared/ImageRegionOverlay'
import { regionCenter } from '@/primitives/shared/imageRegionMath'

export function RegionDebugOverlay({
  point,
  regions,
}: {
  point: NormalizedPoint | null
  regions: readonly ImageRegion[]
}) {
  const readout = point
    ? `{ "x": ${point.x.toFixed(4)}, "y": ${point.y.toFixed(4)} }`
    : 'Move pointer'
  return (
    <aside
      aria-label="Region authoring readout"
      className="pointer-events-none absolute inset-0 z-20 border-2 border-dashed border-warning-500"
    >
      <ImageRegionOverlay regions={regions} />
      {regions.map((region) => {
        const center = regionCenter(region)
        return (
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-neutral-950/85 px-1.5 py-0.5 text-[10px] font-semibold text-white"
            key={region.id}
            style={{ left: `${center.x * 100}%`, top: `${center.y * 100}%` }}
          >
            {region.id}
          </span>
        )
      })}
      <div className="pointer-events-auto absolute bottom-2 left-2 flex items-center gap-2 rounded bg-neutral-950/90 px-2 py-1 font-mono text-xs text-white">
        <output>{readout}</output>
        {point ? (
          <button
            className="rounded border border-white/40 px-1.5 py-0.5 font-sans"
            onClick={() => void navigator.clipboard?.writeText(readout)}
            type="button"
          >
            Copy JSON
          </button>
        ) : null}
      </div>
    </aside>
  )
}
