import type {
  ScenarioChoice,
  ScenarioContent,
  ScenarioDecisionNode,
  ScenarioNode,
} from '@/content/schema/primitives'

export interface ScenarioPathEntry {
  nodeId: string
  choiceId: string
}

export interface ScenarioState {
  current: string
  path: ScenarioPathEntry[]
  revealed: boolean
}

export interface ScenarioPathDetail extends ScenarioPathEntry {
  decision: ScenarioDecisionNode
  choice: ScenarioChoice
}

const getNode = (content: ScenarioContent, nodeId: string) =>
  content.nodes.find((node) => node.id === nodeId)

export function isScenarioPath(value: unknown): value is ScenarioPathEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as ScenarioPathEntry).nodeId === 'string' &&
        typeof (entry as ScenarioPathEntry).choiceId === 'string',
    )
  )
}

function start(content: ScenarioContent): ScenarioState {
  return {
    current: content.startNodeId,
    path: [],
    revealed: false,
  }
}

function choose(content: ScenarioContent, state: ScenarioState, choiceId: string): ScenarioState {
  const node = getNode(content, state.current)
  if (state.revealed || node?.type !== 'decision') return state
  if (!node.choices.some((choice) => choice.id === choiceId)) return state

  return {
    current: state.current,
    path: [...state.path, { nodeId: node.id, choiceId }],
    revealed: true,
  }
}

function selectedChoice(content: ScenarioContent, state: ScenarioState) {
  const entry = state.path.at(-1)
  const node = getNode(content, state.current)
  if (!entry || node?.type !== 'decision' || entry.nodeId !== node.id) return undefined
  return node.choices.find((choice) => choice.id === entry.choiceId)
}

function advance(content: ScenarioContent, state: ScenarioState): ScenarioState {
  const node = getNode(content, state.current)
  const next =
    node?.type === 'context'
      ? node.next
      : node?.type === 'decision' && state.revealed
        ? selectedChoice(content, state)?.next
        : undefined
  if (!next) return state

  return {
    current: next,
    path: state.path,
    revealed: false,
  }
}

function isComplete(content: ScenarioContent, state: ScenarioState): boolean {
  return getNode(content, state.current)?.type === 'outcome'
}

export function traceScenarioPath(
  content: ScenarioContent,
  path: readonly ScenarioPathEntry[],
): { details: ScenarioPathDetail[]; state: ScenarioState; valid: boolean } {
  let state = start(content)
  const details: ScenarioPathDetail[] = []
  const stepThroughContexts = () => {
    let guard = content.nodes.length + 1
    while (getNode(content, state.current)?.type === 'context' && guard > 0) {
      const next = advance(content, state)
      if (next === state) break
      state = next
      guard -= 1
    }
  }

  stepThroughContexts()
  for (const entry of path) {
    const node = getNode(content, state.current)
    if (node?.type !== 'decision' || node.id !== entry.nodeId) {
      return { details, state, valid: false }
    }
    const choice = node.choices.find(({ id }) => id === entry.choiceId)
    if (!choice) return { details, state, valid: false }
    details.push({ ...entry, decision: node, choice })
    const chosen = choose(content, state, choice.id)
    state = advance(content, chosen)
    stepThroughContexts()
  }

  return { details, state, valid: isComplete(content, state) }
}

function pathScore(content: ScenarioContent, path: readonly ScenarioPathEntry[]): number {
  const traced = traceScenarioPath(content, path)
  if (!traced.valid) return 0
  const scores = traced.details.flatMap(({ choice }) =>
    choice.score === undefined ? [] : [choice.score],
  )
  return scores.length === 0 ? 0 : scores.reduce((total, score) => total + score, 0) / scores.length
}

export const scenarioEngine = {
  start,
  choose,
  advance,
  isComplete,
  pathScore,
}

export function getScenarioNode(
  content: ScenarioContent,
  state: ScenarioState,
): ScenarioNode | undefined {
  return getNode(content, state.current)
}

export function restoreScenarioState(content: ScenarioContent, draft: unknown): ScenarioState {
  if (typeof draft !== 'object' || draft === null) return start(content)
  const candidate = draft as Partial<ScenarioState>
  if (
    typeof candidate.current !== 'string' ||
    typeof candidate.revealed !== 'boolean' ||
    !isScenarioPath(candidate.path)
  ) {
    return start(content)
  }

  const node = getNode(content, candidate.current)
  if (!node) return start(content)
  if (candidate.revealed) {
    const entry = candidate.path.at(-1)
    if (
      node.type !== 'decision' ||
      entry?.nodeId !== node.id ||
      !node.choices.some(({ id }) => id === entry.choiceId)
    ) {
      return start(content)
    }
  }
  return {
    current: candidate.current,
    path: candidate.path.map((entry) => ({ ...entry })),
    revealed: candidate.revealed,
  }
}
