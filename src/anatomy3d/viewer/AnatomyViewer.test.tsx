import appConfigDocument from '../../../public/content/app-config.json'
import anatomyMapDocument from '../../../public/content/fixtures/anatomy-map.json'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AnatomyViewer } from '@/anatomy3d/viewer/AnatomyViewer'
import { anatomyMapSchema, appConfigSchema } from '@/content/schema'
import { useLearnerStore } from '@/state/learnerStore'

const mocked = vi.hoisted(() => ({
  controller: {
    load: vi.fn(),
    setStartView: vi.fn(),
    setSelectableLevelIds: vi.fn(),
    pick: vi.fn(),
    pickFinding: vi.fn(),
    highlight: vi.fn(),
    setMarker: vi.fn(),
    setFindings: vi.fn(),
    travelTo: vi.fn(),
    availableBranches: vi.fn(),
    parentWaypoint: vi.fn(),
    waypointPath: vi.fn(),
    enterEndoscopic: vi.fn(),
    exitEndoscopic: vi.fn(),
    lookAround: vi.fn(),
    frameStructures: vi.fn(),
    resetView: vi.fn(),
    getTestSnapshot: vi.fn(() => ({
      structures: [],
      findings: [],
      markers: [],
      renderer: {
        webglVersion: 2,
        renderer: 'Test renderer',
        vendor: 'Test vendor',
        unmaskedRenderer: null,
        unmaskedVendor: null,
      },
      performance: { medianFrameMs: 16.7, medianFps: 59.9, sampleCount: 120 },
    })),
    loseContext: vi.fn(),
    restoreContext: vi.fn(),
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
    useLearnerStore.setState({ caseLab: { walkthroughSeen: true, anatomyHintSeen: false } })
    window.history.replaceState({}, '', '/')
    mocked.controller.pick.mockReturnValue('target-structure')
    mocked.controller.pickFinding.mockReturnValue(null)
    mocked.controller.availableBranches.mockReturnValue(['terminal-waypoint'])
    mocked.controller.parentWaypoint.mockReturnValue(null)
    mocked.controller.waypointPath.mockReturnValue(['entry-waypoint'])
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
        selectableLevelIds={['structure']}
        onStructureSelected={onStructureSelected}
      />,
    )

    await user.click(screen.getByText('Choose from list'))
    await user.click(screen.getByRole('button', { name: 'Target structure' }))
    expect(onStructureSelected).toHaveBeenCalledWith('target-structure')
    expect(screen.getByRole('button', { name: 'Target structure' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    const viewport = screen.getByLabelText('Interactive 3D anatomy viewport')
    fireEvent.pointerDown(viewport, { clientX: 10, clientY: 10 })
    fireEvent.pointerUp(viewport, { clientX: 12, clientY: 11 })
    expect(mocked.controller.pick).toHaveBeenCalledWith(12, 11, ['structure'])
    expect(screen.getByRole('button', { name: 'Target structure' })).toHaveFocus()
  })

  it('installs, picks and labels configured findings', async () => {
    const finding = {
      id: 'fixture-finding',
      label: 'Configured narrowing',
      description: 'A generic local lumen finding.',
      kind: 'lumen_narrowing' as const,
      anchor: {
        type: 'waypoint' as const,
        waypoint: 'entry-waypoint',
        toWaypoint: 'terminal-waypoint',
        t: 0.5,
      },
      severity: 0.7,
      clueIds: [],
      significance: 'This finding narrows the spatial differential.',
    }
    const onFindingInspected = vi.fn()
    mocked.controller.pickFinding.mockReturnValue(finding.id)
    render(
      <AnatomyViewer
        config={config}
        findings={[finding]}
        map={map}
        modelUrl="/model.glb"
        startView={{ mode: 'endoscopic', waypointId: 'entry-waypoint' }}
        onFindingInspected={onFindingInspected}
      />,
    )

    expect(mocked.controller.setFindings).toHaveBeenCalledWith([finding])
    const viewport = screen.getByLabelText('Interactive 3D anatomy viewport')
    fireEvent.pointerDown(viewport, { clientX: 10, clientY: 10 })
    fireEvent.pointerUp(viewport, { clientX: 11, clientY: 11 })

    expect(mocked.controller.pickFinding).toHaveBeenCalledWith(11, 11)
    expect(onFindingInspected).toHaveBeenCalledWith(finding.id)
    expect(screen.getByRole('status')).toHaveTextContent('Configured narrowing')
    expect(screen.getByText('Why it matters')).toBeVisible()
    expect(screen.getByText('This finding narrows the spatial differential.')).toBeVisible()
    expect(mocked.controller.pick).not.toHaveBeenCalled()
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

  it('shows camera and waypoint authoring data only when requested in development', () => {
    window.history.replaceState({}, '', '/?anatomyDebug=1')
    render(
      <AnatomyViewer
        config={config}
        map={map}
        modelUrl="/model.glb"
        startView={{ mode: 'endoscopic', waypointId: 'entry-waypoint' }}
      />,
    )

    const options = mocked.useAnatomyViewer.mock.calls.at(-1)?.[0] as {
      onViewChanged: (view: {
        position: [number, number, number]
        target: [number, number, number]
        waypointId: string
        endoscopic: boolean
      }) => void
    }
    act(() =>
      options.onViewChanged({
        position: [1.234, 2.345, 3.456],
        target: [4.567, 5.678, 6.789],
        waypointId: 'terminal-waypoint',
        endoscopic: true,
      }),
    )

    expect(screen.getByText('Anatomy authoring readout')).toBeVisible()
    expect(screen.getByText('terminal-waypoint')).toBeVisible()
    expect(screen.getByText('1.23, 2.35, 3.46')).toBeVisible()
    expect(screen.getByText('4.57, 5.68, 6.79')).toBeVisible()
    expect(screen.getByText('16.7 ms')).toBeVisible()
    expect(screen.getByText('59.9')).toBeVisible()
    expect(screen.getByText('Test renderer')).toBeVisible()
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
    expect(mocked.controller.travelTo).toHaveBeenCalledWith('terminal-waypoint', {
      animate: false,
    })
    expect(onWaypointReached).toHaveBeenCalledWith('terminal-waypoint')
    expect(screen.getByRole('status')).toHaveTextContent('You are now in Terminal waypoint.')
  })

  it('shows a persistent dismissible interaction hint once per learner', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<AnatomyViewer config={config} map={map} modelUrl="/model.glb" />)

    expect(screen.getByText('Drag to rotate. Tap a branch or use the buttons.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Dismiss anatomy interaction hint' }))
    expect(useLearnerStore.getState().caseLab.anatomyHintSeen).toBe(true)

    rerender(<AnatomyViewer config={config} map={map} modelUrl="/model.glb" />)
    expect(
      screen.queryByText('Drag to rotate. Tap a branch or use the buttons.'),
    ).not.toBeInTheDocument()
  })

  it('pairs the desktop viewport with a control column and caps the mobile viewport', () => {
    render(<AnatomyViewer config={config} map={map} modelUrl="/model.glb" />)

    const viewport = screen.getByLabelText('Interactive 3D anatomy viewport')
    expect(viewport).toHaveClass('h-[min(45svh,28rem)]')
    expect(viewport.parentElement).toHaveClass('md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]')
    expect(viewport.nextElementSibling).toHaveClass('md:border-l')
  })

  it('frames the structures selectable at the active external level', () => {
    render(
      <AnatomyViewer
        config={config}
        map={map}
        modelUrl="/model.glb"
        selectableLevelIds={['structure']}
      />,
    )

    expect(mocked.controller.setSelectableLevelIds).toHaveBeenCalledWith(['structure'])
    expect(mocked.controller.frameStructures).toHaveBeenCalledWith(['target-structure'], {
      animate: false,
    })
  })

  it('preserves the marker authored by a marker start view', () => {
    const startView = { mode: 'marker', structureId: 'target-structure' } as const
    const { rerender } = render(
      <AnatomyViewer config={config} map={map} modelUrl="/model.glb" startView={startView} />,
    )

    expect(mocked.controller.setMarker).toHaveBeenLastCalledWith('target-structure')

    rerender(
      <AnatomyViewer config={config} map={map} modelUrl="/model.glb" startView={startView} />,
    )
    expect(mocked.controller.setMarker).toHaveBeenLastCalledWith('target-structure')
  })

  it('lets an explicit marker override take precedence over the authored marker', () => {
    render(
      <AnatomyViewer
        config={config}
        map={map}
        modelUrl="/model.glb"
        startView={{ mode: 'marker', structureId: 'target-structure' }}
        markerStructureId="root"
      />,
    )

    expect(mocked.controller.setMarker).toHaveBeenLastCalledWith('root')
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
    expect(screen.getByText('Choose from list').closest('details')).toHaveAttribute('open')
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

  it('travels reversibly without leaving endoscopic mode', async () => {
    const user = userEvent.setup()
    mocked.controller.travelTo.mockImplementation((waypointId: string) => {
      if (waypointId === 'terminal-waypoint') {
        mocked.controller.parentWaypoint.mockReturnValue('entry-waypoint')
        mocked.controller.waypointPath.mockReturnValue(['entry-waypoint', 'terminal-waypoint'])
      }
    })
    render(
      <AnatomyViewer
        config={config}
        map={map}
        modelUrl="/model.glb"
        startView={{ mode: 'endoscopic', waypointId: 'entry-waypoint' }}
      />,
    )

    expect(screen.getByText('Current landmark:')).toBeVisible()
    expect(screen.getByText('Entry waypoint', { selector: 'strong' })).toBeVisible()
    expect(screen.getByText('Left')).toBeVisible()
    expect(screen.getByText('Right')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Terminal waypoint' }))
    expect(mocked.controller.travelTo).toHaveBeenLastCalledWith('terminal-waypoint', {
      animate: false,
    })
    await user.click(screen.getByRole('button', { name: 'Back to Entry waypoint' }))
    expect(mocked.controller.travelTo).toHaveBeenLastCalledWith('entry-waypoint', {
      animate: false,
    })
  })

  it('toggles between airway and outside views at the current waypoint', async () => {
    const user = userEvent.setup()
    render(
      <AnatomyViewer
        config={config}
        map={map}
        modelUrl="/model.glb"
        startView={{ mode: 'endoscopic', waypointId: 'entry-waypoint' }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(mocked.controller.exitEndoscopic).toHaveBeenCalledWith({ animate: false })
    await user.click(screen.getByRole('button', { name: 'Airway' }))
    expect(mocked.controller.enterEndoscopic).toHaveBeenCalledWith('entry-waypoint')
  })

  it('supports configured limited pointer look-around inside the lumen', () => {
    render(
      <AnatomyViewer
        config={config}
        map={map}
        modelUrl="/model.glb"
        startView={{ mode: 'endoscopic', waypointId: 'entry-waypoint' }}
      />,
    )

    const viewport = screen.getByLabelText('Interactive 3D anatomy viewport')
    fireEvent.pointerDown(viewport, { clientX: 20, clientY: 20, pointerId: 1 })
    fireEvent.pointerMove(viewport, { clientX: 28, clientY: 16, pointerId: 1 })
    expect(mocked.controller.lookAround).toHaveBeenCalledWith(8, -4)
  })
})
