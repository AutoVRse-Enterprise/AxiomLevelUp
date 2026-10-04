import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import fixtureCaseJson from '../../../public/content/fixtures/case.json'

import { caseDocumentSchema } from '@/content/schema'
import { PatientTimeline } from '@/player/case/PatientTimeline'

const caseDoc = caseDocumentSchema.parse({
  ...structuredClone(fixtureCaseJson),
  stages: fixtureCaseJson.stages.map((stage, index) => ({
    ...stage,
    update: {
      timeLabel: index === 0 ? 'Arrival' : 'Later',
      narrative: index === 0 ? 'The patient arrives.' : 'New evidence is available.',
    },
  })),
})

describe('PatientTimeline', () => {
  it('reveals updates only through the current stage', () => {
    const view = render(<PatientTimeline caseDoc={caseDoc} currentStageIndex={0} />)
    expect(screen.getByText('Arrival')).toBeVisible()
    expect(screen.queryByText('Later')).not.toBeInTheDocument()

    view.rerender(<PatientTimeline caseDoc={caseDoc} currentStageIndex={1} />)
    expect(screen.getByText('Later')).toBeVisible()
  })
})
