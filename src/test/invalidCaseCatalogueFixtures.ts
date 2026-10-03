import caseFixture from '../../public/content/fixtures/case.json'

type MutableCaseFixture = {
  entry: { mode: string; markerStructureId?: string }
  clues: Array<Record<string, unknown>>
  stages: Array<{
    steps: Array<Record<string, unknown>>
  }>
  expertBenchmark: {
    stepTimings: Record<string, unknown>
    breakdown: { anatomy: number; diagnosis: number; speed: number }
  }
}

const cloneFixture = () => structuredClone(caseFixture) as unknown as MutableCaseFixture

export function emptyStageFixture() {
  const fixture = cloneFixture()
  fixture.stages[0]!.steps = []
  return fixture
}

export function unconsumedEntryFixture() {
  const fixture = cloneFixture()
  fixture.entry.markerStructureId = 'root-region'
  return fixture
}

export function unreferencedClueFixture() {
  const fixture = cloneFixture()
  const clue = structuredClone(fixture.clues[0]!)
  clue.id = 'unused-clue'
  const primitive = clue.primitive as Record<string, unknown>
  primitive.id = 'unused-clue-content'
  fixture.clues.push(clue)
  return fixture
}

export function incompleteBenchmarkTimingFixture() {
  const fixture = cloneFixture()
  delete fixture.expertBenchmark.stepTimings['select-conclusion']
  return fixture
}

export function mismatchedBenchmarkFixture() {
  const fixture = cloneFixture()
  fixture.expertBenchmark.breakdown.anatomy = 0.25
  return fixture
}
