import { Maximize2, RotateCcw } from 'lucide-react'
import { useRef, useState, type SyntheticEvent } from 'react'

import { Button, InlineNotice, LoadingState } from '@/components/ui'
import type { VideoPrimitive as VideoPrimitiveConfig } from '@/content/schema/primitives'
import { useAssetUrl } from '@/content/useAssetUrl'
import { calculatePlayedCoverage, crossedCoverageSteps } from '@/primitives/mediaProgress'
import { useImmersiveArtifact } from '@/primitives/shared/useImmersiveArtifact'
import type { PrimitiveComponentProps } from '@/primitives/types'
import { cn } from '@/lib/cn'

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
  const [mediaState, setMediaState] = useState<'loading' | 'ready' | 'error'>(
    videoUrl ? 'loading' : 'error',
  )
  const [loadAttempt, setLoadAttempt] = useState(0)
  const { ref: immersiveRef, immersive, toggle: toggleImmersive } =
    useImmersiveArtifact<HTMLElement>()
  const activeCheckpoint = primitive.content.checkpoints?.find(
    ({ id }) => id === activeCheckpointId,
  )

  const handleTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget
    setMediaState('ready')
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
    <figure
      className={cn(
        'space-y-4',
        immersive &&
          'fixed inset-0 z-overlay flex h-dvh flex-col bg-neutral-950 p-4 text-white',
      )}
      data-video-artifact=""
      ref={immersiveRef}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={cn('text-title font-bold text-neutral-950', immersive && 'text-white')}>
            {primitive.content.title}
          </h2>
        {primitive.content.description ? (
          <p className={cn('mt-1 text-small text-neutral-600', immersive && 'text-neutral-300')}>{primitive.content.description}</p>
        ) : null}
        </div>
        <Button
          leadingIcon={<Maximize2 aria-hidden="true" size={16} />}
          onClick={() => void toggleImmersive()}
          size="sm"
          variant="secondary"
        >
          {immersive ? 'Exit' : 'Expand'}
        </Button>
      </div>
      {videoUrl && mediaState !== 'error' ? (
        <div className={cn('relative aspect-video overflow-hidden rounded-xl bg-neutral-950', immersive && 'min-h-0 flex-1')}>
          <video
            ref={videoRef}
            aria-label={primitive.content.title}
            className="size-full"
            controls
            key={loadAttempt}
            onError={() => setMediaState('error')}
            onLoadedData={() => setMediaState('ready')}
            onPlaying={() => setMediaState('ready')}
            onProgress={handleTimeUpdate}
            onTimeUpdate={handleTimeUpdate}
            onWaiting={() => setMediaState('loading')}
            playsInline
            poster={posterUrl}
            preload="metadata"
          >
            <source src={videoUrl} type="video/mp4" />
            <track
              default
              kind="captions"
              label={primitive.content.captionsLabel}
              src={captionsUrl}
              srcLang="en"
            />
            Your browser does not support embedded video.
          </video>
          {mediaState === 'loading' ? (
            <LoadingState
              className="absolute inset-0 rounded-none border-0 bg-neutral-950/90 text-white shadow-none [&_p]:text-neutral-200"
              compact
              message="Preparing playback and captions."
              title="Loading video"
            />
          ) : null}
        </div>
      ) : (
        <InlineNotice
          action={
            videoUrl ? (
              <Button
                leadingIcon={<RotateCcw aria-hidden="true" size={16} />}
                onClick={() => {
                  setLoadAttempt((attempt) => attempt + 1)
                  setMediaState('loading')
                }}
                size="sm"
                variant="secondary"
              >
                Retry video
              </Button>
            ) : null
          }
          message="The lesson can continue, but this video could not be loaded."
          title="Video unavailable"
          tone="warning"
        />
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
