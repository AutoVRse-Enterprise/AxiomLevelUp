import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { CaseWorkspace, type WorkspaceSegment } from '@/player/case/CaseWorkspace'

function workspace(key = 'step-1') {
  function Harness() {
    const [segment, setSegment] = useState<WorkspaceSegment>('task')
    return (
      <CaseWorkspace
        task={<p>Current task</p>}
        evidence={<p>Current evidence</p>}
        notes={<p>Current notes</p>}
        evidenceAnnouncement="Two evidence items are now available."
        segment={segment}
        onSegmentChange={setSegment}
      />
    )
  }

  return (
    <Harness key={key} />
  )
}

describe('CaseWorkspace', () => {
  it('provides one mobile segment model and an in-flow desktop evidence panel', async () => {
    const user = userEvent.setup()
    render(workspace())
    const mobileTabs = within(screen.getByRole('tablist', { name: 'Case workspace' }))

    expect(mobileTabs.getByRole('tab', { name: 'Task' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('complementary', { name: 'Case support workspace' })).toBeInTheDocument()

    await user.click(mobileTabs.getByRole('tab', { name: 'Clues' }))
    expect(mobileTabs.getByRole('tab', { name: 'Clues' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tabpanel', { name: 'Clues' })).toHaveTextContent('Current evidence')
    expect(screen.getByRole('status')).toHaveTextContent('Two evidence items are now available.')
  })

  it('returns the mobile segment to Task when the step remounts', async () => {
    const user = userEvent.setup()
    const view = render(workspace())
    const mobileTabs = within(screen.getByRole('tablist', { name: 'Case workspace' }))

    await user.click(mobileTabs.getByRole('tab', { name: 'Case notes' }))
    expect(mobileTabs.getByRole('tab', { name: 'Case notes' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    view.rerender(workspace('step-2'))
    expect(
      within(screen.getByRole('tablist', { name: 'Case workspace' })).getByRole('tab', {
        name: 'Task',
      }),
    ).toHaveAttribute('aria-selected', 'true')
  })
})
