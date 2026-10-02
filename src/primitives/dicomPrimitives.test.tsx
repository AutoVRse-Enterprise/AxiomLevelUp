import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import type {
  DicomExplorePrimitive as DicomExploreContent,
  DicomGuidedPrimitive as DicomGuidedContent,
  DicomIdentifyRegionPrimitive as DicomIdentifyContent,
  DicomMeasurePrimitive as DicomMeasureContent,
} from '@/content/schema/primitives'
import type { DicomViewerProps } from '@/imaging/viewer/DicomViewer'
import { DicomExplorePrimitive } from '@/primitives/components/DicomExplorePrimitive'
import { DicomGuidedPrimitive } from '@/primitives/components/DicomGuidedPrimitive'
import { DicomIdentifyRegionPrimitive } from '@/primitives/components/DicomIdentifyRegionPrimitive'
import { DicomMeasurePrimitive } from '@/primitives/components/DicomMeasurePrimitive'
import { PrimitiveRenderer } from '@/primitives/registry'
import type { PrimitiveComponentProps } from '@/primitives/types'
import { makeValidContentBundle } from '@/test/contentFixtures'

vi.mock('@/imaging/viewer/DicomViewer', () => ({
  DicomViewer: (props: DicomViewerProps) => (
    <div>
      <p>{props.prompt}</p>
      {props.panel}
      <button type="button" onClick={() => props.onLoaded?.(42, 125)}>
        Fake load
      </button>
      <button type="button" onClick={() => props.onPreset?.(props.presets.at(-1)!)}>
        Fake preset
      </button>
      <button type="button" onClick={() => props.onSlice?.(81)}>
        Fake slice
      </button>
      <button type="button" onClick={() => props.onPointSelected?.(81, { x: 0.5009, y: 0.4668 })}>
        Fake point
      </button>
      <button
        type="button"
        onClick={() => props.onMeasurement?.({ slice: 81, value: 17.6, unit: 'px' })}
      >
        Fake pixels
      </button>
      <button
        type="button"
        onClick={() => props.onMeasurement?.({ slice: 81, value: 17.6, unit: 'mm' })}
      >
        Fake millimetres
      </button>
    </div>
  ),
}))

const registry = validateContentBundle(makeValidContentBundle())
const imagingLesson = registry.lessonById.get('dicom-lab')!
const explore = registry.lessonById
  .get('thoracic-ct')!
  .primitives.find(({ type }) => type === 'dicom_explore') as DicomExploreContent
const guided = imagingLesson.primitives.find(
  ({ type }) => type === 'dicom_guided',
) as DicomGuidedContent
const identify = imagingLesson.primitives.find(
  ({ type }) => type === 'dicom_identify_region',
) as DicomIdentifyContent
const measure = imagingLesson.primitives.find(
  ({ type }) => type === 'dicom_measure',
) as DicomMeasureContent

function props<
  P extends DicomExploreContent | DicomGuidedContent | DicomIdentifyContent | DicomMeasureContent,
>(primitive: P): PrimitiveComponentProps<P> {
  return {
    primitive,
    attempt: 1,
    mode: 'interactive',
    draft: null,
    onInteract: vi.fn(),
    onDraftChange: vi.fn(),
    onSubmit: vi.fn(),
    onComplete: vi.fn(),
  }
}

function withContent(node: ReactNode) {
  return render(<ContentContext.Provider value={registry}>{node}</ContentContext.Provider>)
}

describe('DICOM primitive components', () => {
  it('routes a missing series to the imaging recovery state', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const missing = {
      ...explore,
      content: { ...explore.content, seriesAssetId: 'missing-series' },
    }

    withContent(<PrimitiveRenderer {...props(missing)} onComplete={onComplete} />)

    expect(await screen.findByRole('heading', { name: 'Imaging study unavailable' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('reports exploration requirements and viewer lifecycle', async () => {
    const user = userEvent.setup()
    const componentProps = props(explore)
    withContent(<DicomExplorePrimitive {...componentProps} />)

    await user.click(screen.getByRole('button', { name: 'Fake load' }))
    await user.click(screen.getByRole('button', { name: 'Fake slice' }))
    await user.click(screen.getByRole('button', { name: 'Fake preset' }))

    expect(componentProps.onInteract).toHaveBeenCalledWith({
      name: 'dicom_viewer_loaded',
      firstImageMs: 42,
      sliceCount: 125,
    })
    expect(componentProps.onInteract).toHaveBeenCalledWith({
      name: 'dicom_requirement',
      key: 'preset:mediastinal',
    })
  })

  it('advances ordered guidance and submits its checkpoint', async () => {
    const user = userEvent.setup()
    const componentProps = props(guided)
    withContent(<DicomGuidedPrimitive {...componentProps} />)

    await user.click(screen.getByRole('button', { name: 'Fake preset' }))
    await user.click(screen.getByRole('button', { name: 'Fake slice' }))
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('radio', { name: 'Trachea' }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))

    expect(componentProps.onSubmit).toHaveBeenCalledWith('trachea')
  })

  it('submits a slice-aware image point', async () => {
    const user = userEvent.setup()
    const componentProps = props(identify)
    withContent(<DicomIdentifyRegionPrimitive {...componentProps} />)

    await user.click(screen.getByRole('button', { name: 'Fake point' }))
    await user.click(screen.getByRole('button', { name: 'Check location' }))

    expect(componentProps.onSubmit).toHaveBeenCalledWith({
      slice: 81,
      point: { x: 0.5009, y: 0.4668 },
    })
  })

  it('blocks pixel measurements and submits calibrated millimetres', async () => {
    const user = userEvent.setup()
    const componentProps = props(measure)
    withContent(<DicomMeasurePrimitive {...componentProps} />)

    await user.click(screen.getByRole('button', { name: 'Fake pixels' }))
    expect(screen.getByRole('button', { name: 'Check measurement' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Fake millimetres' }))
    await user.click(screen.getByRole('button', { name: 'Check measurement' }))

    expect(componentProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ slice: 81, value: 17.6, unit: 'mm' }),
    )
  })
})
