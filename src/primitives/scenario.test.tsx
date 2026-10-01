import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { ContentContext } from '@/app/contentContext'
import { validateContentBundle } from '@/content/loader'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  scenarioPrimitiveSchema,
  validateScenarioGraph,
  type ScenarioContent,
  type ScenarioPrimitive,
} from '@/content/schema/primitives'
import { evaluatePrimitive } from '@/primitives/definitions'
import { scenarioDefinition } from '@/primitives/definitions/scenario'
import {
  scenarioEngine,
  traceScenarioPath,
  type ScenarioPathEntry,
} from '@/primitives/definitions/scenarioEngine'
import { PrimitiveRenderer } from '@/primitives/registry'
import { makeValidContentBundle } from '@/test/contentFixtures'

const content: ScenarioContent = {
  startNodeId: 'context',
  nodes: [
    { id: 'context', type: 'context', body: 'Review the evidence.', next: 'first' },
    {
      id: 'first',
      type: 'decision',
      prompt: 'Choose the first action.',
      choices: [
        {
          id: 'best-first',
          label: 'Verify the evidence',
          consequence: 'The evidence is reliable.',
          next: 'update',
          score: 1,
          quality: 'Best',
        },
        {
          id: 'weak-first',
          label: 'Assume it is reliable',
          consequence: 'Uncertainty remains.',
          next: 'update',
          score: 0,
        },
      ],
    },
    { id: 'update', type: 'context', body: 'New evidence arrives.', next: 'second' },
    {
      id: 'second',
      type: 'decision',
      prompt: 'Choose the final action.',
      choices: [
        {
          id: 'best-second',
          label: 'Integrate the evidence',
          consequence: 'The conclusion is supported.',
          next: 'outcome',
          score: 1,
        },
        {
          id: 'weak-second',
          label: 'Ignore the update',
          consequence: 'The conclusion is incomplete.',
          next: 'outcome',
          score: 0.5,
        },
      ],
    },
    {
      id: 'outcome',
      type: 'outcome',
      title: 'Case complete',
      body: 'The decision sequence is complete.',
      result: 'Evidence was integrated.',
    },
  ],
}

const primitive: ScenarioPrimitive = scenarioPrimitiveSchema.parse({
  id: 'scenario-fixture',
  type: 'scenario',
  content,
  completion: { mode: 'outcome' },
})

const handlers = () => ({
  onInteract: vi.fn(),
  onDraftChange: vi.fn(),
  onSubmit: vi.fn(),
  onComplete: vi.fn(),
})

const registry = validateContentBundle(makeValidContentBundle())

function renderScenario(element: ReactNode) {
  return render(<ContentContext.Provider value={registry}>{element}</ContentContext.Provider>)
}

describe('scenario graph validation', () => {
  it('accepts a converging graph and warns only for paths outside two to four decisions', () => {
    expect(validateScenarioGraph(content)).toEqual({ issues: [], warnings: [] })

    const warning = validateScenarioGraph({
      startNodeId: 'only',
      nodes: [
        {
          id: 'only',
          type: 'decision',
          prompt: 'One decision',
          choices: [
            { id: 'a', label: 'A', consequence: 'A', next: 'done' },
            { id: 'b', label: 'B', consequence: 'B', next: 'done' },
          ],
        },
        { id: 'done', type: 'outcome', title: 'Done', body: 'Done', result: 'Done' },
      ],
    })

    expect(warning.issues).toEqual([])
    expect(warning.warnings).toEqual([
      expect.objectContaining({ message: expect.stringContaining('1 decision points') }),
      expect.objectContaining({ message: expect.stringContaining('1 decision points') }),
    ])
  })

  it('reports duplicate IDs, missing starts, unresolved transitions, cycles and unreachable nodes', () => {
    const result = validateScenarioGraph({
      startNodeId: 'missing',
      nodes: [
        { id: 'loop', type: 'context', body: 'Loop', next: 'loop' },
        { id: 'loop', type: 'outcome', title: 'Duplicate', body: 'Duplicate', result: 'Duplicate' },
        { id: 'orphan', type: 'outcome', title: 'Orphan', body: 'Orphan', result: 'Orphan' },
        { id: 'broken', type: 'context', body: 'Broken', next: 'nowhere' },
      ],
    })

    expect(result.issues.map(({ message }) => message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('must be unique'),
        expect.stringContaining('does not exist'),
        expect.stringContaining('unreachable'),
      ]),
    )

    const cycle = validateScenarioGraph({
      startNodeId: 'loop',
      nodes: [{ id: 'loop', type: 'context', body: 'Loop', next: 'loop' }],
    })
    expect(cycle.issues).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('acyclic') }),
    )
  })
})

