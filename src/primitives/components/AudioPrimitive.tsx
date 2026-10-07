import { useEffect, useRef, useState, type SyntheticEvent } from 'react'

import { RotateCcw } from 'lucide-react'

import { Button, InlineNotice, LoadingState } from '@/components/ui'
import type { AudioPrimitive as AudioPrimitiveConfig } from '@/content/schema/primitives'
import { useAsset, useAssetUrl } from '@/content/useAssetUrl'
import { calculatePlayedCoverage, crossedCoverageSteps } from '@/primitives/mediaProgress'
import { usePresentation } from '@/primitives/presentation/PresentationContext'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function AudioPrimitive({
  primitive,
  onInteract,
}: PrimitiveComponentProps<AudioPrimitiveConfig>) {
  const { labels } = usePresentation()
  const audioUrl = useAssetUrl(primitive.content.assetId)
  const transcriptAsset = useAsset(primitive.content.transcriptAssetId)
  const reportedCoverage = useRef(0)
  const [transcript, setTranscript] = useState(primitive.content.transcript ?? '')
  const [mediaState, setMediaState] = useState<'loading' | 'ready' | 'error'>(
    audioUrl ? 'loading' : 'error',
  )
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    if (!transcriptAsset) return
    const controller = new AbortController()
    void fetch(transcriptAsset.path, { signal: controller.signal })
      .then((response) =>
        response.ok ? response.text() : Promise.reject(new Error('Unavailable')),
      )
      .then(setTranscript)
      .catch(() => undefined)
    return () => controller.abort()
  }, [transcriptAsset])

  const reportProgress = (event: SyntheticEvent<HTMLAudioElement>) => {
    const audio = event.currentTarget
    const coverage = calculatePlayedCoverage(audio.played, audio.duration)
    for (const fraction of crossedCoverageSteps(reportedCoverage.current, coverage)) {
      onInteract({ name: 'media_progress', fraction })
      reportedCoverage.current = fraction
    }
  }

  return (
    <section className="space-y-4" aria-labelledby={`${primitive.id}-title`}>
      <div>
        <h2 id={`${primitive.id}-title`} className="text-title font-bold text-neutral-950">
          {primitive.content.title}
        </h2>
        {primitive.content.description ? (
          <p className="mt-1 text-small text-neutral-600">{primitive.content.description}</p>
        ) : null}
      </div>
      {audioUrl && mediaState !== 'error' ? (
        <div className="space-y-3">
          {mediaState === 'loading' ? (
            <LoadingState
              compact
              title={labels.loadingAudio}
              message="Preparing audio and transcript."
            />
          ) : null}
          {/* An adjacent, authored transcript is the accessible alternative for audio-only media. */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio
            aria-label={primitive.content.title}
            className="w-full"
            controls
            key={loadAttempt}
            onCanPlay={() => setMediaState('ready')}
            onError={() => setMediaState('error')}
            onProgress={reportProgress}
            onTimeUpdate={reportProgress}
            preload="metadata"
          >
            <source src={audioUrl} type="audio/mp4" />
            Your browser does not support embedded audio.
          </audio>
        </div>
      ) : (
        <InlineNotice
          action={
            audioUrl ? (
              <Button
                leadingIcon={<RotateCcw aria-hidden="true" size={16} />}
                onClick={() => {
                  setLoadAttempt((attempt) => attempt + 1)
                  setMediaState('loading')
                }}
                size="sm"
                variant="secondary"
              >
                {labels.retryAudio}
              </Button>
            ) : null
          }
          message="Use the transcript below while the audio is unavailable."
          title={labels.audioUnavailable}
          tone="warning"
        />
      )}
      <details
        className="rounded-lg border border-neutral-200 bg-white p-4"
        onToggle={(event) => {
          if (event.currentTarget.open) onInteract({ name: 'transcript_opened', key: 'transcript' })
        }}
      >
        <summary className="cursor-pointer font-semibold text-neutral-900">
          {labels.transcript}
        </summary>
        <p className="mt-3 whitespace-pre-line text-small text-neutral-700">
          {transcript || 'Transcript unavailable.'}
        </p>
      </details>
    </section>
  )
}
