import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  imageComparePrimitiveSchema,
  imageHotspotPrimitiveSchema,
  imagePrimitiveSchema,
  primitiveContentSchemas,
  zoomableImagePrimitiveSchema,
} from '@/content/schema/primitives'
import { ImageComparePrimitive } from '@/primitives/components/ImageComparePrimitive'
import { ImageHotspotPrimitive } from '@/primitives/components/ImageHotspotPrimitive'
import { ImagePrimitive } from '@/primitives/components/ImagePrimitive'
import { ZoomableImagePrimitive } from '@/primitives/components/ZoomableImagePrimitive'
import { evaluatePrimitive } from '@/primitives/definitions'
import { hitImageRegions, isPointInImageRegion } from '@/primitives/definitions/imageHitTesting'
import { buildActivityPlan } from '@/engines/learning/plan'

vi.mock('@/content/useAssetUrl', () => ({
  useAsset: (assetId?: string) =>
    assetId
      ? {
          assetId,
          path: `/assets/${assetId}.svg`,
          type: 'image',
          offlineRequired: true,
          width: 800,
          height: 600,
        }
      : undefined,
  useAssetUrl: (assetId?: string) => (assetId ? `/assets/${assetId}.svg` : undefined),
}))

const base = {
  conceptIds: [],
  scoring: { weight: 1 },
  feedback: {},
  assets: [],
}

const regions = [
  {
    id: 'circle',
    label: 'Circle',
    description: 'A circular region.',
    shape: 'circle' as const,
    x: 0.25,
    y: 0.25,
    radius: 0.1,
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    shape: 'rect' as const,
    x: 0.5,
    y: 0.1,
    width: 0.2,
    height: 0.3,
  },
  {
    id: 'polygon',
    label: 'Polygon',
    shape: 'polygon' as const,
    points: [
      { x: 0.4, y: 0.6 },
      { x: 0.8, y: 0.6 },
      { x: 0.6, y: 0.9 },
    ],
  },
]

const exploreHotspot = imageHotspotPrimitiveSchema.parse({
  ...base,
  id: 'explore-image',
  type: 'image_hotspot',
  completion: { mode: 'explored' },
  content: {
    mode: 'explore',
    assetId: 'showcase-anatomy',
    alt: 'Synthetic anatomy diagram',
    prompt: 'Explore every region',
    regions,
  },
})

const assessHotspot = imageHotspotPrimitiveSchema.parse({
  ...base,
  id: 'assess-image',
  type: 'image_hotspot',
  completion: { mode: 'answer' },
  content: {
    mode: 'assess',
    assetId: 'showcase-anatomy',
    alt: 'Synthetic anatomy diagram',
    prompt: 'Locate the circular structure',
    regions,
    targetRegionIds: ['circle'],
    explanation: 'The target is the upper-left circle.',
  },
})

const callbacks = () => ({
  onInteract: vi.fn(),
  onDraftChange: vi.fn(),
  onSubmit: vi.fn(),
  onComplete: vi.fn(),
})