describe('scenario engine and evaluation', () => {
  it('starts, chooses, advances, completes and averages only authored choice scores', () => {
    let state = scenarioEngine.start(content)
    state = scenarioEngine.advance(content, state)
    state = scenarioEngine.choose(content, state, 'weak-first')
    expect(state.revealed).toBe(true)
    expect(scenarioEngine.choose(content, state, 'best-first')).toBe(state)
    state = scenarioEngine.advance(content, state)
    state = scenarioEngine.advance(content, state)
    state = scenarioEngine.choose(content, state, 'best-second')
    state = scenarioEngine.advance(content, state)

    expect(scenarioEngine.isComplete(content, state)).toBe(true)
    expect(scenarioEngine.pathScore(content, state.path)).toBe(0.5)
    expect(traceScenarioPath(content, state.path).valid).toBe(true)
    expect(evaluatePrimitive(primitive, state.path)).toMatchObject({
      score: 0.5,
      correct: false,
      explanation: 'Evidence was integrated.',
    })
  })

  it('is scored only when at least one choice has an authored score', () => {
    expect(scenarioDefinition.scored(primitive)).toBe(true)
    const unscored = scenarioPrimitiveSchema.parse({
      ...primitive,
      id: 'unscored-scenario',
      content: {
        ...content,
        nodes: content.nodes.map((node) =>
          node.type === 'decision'
            ? {
                ...node,
                choices: node.choices.map((choice) => ({
                  id: choice.id,
                  label: choice.label,
                  consequence: choice.consequence,
                  next: choice.next,
                  quality: choice.quality,
                })),
              }
            : node,
        ),
      },
    })
    expect(scenarioDefinition.scored(unscored)).toBe(false)
  })
})

describe('scenario component', () => {
  it('locks decisions, announces consequences, persists state and submits the completed path', async () => {
    const user = userEvent.setup()
    const callbacks = handlers()
    renderScenario(
      <PrimitiveRenderer
        primitive={primitive}
        attempt={0}
        mode="interactive"
        draft={null}
        {...callbacks}
      />,
    )

    await user.click(await screen.findByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Decision 1')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Verify the evidence' }))
    expect(screen.getByRole('status')).toHaveTextContent('The evidence is reliable.')
    expect(screen.getByRole('button', { name: 'Assume it is reliable' })).toBeDisabled()
    expect(callbacks.onInteract).toHaveBeenCalledWith({
      name: 'scenario_decision',
      nodeId: 'first',
      choiceId: 'best-first',
      decisionIndex: 1,
    })

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Integrate the evidence' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('heading', { name: 'Case complete' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Complete scenario' }))

    const expectedPath: ScenarioPathEntry[] = [
      { nodeId: 'first', choiceId: 'best-first' },
      { nodeId: 'second', choiceId: 'best-second' },
    ]
    expect(callbacks.onSubmit).toHaveBeenCalledWith(expectedPath)
    expect(callbacks.onDraftChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ current: 'outcome', path: expectedPath, revealed: false }),
    )
  })

  it('reviews the selected path and reveals the best choices', async () => {
    renderScenario(
      <PrimitiveRenderer
        primitive={primitive}
        attempt={1}
        mode="review"
        review={{
          response: [
            { nodeId: 'first', choiceId: 'weak-first' },
            { nodeId: 'second', choiceId: 'weak-second' },
          ],
          evaluation: { score: 0.25, correct: false, explanation: null },
          revealAnswer: true,
        }}
        draft={null}
        disabled
        {...handlers()}
      />,
    )

    expect(await screen.findByRole('heading', { name: 'Your decision path' })).toBeVisible()
    expect(screen.getByText('You chose: Assume it is reliable')).toBeVisible()
    expect(screen.getByText('Best choice: Verify the evidence')).toBeVisible()
    expect(screen.getByText('Best choice: Integrate the evidence')).toBeVisible()
  })

  it('restores the current node, path and revealed consequence from a draft', async () => {
    renderScenario(
      <PrimitiveRenderer
        primitive={primitive}
        attempt={0}
        mode="interactive"
        draft={{
          current: 'first',
          path: [{ nodeId: 'first', choiceId: 'best-first' }],
          revealed: true,
        }}
        {...handlers()}
      />,
    )

    expect(await screen.findByRole('status')).toHaveTextContent('The evidence is reliable.')
    expect(screen.getByText('Decision 1')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Verify the evidence' })).toBeDisabled()
  })
})
