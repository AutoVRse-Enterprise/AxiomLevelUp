import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { ScenarioPrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'
import {
  isScenarioPath,
  scenarioEngine,
  traceScenarioPath,
} from '@/primitives/definitions/scenarioEngine'

export const scenarioDefinition = definePrimitive<ScenarioPrimitive>({
  type: 'scenario',
  family: 'domain',
  label: 'Scenario',
  layout: 'split',
  timerCompatible: timerCompatibleTypeSet.has('scenario'),
  scored: (primitive) =>
    primitive.content.nodes.some(
      (node) =>
        node.type === 'decision' && node.choices.some((choice) => choice.score !== undefined),
    ),
  evaluate: (primitive, response) => {
    if (!isScenarioPath(response)) {
      return { score: 0, correct: false, explanation: null }
    }
    const traced = traceScenarioPath(primitive.content, response)
    if (!traced.valid) {
      return { score: 0, correct: false, explanation: null }
    }
    const outcome = primitive.content.nodes.find(
      (node): node is Extract<(typeof primitive.content.nodes)[number], { type: 'outcome' }> =>
        node.id === traced.state.current && node.type === 'outcome',
    )
    const items: Record<string, 'correct' | 'incorrect' | 'missed'> = {}
    for (const { decision, choice } of traced.details) {
      const scoredChoices = decision.choices.filter((candidate) => candidate.score !== undefined)
      if (scoredChoices.length === 0) continue
      const bestScore = Math.max(...scoredChoices.map((candidate) => candidate.score ?? 0))
      for (const candidate of scoredChoices) {
        const key = `${decision.id}:${candidate.id}`
        if (candidate.id === choice.id) {
          items[key] = candidate.score === bestScore ? 'correct' : 'incorrect'
        } else if (candidate.score === bestScore) {
          items[key] = 'missed'
        }
      }
    }

    const score = scenarioEngine.pathScore(primitive.content, response)
    return {
      score,
      correct: score === 1,
      explanation: outcome?.result ?? null,
      items,
    }
  },
  reviewPrompt: (primitive) => {
    const firstDecision = primitive.content.nodes.find((node) => node.type === 'decision')
    return firstDecision?.prompt ?? 'Scenario'
  },
})
