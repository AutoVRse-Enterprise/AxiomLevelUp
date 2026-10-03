import appConfigDocument from '../../../public/content/app-config.json'
import anatomyMapDocument from '../../../public/content/fixtures/anatomy-map.json'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnatomyViewer } from '@/anatomy3d/viewer/AnatomyViewer'
import { anatomyMapSchema, appConfigSchema } from '@/content/schema'

const mocked = vi.hoisted(() => ({
  controller: {
    load: vi.fn(),
    setStartView: vi.fn(),
    pick: vi.fn(),
    highlight: vi.fn(),
    setMarker: vi.fn(),
    flyTo: vi.fn(),
    availableBranches: vi.fn(),
    enterEndoscopic: vi.fn(),
    resetView: vi.fn(),
    dispose: vi.fn(),
  },
  retry: vi.fn(),
  useAnatomyViewer: vi.fn(),
}))

vi.mock('@/anatomy3d/viewer/useAnatomyViewer', () => ({
  useAnatomyViewer: mocked.useAnatomyViewer,
}))

vi.mock('@/design/motion/useResolvedMotion', () => ({
  useResolvedMotion: () => 'reduced',
}))

const map = anatomyMapSchema.parse(anatomyMapDocument)
const config = appConfigSchema.parse(appConfigDocument).product.anatomy3d

describe('AnatomyViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked.controller.pick.mockReturnValue('target-structure')
    mocked.controller.availableBranches.mockReturnValue(['terminal-waypoint'])
    mocked.useAnatomyViewer.mockReturnValue({
      state: {
        status: 'ready',
        message: 'Interactive anatomy ready',
        loadResult: { meshNames: ['target-structure'], triangleCount: 12 },
        warning: null,
      },
      controller: mocked.controller,
      retry: mocked.retry,
    })
  })

  it('offers equivalent pointer and keyboard-list structure selection', async () => {
    const user = userEvent.setup()
    const onStructureSelected = vi.fn()
    render(
      <AnatomyViewer
        config={config}
        map={map}
        modelUrl="/model.glb"
        onStructureSelected={onStructureSelected}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Target structure' }))
    expect(onStructureSelected).toHaveBeenCalledWith('target-structure')
    expect(screen.getByRole('button', { name: 'Target structure' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    const viewport = screen.getByLabelText('Interactive 3D anatomy viewport')
    fireEvent.pointerDown(viewport, { clientX: 10, clientY: 10 })
    fireEvent.pointerUp(viewport, { clientX: 12, clientY: 11 })
    expect(mocked.controller.pick).toHaveBeenCalledWith(12, 11)
    expect(screen.getByRole('button', { name: 'Target structure' })).toHaveFocus()
  })

  it('keeps the imperative canvas mount separate from React-owned overlays', () => {
    render(<AnatomyViewer config={config} map={map} modelUrl="/model.glb" />)

    const viewport = screen.getByLabelText('Interactive 3D anatomy viewport')
    const options = mocked.useAnatomyViewer.mock.calls.at(-1)?.[0] as {
      element: HTMLDivElement | null
    }
    expect(options.element).not.toBe(viewport)
    expect(viewport).toContainElement(options.element)
    expect(options.element).toBeEmptyDOMElement()
  })

  it('cuts waypoint motion when reduced motion is active', async () => {
    const user = userEvent.setup()
    const onWaypointReached = vi.fn()
    render(
      <AnatomyViewer
        config={config}
        map={map}
        modelUrl="/model.glb"
        startView={{ mode: 'waypoint', waypointId: 'entry-waypoint' }}
        onWaypointReached={onWaypointReached}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Terminal waypoint' }))
    expect(mocked.controller.flyTo).toHaveBeenCalledWith('terminal-waypoint', { animate: false })
    expect(onWaypointReached).toHaveBeenCalledWith('terminal-waypoint')
  })

  it('keeps the structure list available when WebGL fails', async () => {
    const user = userEvent.setup()
    mocked.useAnatomyViewer.mockReturnValue({
      state: {
        status: 'error',
        message: 'WebGL unavailable',
        loadResult: null,
        warning: null,
      },
      controller: null,
      retry: mocked.retry,
    })
    render(<AnatomyViewer config={config} map={map} modelUrl="/model.glb" />)

    expect(screen.getByText('3D anatomy unavailable')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Target structure' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(mocked.retry).toHaveBeenCalledOnce()
  })

  it('uses an in-page fullscreen fallback', async () => {
    const user = userEvent.setup()
    render(<AnatomyViewer config={config} map={map} modelUrl="/model.glb" />)

    await user.click(screen.getByRole('button', { name: 'Expand anatomy viewer' }))
    expect(screen.getByRole('button', { name: 'Exit fullscreen anatomy viewer' })).toBeVisible()
  })
})
