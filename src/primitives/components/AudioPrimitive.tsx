import { useEffect, useRef, useState, type SyntheticEvent } from 'react'

import type { AudioPrimitive as AudioPrimitiveConfig } from '@/content/schema/primitives'
import { useAsset, useAssetUrl } from '@/content/useAssetUrl'
import { calculatePlayedCoverage, crossedCoverageSteps } from '@/primitives/mediaProgress'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function AudioPrimitive({
  primitive,
  onInteract,
}: PrimitiveComponentProps<AudioPrimitiveConfig>) {
  const audioUrl = useAssetUrl(primitive.content.assetId)
  const transcriptAsset = useAsset(primitive.content.transcriptAssetId)
  const reportedCoverage = useRef(0)
  const [transcript, setTranscript] = useState(primitive.content.transcript ?? '')

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
      {audioUrl ? (
        // An adjacent, authored transcript is the accessible alternative for audio-only media.
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio
          className="w-full"
          aria-label={primitive.content.title}
          controls
          preload="metadata"
          onTimeUpdate={reportProgress}
          onProgress={reportProgress}
        >
          <source src={audioUrl} type="audio/mp4" />
          Your browser does not support embedded audio.
        </audio>
      ) : (
        <div className="rounded-lg bg-neutral-100 p-4 text-neutral-600" role="status">
          Audio unavailable
        </div>
      )}
      <details
        className="rounded-lg border border-neutral-200 bg-white p-4"
        onToggle={(event) => {
          if (event.currentTarget.open) onInteract({ name: 'transcript_opened', key: 'transcript' })
        }}
      >
        <summary className="cursor-pointer font-semibold text-neutral-900">Transcript</summary>
        <p className="mt-3 whitespace-pre-line text-small text-neutral-700">
          {transcript || 'Transcript unavailable.'}
        </p>
      </details>
    </section>
  )
}
