import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

import { useContent } from '@/app/contentContext'
import { CaseLabCard } from '@/components/learning/CaseLabCard'
import { LearningSurfaceGuide } from '@/components/learning/LearningSurfaceGuide'
import { Chip } from '@/components/ui'
import type { CaseDocument } from '@/content/schema'
import { useLearnerStore } from '@/state/learnerStore'
import { selectCaseLabCards, selectRecommendedCase } from '@/state/selectors'

const tiers: Array<{ id: CaseDocument['tier']; title: string; description: string }> = [
  {
    id: 'foundation',
    title: 'Foundation',
    description: 'Untimed guided practice with full hints and labelled essential clues.',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    description: 'Build fluency while a stopwatch tracks your reasoning pace.',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Reconstruct an unknown location and reason with reduced guidance.',
  },
]

export function CaseLabPage() {
  const registry = useContent()
  const caseProgress = useLearnerStore((state) => state.caseProgress)
  const caseAttempts = useLearnerStore((state) => state.caseAttempts)
  const state = { caseProgress, caseAttempts }
  const caseLab = registry.appConfig.caseLab

  if (!caseLab) return null

  const cases = selectCaseLabCards(state, registry).filter(({ daily }) => !daily)
  const dailyCases = selectCaseLabCards(state, registry).filter(({ daily }) => daily)
  const recommended = selectRecommendedCase(state, registry)
  const startCaseId = cases.find(({ tier }) => tier === 'foundation')?.caseId

  return (
    <div className="space-y-9">
      <Link className="inline-flex items-center gap-2 font-semibold text-brand-700" to="/learn">
        <ArrowLeft aria-hidden="true" size={17} /> Learn
      </Link>

      <header>
        <p className="text-small font-semibold text-brand-700">Case Lab</p>
        <h1 className="mt-2 text-display font-bold">{caseLab.title}</h1>
        <p className="mt-3 max-w-3xl text-neutral-600">{caseLab.surfaceDefinitions.caseLab}</p>
      </header>

      <LearningSurfaceGuide definitions={caseLab.surfaceDefinitions} />

      <div className="space-y-9">
        {tiers.map((tier) => {
          const tierCases = cases.filter(({ tier: caseTier }) => caseTier === tier.id)
          if (!tierCases.length) return null
          return (
            <section aria-labelledby={`case-tier-${tier.id}`} key={tier.id}>
              <div>
                <h2 className="text-heading font-bold" id={`case-tier-${tier.id}`}>
                  {tier.title}
                </h2>
                <p className="mt-1 text-small text-neutral-600">{tier.description}</p>
              </div>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                {tierCases.map((caseView) => (
                  <div className="space-y-2" key={caseView.caseId}>
                    <div className="flex flex-wrap gap-2">
                      {caseView.caseId === startCaseId ? <Chip>Start here</Chip> : null}
                      {caseView.caseId === recommended?.caseId ? (
                        <Chip tone="brand">Recommended next</Chip>
                      ) : null}
                    </div>
                    <CaseLabCard caseView={caseView} />
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {dailyCases.length ? (
        <section aria-labelledby="daily-case-heading">
          <h2 className="text-heading font-bold" id="daily-case-heading">
            Daily challenge
          </h2>
          <p className="mt-1 text-small text-neutral-600">
            {caseLab.surfaceDefinitions.dailyChallenge}
          </p>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {dailyCases.map((caseView) => (
              <CaseLabCard caseView={caseView} key={caseView.caseId} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