describe('image primitive schemas', () => {
  it('rejects duplicate annotations and applies bounded zoom defaults', () => {
    expect(
      imagePrimitiveSchema.safeParse({
        ...base,
        id: 'image',
        type: 'image',
        completion: { mode: 'viewed' },
        content: {
          assetId: 'image',
          alt: 'Image',
          annotations: [
            { id: 'same', label: 'One', x: 0.2, y: 0.2 },
            { id: 'same', label: 'Two', x: 0.3, y: 0.3 },
          ],
        },
      }).success,
    ).toBe(false)

    const zoomable = zoomableImagePrimitiveSchema.parse({
      ...base,
      id: 'zoomable',
      type: 'zoomable_image',
      completion: { mode: 'viewed' },
      content: { assetId: 'image', alt: 'Image' },
    })
    expect(zoomable.content.maxZoom).toBe(4)
    expect(
      zoomableImagePrimitiveSchema.safeParse({
        ...zoomable,
        content: { ...zoomable.content, maxZoom: 9 },
      }).success,
    ).toBe(false)
  })

  it('rejects out-of-bounds regions, duplicate IDs and invalid hotspot targets', () => {
    expect(
      zoomableImagePrimitiveSchema.safeParse({
        ...base,
        id: 'bad-region',
        type: 'zoomable_image',
        completion: { mode: 'viewed' },
        content: {
          assetId: 'image',
          alt: 'Image',
          regions: [{ ...regions[0], x: 0.95 }],
        },
      }).success,
    ).toBe(false)
    expect(
      zoomableImagePrimitiveSchema.safeParse({
        ...base,
        id: 'duplicate-region',
        type: 'zoomable_image',
        completion: { mode: 'viewed' },
        content: {
          assetId: 'image',
          alt: 'Image',
          regions: [regions[0], { ...regions[0], label: 'Duplicate' }],
        },
      }).success,
    ).toBe(false)
    expect(
      imageHotspotPrimitiveSchema.safeParse({
        ...assessHotspot,
        content: { ...assessHotspot.content, targetRegionIds: ['missing'] },
      }).success,
    ).toBe(false)
    expect(
      imageHotspotPrimitiveSchema.safeParse({
        ...exploreHotspot,
        completion: { mode: 'explored', count: 1 },
      }).success,
    ).toBe(false)
  })

  it('reports every image asset with the required manifest type', () => {
    const comparison = imageComparePrimitiveSchema.parse({
      ...base,
      id: 'compare',
      type: 'image_compare',
      completion: { mode: 'viewed' },
      content: {
        mode: 'slider',
        before: { assetId: 'before', alt: 'Before', label: 'Before' },
        after: { assetId: 'after', alt: 'After', label: 'After' },
      },
    })
    expect(comparison.content.initialPosition).toBe(0.5)
    expect(primitiveContentSchemas.image_compare.assetRefs(comparison)).toEqual([
      { assetId: 'before', type: 'image', path: 'content.before.assetId' },
      { assetId: 'after', type: 'image', path: 'content.after.assetId' },
    ])
    expect(
      imageComparePrimitiveSchema.safeParse({
        ...comparison,
        content: { ...comparison.content, extra: true },
      }).success,
    ).toBe(false)
  })
})

describe('image hotspot geometry and definitions', () => {
  it('hit-tests circle, rectangle and polygon boundaries', () => {
    expect(isPointInImageRegion({ x: 0.25, y: 0.25 }, regions[0]!)).toBe(true)
    expect(isPointInImageRegion({ x: 0.35, y: 0.25 }, regions[0]!)).toBe(true)
    expect(isPointInImageRegion({ x: 0.7, y: 0.4 }, regions[1]!)).toBe(true)
    expect(isPointInImageRegion({ x: 0.6, y: 0.7 }, regions[2]!)).toBe(true)
    expect(hitImageRegions({ x: 0.05, y: 0.95 }, regions)).toEqual([])
  })

  it('evaluates normalized target points and rejects malformed responses', () => {
    expect(evaluatePrimitive(assessHotspot, { x: 0.25, y: 0.25 }).score).toBe(1)
    expect(evaluatePrimitive(assessHotspot, { x: 0.8, y: 0.2 }).score).toBe(0)
    expect(evaluatePrimitive(assessHotspot, { x: Number.NaN, y: 0.25 }).score).toBe(0)
  })

  it('plans explore as content and assess as scored assessment', () => {
    const player = {
      retryByDefault: false,
      maxAttempts: 1,
      revealAnswer: 'final_attempt' as const,
      mediaCompletionThreshold: 0.9,
      timerAnnouncements: [30, 10],
    }
    const activity = {
      kind: 'lesson' as const,
      id: 'images',
      version: '1',
      title: 'Images',
      description: 'Image modes',
      estimatedMinutes: 1,
      conceptIds: [],
      primitives: [exploreHotspot, assessHotspot],
    }
    const plan = buildActivityPlan(activity, { environment: 'development', player })
    expect(plan.steps.map(({ kind, scored }) => [kind, scored])).toEqual([
      ['content', false],
      ['assessment', true],
    ])
    expect(plan.steps[0]?.explorableKeys).toEqual(['circle', 'rectangle', 'polygon'])
  })
})

