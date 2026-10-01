import { useRef, useState, type SyntheticEvent } from 'react'

import { Button } from '@/components/ui'
import type { VideoPrimitive as VideoPrimitiveConfig } from '@/content/schema/primitives'
import { useAssetUrl } from '@/content/useAssetUrl'
import { calculatePlayedCoverage, crossedCoverageSteps } from '@/primitives/mediaProgress'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function VideoPrimitive({
  primitive,
  disabled,
  onInteract,
}: PrimitiveComponentProps<VideoPrimitiveConfig>) {
  const videoUrl = useAssetUrl(primitive.content.assetId)
  const posterUrl = useAssetUrl(primitive.content.posterAssetId)
  const captionsUrl = useAssetUrl(primitive.content.captionsAssetId)
  const videoRef = useRef<HTMLVideoElement>(null)
  const reportedCoverage = useRef(0)
  const completedCheckpoints = useRef(new Set<string>())
  const [activeCheckpointId, setActiveCheckpointId] = useState<string | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const activeCheckpoint = primitive.content.checkpoints?.find(
    ({ id }) => id === activeCheckpointId,
  )

  const handleTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget
    const coverage = calculatePlayedCoverage(video.played, video.duration)
    for (const fraction of crossedCoverageSteps(reportedCoverage.current, coverage)) {
      onInteract({ name: 'media_progress', fraction })
      reportedCoverage.current = fraction
    }

    if (activeCheckpointId) return
    const checkpoint = primitive.content.checkpoints
      ?.filter(({ id }) => !completedCheckpoints.current.has(id))
      .sort((left, right) => left.timeSeconds - right.timeSeconds)
      .find(({ timeSeconds }) => video.currentTime >= timeSeconds)
    if (checkpoint) {
      video.pause()
      setSelectedOptionId(null)
      setActiveCheckpointId(checkpoint.id)
      onInteract({ name: 'checkpoint_paused', key: checkpoint.id })
    }
  }

  return (
    <figure className="space-y-4">
      <div>
        <h2 className="text-title font-bold text-neutral-950">{primitive.content.title}</h2>
        {primitive.content.description ? (
          <p className="mt-1 text-small text-neutral-600">{primitive.content.description}</p>
        ) : null}
      </div>
      {videoUrl ? (
        <video
          ref={videoRef}
          className="aspect-video w-full rounded-xl bg-neutral-950"
          aria-label={primitive.content.title}
          controls
          playsInline
          preload="metadata"
          poster={posterUrl}
          onTimeUpdate={handleTimeUpdate}
          onProgress={handleTimeUpdate}
        >
          <source src={videoUrl} type="video/mp4" />
          <track
            kind="captions"
            src={captionsUrl}
            srcLang="en"
            label={primitive.content.captionsLabel}
            default
          />
          Your browser does not support embedded video.
        </video>
      ) : (
        <div
          className="grid aspect-video place-items-center rounded-xl bg-neutral-100"
          role="status"
        >
          Video unavailable
        </div>
      )}
      {primitive.content.markers?.length ? (
        <nav aria-label="Video markers" className="flex flex-wrap gap-2">
          {primitive.content.markers.map((marker) => (
            <Button
              key={marker.id}
              variant="secondary"
              size="sm"
              disabled={disabled || !videoUrl}
              onClick={() => {
                if (!videoRef.current) return
                videoRef.current.currentTime = marker.timeSeconds
                onInteract({ name: 'marker_seek', key: marker.id })
              }}
            >
              {marker.label}
            </Button>
          ))}
        </nav>
      ) : null}
      {activeCheckpoint ? (
        <aside className="rounded-xl border border-brand-200 bg-brand-50 p-4">
          <fieldset className="space-y-3" disabled={disabled}>
            <legend className="font-semibold text-neutral-950">{activeCheckpoint.prompt}</legend>
            {activeCheckpoint.options.map((option) => (
              <label key={option.id} className="flex items-start gap-2 text-small text-neutral-800">
                <input
                  type="radio"
                  name={`${primitive.id}-${activeCheckpoint.id}`}
                  value={option.id}
                  checked={selectedOptionId === option.id}
                  onChange={() => {
                    setSelectedOptionId(option.id)
                    onInteract({
                      name: 'checkpoint_answered',
                      key: `${activeCheckpoint.id}:${option.id}`,
                    })
                  }}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          {selectedOptionId ? (
            <p className="mt-3 text-small font-semibold text-neutral-800" role="status">
              {selectedOptionId === activeCheckpoint.correctOptionId ? 'Correct. ' : 'Not quite. '}
              {activeCheckpoint.explanation}
            </p>
          ) : null}
          <Button
            className="mt-4"
            size="sm"
            disabled={disabled || !selectedOptionId}
            onClick={() => {
              completedCheckpoints.current.add(activeCheckpoint.id)
              setActiveCheckpointId(null)
              const playback = videoRef.current?.play()
              playback?.catch(() => undefined)
            }}
          >
            Continue video
          </Button>
        </aside>
      ) : null}
    </figure>
  )
}
