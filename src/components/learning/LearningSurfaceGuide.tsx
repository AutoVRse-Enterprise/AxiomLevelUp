import type { CaseLabConfig } from '@/content/schema'

const surfaces = [
  ['pathway', 'Pathway'],
  ['course', 'Course'],
  ['caseLab', 'Case Lab'],
  ['dailyChallenge', 'Daily challenge'],
] as const

export function LearningSurfaceGuide({
  definitions,
}: {
  definitions: CaseLabConfig['surfaceDefinitions']
}) {
  return (
    <section aria-labelledby="learning-formats-heading">
      <h2 className="text-heading font-bold" id="learning-formats-heading">
        Choose the right learning format
      </h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {surfaces.map(([id, label]) => (
          <div className="rounded-lg border border-neutral-200 bg-white p-4" key={id}>
            <dt className="font-semibold text-neutral-950">{label}</dt>
            <dd className="mt-1 text-small text-neutral-600">{definitions[id]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
