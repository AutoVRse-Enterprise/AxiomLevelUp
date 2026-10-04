import { useState } from 'react'

import { Button } from '@/components/ui'
import type {
  ScenarioContextNode,
  ScenarioDecisionNode,
  ScenarioPrimitive as ScenarioPrimitiveConfig,
} from '@/content/schema/primitives'
import { useAsset } from '@/content/useAssetUrl'
import { StepActionSlot } from '@/player/StepActionSlot'
import {
  getScenarioNode,
  isScenarioPath,
  restoreScenarioState,
  scenarioEngine,
  traceScenarioPath,
  type ScenarioPathDetail,
  type ScenarioState,
} from '@/primitives/definitions/scenarioEngine'
import type { PrimitiveComponentProps } from '@/primitives/types'

function ContextPanel({ context }: { context?: ScenarioContextNode }) {
  const asset = useAsset(context?.asset?.assetId)

  return (
    <aside className="space-y-4 rounded-xl bg-neutral-50 p-5">
      <p className="text-caption font-bold tracking-wide text-neutral-600 uppercase">
        Scenario context
      </p>
      {context ? <p className="text-neutral-800">{context.body}</p> : null}
      {context?.asset && asset ? (
        <figure className="space-y-2">
          <img
            className="w-full rounded-lg"
            src={asset.path}
            alt={context.asset.alt}
            width={asset.width}
            height={asset.height}
          />
          {context.asset.caption ? (
            <figcaption className="text-small text-neutral-600">{context.asset.caption}</figcaption>
          ) : null}
        </figure>
      ) : null}
    </aside>
  )
}

function bestChoiceIds(decision: ScenarioDecisionNode) {
  const scored = decision.choices.filter((choice) => choice.score !== undefined)
  if (scored.length === 0) return new Set<string>()
  const bestScore = Math.max(...scored.map((choice) => choice.score ?? 0))
  return new Set(scored.filter((choice) => choice.score === bestScore).map((choice) => choice.id))
}

