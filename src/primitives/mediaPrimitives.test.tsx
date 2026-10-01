import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  audioPrimitiveSchema,
  carouselPrimitiveSchema,
  pdfReferencePrimitiveSchema,
  primitiveContentSchemas,
  richTextPrimitiveSchema,
  videoPrimitiveSchema,
} from '@/content/schema/primitives'
import { AudioPrimitive } from '@/primitives/components/AudioPrimitive'
import { CarouselPrimitive } from '@/primitives/components/CarouselPrimitive'
import { PdfReferencePrimitive } from '@/primitives/components/PdfReferencePrimitive'
import { RichTextPrimitive } from '@/primitives/components/RichTextPrimitive'
import { VideoPrimitive } from '@/primitives/components/VideoPrimitive'
import { calculatePlayedCoverage, crossedCoverageSteps } from '@/primitives/mediaProgress'
import { tokenizeRichText } from '@/primitives/richTextTokenizer'

vi.mock('@/content/useAssetUrl', () => ({
  useAssetUrl: (assetId?: string) => (assetId ? `/assets/${assetId}` : undefined),
  useAsset: (assetId?: string) =>
    assetId
      ? {
          assetId,
          path: `/assets/${assetId}`,
          type: 'text',
          offlineRequired: true,
        }
      : undefined,
}))

const base = {
  conceptIds: [],
  scoring: { weight: 1 },
  feedback: {},
  assets: [],
}

const callbacks = () => ({
  onInteract: vi.fn(),
  onDraftChange: vi.fn(),
  onSubmit: vi.fn(),
  onComplete: vi.fn(),
})

const video = videoPrimitiveSchema.parse({
  ...base,
  id: 'media-video',
  type: 'video',
  completion: { mode: 'media_progress', threshold: 0.9 },
  content: {
    assetId: 'video-file',
    posterAssetId: 'poster-file',
    captionsAssetId: 'captions-file',
    title: 'Synthetic video',
    markers: [{ id: 'middle', label: 'Middle', timeSeconds: 12 }],
    checkpoints: [
      {
        id: 'checkpoint',
        timeSeconds: 10,
        prompt: 'Which fixture is this?',
        options: [
          { id: 'synthetic', label: 'Synthetic' },
          { id: 'clinical', label: 'Clinical' },
        ],
        correctOptionId: 'synthetic',
        explanation: 'It was generated locally.',
      },
    ],
  },
})

const audio = audioPrimitiveSchema.parse({
  ...base,
  id: 'media-audio',
  type: 'audio',
  completion: { mode: 'media_progress' },
  content: {
    assetId: 'audio-file',
    transcriptAssetId: 'transcript-file',
    title: 'Synthetic audio',
  },
})