describe('image primitive components', () => {
  it('toggles ordinary image annotations and preserves manifest aspect ratio', async () => {
    const user = userEvent.setup()
    const primitive = imagePrimitiveSchema.parse({
      ...base,
      id: 'annotated-image',
      type: 'image',
      completion: { mode: 'viewed' },
      content: {
        assetId: 'annotated',
        alt: 'Annotated image',
        annotations: [{ id: 'focus', label: 'Focus area', x: 0.5, y: 0.5 }],
      },
    })
    const { container } = render(
      <ImagePrimitive
        primitive={primitive}
        attempt={0}
        mode="interactive"
        draft={null}
        {...callbacks()}
      />,
    )

    expect(screen.getByText('Focus area')).toBeVisible()
    expect(container.querySelector('[style*="aspect-ratio"]')).toHaveStyle(
      'aspect-ratio: 800 / 600',
    )
    await user.click(screen.getByRole('button', { name: 'Hide annotations' }))
    expect(screen.queryByText('Focus area')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Expand image' }))
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.getByRole('button', { name: /Interactive image viewer/ })).toBeVisible()
  })

  it('reports each explored hotspot only once', async () => {
    const user = userEvent.setup()
    const props = callbacks()
    render(
      <ImageHotspotPrimitive
        primitive={exploreHotspot}
        attempt={0}
        mode="interactive"
        draft={null}
        {...props}
      />,
    )

    const circle = screen.getByRole('button', { name: 'Explore Circle' })
    await user.click(circle)
    await user.click(circle)
    await user.click(screen.getByRole('button', { name: 'Explore Rectangle' }))
    await user.click(screen.getByRole('button', { name: 'Explore Polygon' }))
    expect(props.onInteract.mock.calls.map(([event]) => event.key)).toEqual([
      'circle',
      'rectangle',
      'polygon',
    ])
    expect(screen.getByText('A circular region.')).toBeVisible()
  })

  it('places a normalized marker and supports keyboard crosshair submission', () => {
    const props = callbacks()
    render(
      <ImageHotspotPrimitive
        primitive={assessHotspot}
        attempt={0}
        mode="interactive"
        draft={null}
        {...props}
      />,
    )
    const selector = screen.getByRole('button', { name: /Image location selector/ })
    vi.spyOn(selector, 'getBoundingClientRect').mockReturnValue({
      x: 10,
      y: 20,
      left: 10,
      top: 20,
      right: 210,
      bottom: 120,
      width: 200,
      height: 100,
      toJSON: () => ({}),
    })

    fireEvent.click(selector, { clientX: 60, clientY: 45 })
    expect(props.onDraftChange).toHaveBeenLastCalledWith({ x: 0.25, y: 0.25 })
    fireEvent.keyDown(selector, { key: 'ArrowRight' })
    expect(props.onDraftChange).toHaveBeenLastCalledWith({ x: 0.27, y: 0.25 })
    fireEvent.keyDown(selector, { key: 'ArrowDown', shiftKey: true })
    expect(props.onDraftChange).toHaveBeenLastCalledWith({ x: 0.27, y: 0.35 })
    fireEvent.keyDown(selector, { key: 'Enter' })
    expect(props.onSubmit).toHaveBeenCalledWith({ x: 0.27, y: 0.35 })
  })

  it('reveals assessment targets only when review policy allows it', () => {
    const props = callbacks()
    const { container, rerender } = render(
      <ImageHotspotPrimitive
        primitive={assessHotspot}
        attempt={1}
        mode="review"
        draft={null}
        review={{
          response: { x: 0.8, y: 0.2 },
          evaluation: evaluatePrimitive(assessHotspot, { x: 0.8, y: 0.2 }),
          revealAnswer: false,
        }}
        {...props}
      />,
    )
    expect(container.querySelector('svg circle')).not.toBeInTheDocument()

    rerender(
      <ImageHotspotPrimitive
        primitive={assessHotspot}
        attempt={1}
        mode="review"
        draft={null}
        review={{
          response: { x: 0.8, y: 0.2 },
          evaluation: evaluatePrimitive(assessHotspot, { x: 0.8, y: 0.2 }),
          revealAnswer: true,
        }}
        {...props}
      />,
    )
    expect(container.querySelector('svg circle')).toBeInTheDocument()
    expect(screen.getByText('The highlighted region shows the target.')).toBeInTheDocument()
  })

  it('renders accessible slider and responsive side-by-side comparison modes', () => {
    const slider = imageComparePrimitiveSchema.parse({
      ...base,
      id: 'slider',
      type: 'image_compare',
      completion: { mode: 'viewed' },
      content: {
        mode: 'slider',
        before: { assetId: 'before', alt: 'Before image', label: 'Before' },
        after: { assetId: 'after', alt: 'After image', label: 'After' },
        initialPosition: 0.4,
      },
    })
    const props = callbacks()
    const { container, rerender } = render(
      <ImageComparePrimitive
        primitive={slider}
        attempt={0}
        mode="interactive"
        draft={null}
        {...props}
      />,
    )
    const range = screen.getByRole('slider', { name: 'Comparison position' })
    expect(range).toHaveValue('40')
    fireEvent.change(range, { target: { value: '65' } })
    expect(range).toHaveValue('65')
    expect(props.onInteract).toHaveBeenCalledWith({ name: 'image_comparison_adjusted' })

    const divider = container.querySelector<HTMLElement>('[data-image-compare-divider]')
    expect(divider).toHaveClass('touch-none', 'cursor-ew-resize')
    const comparison = divider?.parentElement
    expect(comparison).not.toBeNull()
    vi.spyOn(comparison!, 'getBoundingClientRect').mockReturnValue({
      bottom: 310,
      height: 300,
      left: 10,
      right: 410,
      top: 10,
      width: 400,
      x: 10,
      y: 10,
      toJSON: vi.fn(),
    })
    Object.assign(divider!, {
      hasPointerCapture: vi.fn(() => true),
      releasePointerCapture: vi.fn(),
      setPointerCapture: vi.fn(),
    })

    expect(
      fireEvent.pointerDown(divider!, { clientX: 110, pointerId: 1, pointerType: 'touch' }),
    ).toBe(false)
    fireEvent.pointerMove(divider!, { clientX: 310, pointerId: 1, pointerType: 'touch' })
    fireEvent.pointerUp(divider!, { clientX: 310, pointerId: 1, pointerType: 'touch' })

    expect(range).toHaveValue('75')
    expect(divider).toHaveStyle({ left: '75%' })
    expect(divider!.setPointerCapture).toHaveBeenCalledWith(1)
    expect(divider!.releasePointerCapture).toHaveBeenCalledWith(1)

    rerender(
      <ImageComparePrimitive
        primitive={imageComparePrimitiveSchema.parse({
          ...slider,
          content: { ...slider.content, mode: 'side_by_side' },
        })}
        attempt={0}
        mode="interactive"
        draft={null}
        {...props}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Before' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'After' })).toBeVisible()
  })

  it('honors zoom limits and exposes keyboard-capable image controls', () => {
    const primitive = zoomableImagePrimitiveSchema.parse({
      ...base,
      id: 'zoom',
      type: 'zoomable_image',
      completion: { mode: 'viewed' },
      content: {
        assetId: 'zoom',
        alt: 'Zoom image',
        maxZoom: 1,
        regions: [],
      },
    })
    render(
      <ZoomableImagePrimitive
        primitive={primitive}
        attempt={0}
        mode="interactive"
        draft={null}
        {...callbacks()}
      />,
    )
    expect(screen.getByRole('button', { name: /Interactive image viewer/ })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
  })

  it('zooms with keyboard, wheel and two-pointer pinch input', () => {
    const primitive = zoomableImagePrimitiveSchema.parse({
      ...base,
      id: 'zoom-inputs',
      type: 'zoomable_image',
      completion: { mode: 'viewed' },
      content: {
        assetId: 'zoom',
        alt: 'Zoom image',
        maxZoom: 4,
        regions: [],
      },
    })
    render(
      <ZoomableImagePrimitive
        primitive={primitive}
        attempt={0}
        mode="interactive"
        draft={null}
        {...callbacks()}
      />,
    )
    const viewer = screen.getByRole('button', { name: /Interactive image viewer/ })

    fireEvent.keyDown(viewer, { key: '+' })
    expect(screen.getByText('Zoom 125%')).toBeInTheDocument()
    fireEvent.keyDown(viewer, { key: '0' })
    fireEvent.wheel(viewer, { deltaY: -1, clientX: 10, clientY: 10 })
    expect(screen.getByText('Zoom 120%')).toBeInTheDocument()

    fireEvent.keyDown(viewer, { key: '0' })
    fireEvent.pointerDown(viewer, { pointerId: 1, button: 0, clientX: 10, clientY: 10 })
    fireEvent.pointerDown(viewer, { pointerId: 2, button: 0, clientX: 110, clientY: 10 })
    fireEvent.pointerMove(viewer, { pointerId: 2, clientX: 210, clientY: 10 })
    expect(screen.getByText('Zoom 200%')).toBeInTheDocument()
  })
})