function PathRecap({
  details,
  revealBest,
}: {
  details: readonly ScenarioPathDetail[]
  revealBest: boolean
}) {
  return (
    <ol className="space-y-4">
      {details.map(({ decision, choice }, index) => {
        const best = bestChoiceIds(decision)
        return (
          <li key={decision.id} className="rounded-lg border border-neutral-200 p-4">
            <p className="text-caption font-bold text-brand-700">Decision {index + 1}</p>
            <p className="mt-1 font-semibold text-neutral-950">{decision.prompt}</p>
            <p className="mt-2 text-neutral-800">You chose: {choice.label}</p>
            <p className="mt-1 text-small text-neutral-600">{choice.consequence}</p>
            {choice.quality ? (
              <p className="mt-2 text-small font-semibold text-neutral-700">{choice.quality}</p>
            ) : null}
            {revealBest && best.size > 0 ? (
              <p className="mt-2 text-small text-success-700">
                Best choice:{' '}
                {decision.choices
                  .filter(({ id }) => best.has(id))
                  .map(({ label }) => label)
                  .join(' or ')}
              </p>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function latestContext(
  primitive: ScenarioPrimitiveConfig,
  state: ScenarioState,
): ScenarioContextNode | undefined {
  let nodeId = primitive.content.startNodeId
  let pathIndex = 0
  let latest: ScenarioContextNode | undefined
  let guard = primitive.content.nodes.length + 1

  while (guard > 0) {
    const node = primitive.content.nodes.find((candidate) => candidate.id === nodeId)
    if (!node) break
    if (node.type === 'context') {
      latest = node
      if (node.id === state.current) break
      nodeId = node.next
    } else if (node.type === 'decision') {
      if (node.id === state.current) break
      const entry = state.path[pathIndex]
      const choice =
        entry?.nodeId === node.id ? node.choices.find(({ id }) => id === entry.choiceId) : undefined
      if (!choice) break
      pathIndex += 1
      nodeId = choice.next
    } else {
      break
    }
    guard -= 1
  }

  return latest
}

export function ScenarioPrimitive({
  primitive,
  mode,
  review,
  draft,
  disabled,
  onInteract,
  onDraftChange,
  onSubmit,
}: PrimitiveComponentProps<ScenarioPrimitiveConfig>) {
  const [state, setState] = useState(() => restoreScenarioState(primitive.content, draft))
  const node = getScenarioNode(primitive.content, state)

  if (mode === 'review') {
    const response = isScenarioPath(review?.response) ? review.response : []
    const traced = traceScenarioPath(primitive.content, response)
    const outcome = getScenarioNode(primitive.content, traced.state)
    return (
      <>
        <ContextPanel context={latestContext(primitive, scenarioEngine.start(primitive.content))} />
        <section className="space-y-5" aria-label="Scenario review">
          <h2 className="text-title font-bold text-neutral-950">Your decision path</h2>
          <PathRecap details={traced.details} revealBest />
          {outcome?.type === 'outcome' ? (
            <div className="rounded-xl bg-brand-50 p-5">
              <h3 className="font-bold text-neutral-950">{outcome.title}</h3>
              <p className="mt-2 text-neutral-800">{outcome.body}</p>
              <p className="mt-3 font-semibold text-brand-800">{outcome.result}</p>
            </div>
          ) : null}
        </section>
      </>
    )
  }

  const updateState = (next: ScenarioState) => {
    setState(next)
    onDraftChange(next)
  }

  return (
    <>
      <ContextPanel context={latestContext(primitive, state)} />
      <section className="space-y-5">
        {node?.type === 'context' ? (
          <>
            <h2 className="text-title font-bold text-neutral-950">Review the information</h2>
            <p className="text-neutral-700">
              Continue when you are ready to make the next decision.
            </p>
            <StepActionSlot>
              <Button
                disabled={disabled}
                onClick={() => {
                  const next = scenarioEngine.advance(primitive.content, state)
                  updateState(next)
                  onInteract({ name: 'scenario_advanced', key: node.id })
                }}
              >
                Continue
              </Button>
            </StepActionSlot>
          </>
        ) : null}

        {node?.type === 'decision' ? (
          <>
            <p className="text-caption font-bold text-brand-700">
              Decision {state.revealed ? state.path.length : state.path.length + 1}
            </p>
            <fieldset className="space-y-3" disabled={disabled || state.revealed}>
              <legend className="text-title font-bold text-neutral-950">{node.prompt}</legend>
              {node.choices.map((choice) => {
                const selected =
                  state.revealed &&
                  state.path.at(-1)?.nodeId === node.id &&
                  state.path.at(-1)?.choiceId === choice.id
                return (
                  <button
                    key={choice.id}
                    type="button"
                    className={`block min-h-12 w-full rounded-lg border p-4 text-left font-medium ${
                      selected
                        ? 'border-brand-600 bg-brand-50 text-brand-900'
                        : 'border-neutral-300 bg-white text-neutral-800 hover:border-brand-400'
                    } disabled:cursor-default`}
                    disabled={disabled || state.revealed}
                    aria-pressed={selected}
                    onClick={() => {
                      const decisionIndex = state.path.length + 1
                      const next = scenarioEngine.choose(primitive.content, state, choice.id)
                      updateState(next)
                      onInteract({
                        name: 'scenario_decision',
                        nodeId: node.id,
                        choiceId: choice.id,
                        decisionIndex,
                      })
                    }}
                  >
                    {choice.label}
                  </button>
                )
              })}
            </fieldset>
            {state.revealed ? (
              <div className="space-y-4 rounded-xl bg-brand-50 p-5">
                <p className="font-semibold text-neutral-950" aria-live="polite" role="status">
                  {node.choices.find(({ id }) => id === state.path.at(-1)?.choiceId)?.consequence}
                </p>
                <StepActionSlot>
                  <Button
                    disabled={disabled}
                    onClick={() => {
                      const next = scenarioEngine.advance(primitive.content, state)
                      updateState(next)
                      onInteract({ name: 'scenario_consequence_continued', key: node.id })
                    }}
                  >
                    Continue
                  </Button>
                </StepActionSlot>
              </div>
            ) : null}
          </>
        ) : null}

        {node?.type === 'outcome' ? (
          <>
            <div className="rounded-xl bg-brand-50 p-5">
              <p className="text-caption font-bold tracking-wide text-brand-700 uppercase">
                Outcome
              </p>
              <h2 className="mt-1 text-title font-bold text-neutral-950">{node.title}</h2>
              <p className="mt-2 text-neutral-800">{node.body}</p>
              <p className="mt-3 font-semibold text-brand-800">{node.result}</p>
            </div>
            <div>
              <h3 className="mb-3 font-bold text-neutral-950">Your decision path</h3>
              <PathRecap
                details={traceScenarioPath(primitive.content, state.path).details}
                revealBest={false}
              />
            </div>
            <StepActionSlot>
              <Button disabled={disabled} onClick={() => onSubmit(state.path)}>
                Complete scenario
              </Button>
            </StepActionSlot>
          </>
        ) : null}
      </section>
    </>
  )
}