const carousel = carouselPrimitiveSchema.parse({
  ...base,
  id: 'media-carousel',
  type: 'carousel',
  completion: { mode: 'explored' },
  content: {
    title: 'Process',
    slides: [
      { id: 'prepare', title: 'Prepare', body: 'Prepare the sample.' },
      {
        id: 'inspect',
        title: 'Inspect',
        body: 'Inspect the sample.',
        imageAssetId: 'image-file',
        imageAlt: 'Synthetic sample',
      },
    ],
  },
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('media and reference schemas', () => {
  it('strictly validates internal references and carousel bounds', () => {
    expect(
      videoPrimitiveSchema.safeParse({
        ...video,
        content: {
          ...video.content,
          checkpoints: [
            {
              ...video.content.checkpoints![0],
              correctOptionId: 'missing',
            },
          ],
        },
      }).success,
    ).toBe(false)
    expect(
      carouselPrimitiveSchema.safeParse({
        ...carousel,
        content: { ...carousel.content, slides: [carousel.content.slides[0]] },
      }).success,
    ).toBe(false)
    expect(
      carouselPrimitiveSchema.safeParse({
        ...carousel,
        content: {
          ...carousel.content,
          slides: [
            carousel.content.slides[0],
            { ...carousel.content.slides[0], title: 'Duplicate' },
          ],
        },
      }).success,
    ).toBe(false)
    expect(
      videoPrimitiveSchema.safeParse({
        ...video,
        completion: { mode: 'viewed' },
      }).success,
    ).toBe(false)
    expect(
      carouselPrimitiveSchema.safeParse({
        ...carousel,
        completion: { mode: 'explored', count: 1 },
      }).success,
    ).toBe(false)
  })

  it('reports semantic asset types for media and references', () => {
    expect(primitiveContentSchemas.video.assetRefs(video)).toEqual([
      { assetId: 'video-file', type: 'video', path: 'content.assetId' },
      { assetId: 'poster-file', type: 'image', path: 'content.posterAssetId' },
      { assetId: 'captions-file', type: 'text', path: 'content.captionsAssetId' },
    ])
    expect(primitiveContentSchemas.audio.assetRefs(audio)).toEqual([
      { assetId: 'audio-file', type: 'audio', path: 'content.assetId' },
      { assetId: 'transcript-file', type: 'text', path: 'content.transcriptAssetId' },
    ])
    const reference = pdfReferencePrimitiveSchema.parse({
      ...base,
      id: 'reference',
      type: 'pdf_reference',
      completion: { mode: 'viewed' },
      content: {
        assetId: 'document-file',
        coverAssetId: 'cover-file',
        citation: 'Axiom synthetic reference.',
        summary: 'A generated reference.',
      },
    })
    expect(primitiveContentSchemas.pdf_reference.assetRefs(reference)).toEqual([
      { assetId: 'document-file', type: 'document', path: 'content.assetId' },
      { assetId: 'cover-file', type: 'image', path: 'content.coverAssetId' },
    ])
  })
})

describe('rich text tokenization', () => {
  it('marks only the first term occurrence, preserves emphasis and never parses HTML', () => {
    const tokens = tokenizeRichText(
      'Dose matters. Dose is <img src=x> critical.',
      [{ term: 'dose', definition: 'An administered quantity.' }],
      ['critical'],
    )
    expect(tokens.filter(({ type }) => type === 'term')).toHaveLength(1)
    expect(tokens).toContainEqual({ type: 'emphasis', text: 'critical' })
    expect(tokens.map(({ text }) => text).join('')).toBe(
      'Dose matters. Dose is <img src=x> critical.',
    )
  })

  it('renders term buttons and authored emphasis as text', async () => {
    const user = userEvent.setup()
    const handlers = callbacks()
    const primitive = richTextPrimitiveSchema.parse({
      ...base,
      id: 'reading',
      type: 'rich_text',
      completion: { mode: 'viewed' },
      content: {
        body: 'Dose is critical. Dose remains contextual.',
        terms: [{ term: 'dose', definition: '<script>not markup</script>' }],
        emphasis: ['critical'],
      },
    })
    render(
      <RichTextPrimitive
        {...handlers}
        primitive={primitive}
        attempt={0}
        mode="interactive"
        draft={null}
      />,
    )
    expect(screen.getAllByRole('button', { name: /dose/i })).toHaveLength(1)
    expect(screen.getByText('critical').tagName).toBe('STRONG')
    await user.click(screen.getByRole('button', { name: /dose/i }))
    expect(screen.getByText('<script>not markup</script>')).toBeVisible()
    expect(document.querySelector('script')).toBeNull()
  })
})

describe('played-range progress', () => {
  it('unions ranges and emits every crossed five-percent step', () => {
    const ranges = {
      length: 3,
      start: (index: number) => [0, 3, 8][index]!,
      end: (index: number) => [4, 6, 10][index]!,
    }
    expect(calculatePlayedCoverage(ranges, 10)).toBe(0.8)
    expect(crossedCoverageSteps(0.04, 0.21)).toEqual([0.05, 0.1, 0.15, 0.2])
  })

  it('uses native video controls, captions, markers and pause checkpoints', async () => {
    const user = userEvent.setup()
    const handlers = callbacks()
    render(
      <VideoPrimitive
        {...handlers}
        primitive={video}
        attempt={0}
        mode="interactive"
        draft={null}
      />,
    )
    const element = screen.getByLabelText('Synthetic video') as HTMLVideoElement
    expect(element.controls).toBe(true)
    expect(element.playsInline).toBe(true)
    expect(element.preload).toBe('metadata')
    expect(element.querySelector('track[kind="captions"]')).not.toBeNull()

    Object.defineProperty(element, 'duration', { configurable: true, value: 24 })
    Object.defineProperty(element, 'played', {
      configurable: true,
      value: { length: 1, start: () => 0, end: () => 5 },
    })
    Object.defineProperty(element, 'currentTime', { configurable: true, writable: true, value: 11 })
    element.pause = vi.fn()
    element.play = vi.fn(async () => undefined)
    fireEvent.timeUpdate(element)
    expect(element.pause).toHaveBeenCalled()
    expect(screen.getByRole('group', { name: 'Which fixture is this?' })).toBeVisible()
    expect(handlers.onInteract).toHaveBeenCalledWith({ name: 'media_progress', fraction: 0.2 })

    await user.click(screen.getByRole('radio', { name: 'Synthetic' }))
    expect(screen.getByRole('status')).toHaveTextContent('Correct')
    await user.click(screen.getByRole('button', { name: 'Continue video' }))
    expect(element.play).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Middle' }))
    expect(element.currentTime).toBe(12)
  })
})

describe('audio, carousel and PDF components', () => {
  it('loads an audio transcript in a native disclosure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, text: async () => 'Hand-authored transcript.' })),
    )
    const handlers = callbacks()
    render(
      <AudioPrimitive
        {...handlers}
        primitive={audio}
        attempt={0}
        mode="interactive"
        draft={null}
      />,
    )
    expect(document.querySelector('audio[aria-label="Synthetic audio"]')).toHaveAttribute(
      'controls',
    )
    fireEvent.click(screen.getByText('Transcript'))
    expect(await screen.findByText('Hand-authored transcript.')).toBeVisible()
  })

  it('supports carousel controls, arrow keys and distinct slide reporting', async () => {
    const user = userEvent.setup()
    const handlers = callbacks()
    render(
      <CarouselPrimitive
        {...handlers}
        primitive={carousel}
        attempt={0}
        mode="interactive"
        draft={null}
      />,
    )
    const region = screen.getByRole('region', { name: 'Process' })
    expect(region).toHaveAttribute('aria-roledescription', 'carousel')
    await waitFor(() =>
      expect(handlers.onInteract).toHaveBeenCalledWith({
        name: 'slide_viewed',
        key: 'prepare',
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.keyDown(screen.getByRole('button', { name: 'Previous' }), { key: 'ArrowLeft' })
    expect(handlers.onInteract).toHaveBeenCalledWith({
      name: 'slide_viewed',
      key: 'inspect',
    })
    expect(
      handlers.onInteract.mock.calls.filter(
        ([interaction]) => interaction.name === 'slide_viewed' && interaction.key === 'prepare',
      ),
    ).toHaveLength(1)
  })

  it('opens a PDF natively at the authored page and reports the interaction', async () => {
    const user = userEvent.setup()
    const handlers = callbacks()
    const primitive = pdfReferencePrimitiveSchema.parse({
      ...base,
      id: 'reference',
      type: 'pdf_reference',
      completion: { mode: 'viewed' },
      content: {
        assetId: 'reference-pdf',
        citation: 'Axiom synthetic reference.',
        summary: 'Generated locally.',
        page: 1,
      },
    })
    render(
      <PdfReferencePrimitive
        {...handlers}
        primitive={primitive}
        attempt={0}
        mode="interactive"
        draft={null}
      />,
    )
    const link = screen.getByRole('link', { name: /open reference/i })
    expect(link).toHaveAttribute('href', '/assets/reference-pdf#page=1')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    await user.click(link)
    expect(handlers.onInteract).toHaveBeenCalledWith({ name: 'pdf_opened', key: 'opened' })
  })
})
