import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import fixtureCaseJson from '../../../public/content/fixtures/case.json'

import { ContentContext } from '@/app/contentContext'
import { caseDocumentSchema } from '@/content/schema'
import { CaseResults } from '@/player/case/CaseResults'
import type { CaseResultPresentation } from '@/player/case/types'
import { makeCaseRegistry } from '@/test/caseFixtures'

const caseDoc = caseDocumentSchema.parse(fixtureCaseJson)
const clueReview = { minVisibleMs: 1_200, mediaProgressThreshold: 0.8 }
const registry = makeCaseRegistry()

function result(reviewedClueIds: string[]): CaseResultPresentation {
  return {
    caseId: caseDoc.id,
    attemptId: 'attempt-1',
    resultVersion: 7,
    breakdown: {
      anatomy: 1,
      diagnosis: 1,
      speed: 0,
      total: 100,
      durationSeconds: 90,
      openedClueIds: ['clue-context'],
    },
    stepResults: [],
    reviewedClueIds,
    evidence: { pinned: [] },
    differential: {},
    timeoutCreditApplied: false,
    completedAt: '2026-10-03T00:00:00.000Z',
  }
}

function renderResults(reviewedClueIds: string[]) {
  return render(
    <ContentContext.Provider value={registry}>
      <CaseResults
        caseDoc={caseDoc}
        caseLab={registry.appConfig.caseLab!}
        result={result(reviewedClueIds)}
        clues={caseDoc.clues}
        clueReview={clueReview}
        starThresholds={{ one: 0, two: 75, three: 90 }}
        onCompare={vi.fn()}
        onContinue={vi.fn()}
        onReplay={vi.fn()}
      />
    </ContentContext.Provider>,
  )
}

describe('case results', () => {
  it('shows compact truthful completion outcomes without inventing unavailable history', () => {
    const view = renderResults([])
    expect(screen.getByLabelText('3 of 3 stars')).toBeVisible()
    expect(screen.getByText('XP unavailable')).toBeVisible()
    expect(screen.queryByText('Mastery unavailable')).not.toBeInTheDocument()
    expect(screen.queryByText('Badge outcome unavailable')).not.toBeInTheDocument()
    expect(screen.queryByText('No badge unlocked')).not.toBeInTheDocument()

    view.rerender(
      <ContentContext.Provider value={registry}>
        <CaseResults
          activityResult={{
            activityKind: 'case',
            activityId: caseDoc.id,
            xpEarned: 140,
            stars: 0,
            masteryDelta: { imaging: 3 },
            rankBefore: 8,
            rankAfter: 7,
            badgesUnlocked: ['first-case-solved'],
            levelFrom: 2,
            levelTo: 2,
            streak: 4,
            revision: false,
          }}
          caseDoc={caseDoc}
          caseLab={registry.appConfig.caseLab!}
          result={{ ...result([]), actualAwardedXp: 140 }}
          clues={caseDoc.clues}
          clueReview={clueReview}
          starThresholds={{ one: 0, two: 75, three: 90 }}
          onCompare={vi.fn()}
          onContinue={vi.fn()}
          onReplay={vi.fn()}
        />
      </ContentContext.Provider>,
    )
    expect(screen.getByText('140 XP awarded')).toBeVisible()
    expect(screen.getByText('+3 mastery')).toBeVisible()
    expect(screen.getByText('Badge: First Case Solved')).toBeVisible()
  })

  it('shows key-evidence status from reviewed clues rather than opened clues', () => {
    const view = renderResults([])
    expect(screen.getByText('Basic')).toBeVisible()
    expect(screen.getByText('Generic')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Key evidence' })).toBeVisible()
    expect(screen.getByText('Context')).toBeVisible()
    expect(screen.getByText('Not reviewed')).toBeVisible()

    view.rerender(
      <ContentContext.Provider value={registry}>
        <CaseResults
          caseDoc={caseDoc}
          caseLab={registry.appConfig.caseLab!}
          result={result(['clue-context'])}
          clues={caseDoc.clues}
          clueReview={clueReview}
          starThresholds={{ one: 0, two: 75, three: 90 }}
          onCompare={vi.fn()}
          onContinue={vi.fn()}
          onReplay={vi.fn()}
        />
      </ContentContext.Provider>,
    )
    expect(screen.getByText('Reviewed')).toBeVisible()
  })

  it('opens clue evidence in an accessible read-only remediation sheet', async () => {
    const user = userEvent.setup()
    renderResults([])

    await user.click(screen.getByRole('button', { name: 'Review' }))

    const dialog = screen.getByRole('dialog', { name: 'Context' })
    expect(dialog).toHaveTextContent('Read-only remediation')
    expect(
      await screen.findByText('Review this configured evidence before answering.'),
    ).toBeVisible()
  })

  it('shows configured finding details in the evidence review sheet', async () => {
    const user = userEvent.setup()
    const caseWithFindingEvidence = caseDocumentSchema.parse({
      ...fixtureCaseJson,
      debrief: {
        ...fixtureCaseJson.debrief,
        keyEvidence: [
          ...fixtureCaseJson.debrief.keyEvidence,
          {
            ref: { kind: 'finding', id: 'fixture-occlusion' },
            stepIds: ['identify-location'],
            why: 'The finding supports localisation.',
          },
        ],
      },
    })
    render(
      <ContentContext.Provider value={registry}>
        <CaseResults
          caseDoc={caseWithFindingEvidence}
          caseLab={registry.appConfig.caseLab!}
          result={result([])}
          clues={caseWithFindingEvidence.clues}
          clueReview={clueReview}
          starThresholds={{ one: 0, two: 75, three: 90 }}
          onCompare={vi.fn()}
          onContinue={vi.fn()}
          onReplay={vi.fn()}
        />
      </ContentContext.Provider>,
    )

    await user.click(screen.getAllByRole('button', { name: 'Review' })[1]!)
    expect(screen.getByRole('dialog', { name: 'Configured lumen finding' })).toHaveTextContent(
      'A deterministic generic lumen overlay.',
    )
  })

  it('links each evidence card to its comparison row anchor', async () => {
    const user = userEvent.setup()
    const onCompare = vi.fn()
    render(
      <ContentContext.Provider value={registry}>
        <CaseResults
          caseDoc={caseDoc}
          caseLab={registry.appConfig.caseLab!}
          result={result([])}
          clues={caseDoc.clues}
          clueReview={clueReview}
          starThresholds={{ one: 0, two: 75, three: 90 }}
          onCompare={onCompare}
          onContinue={vi.fn()}
          onReplay={vi.fn()}
        />
      </ContentContext.Provider>,
    )

    await user.click(screen.getByRole('button', { name: 'See expert comparison' }))
    expect(onCompare).toHaveBeenCalledWith('expert-evidence-0')

    await user.click(
      screen.getByRole('button', { name: 'Which configured location is highlighted?' }),
    )
    expect(onCompare).toHaveBeenCalledWith('expert-step-0')
  })
})
