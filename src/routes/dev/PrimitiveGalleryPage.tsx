import { RotateCcw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router'

import { ContentContext, useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button, Card, Chip } from '@/components/ui'
import type { Primitive } from '@/content/schema'
import type { TypedPrimitive } from '@/content/schema/primitives'
import { evaluatePrimitive, resolvePrimitiveDefinition } from '@/primitives/definitions'
import { PrimitiveRenderer } from '@/primitives/registry'
import { regionCenter } from '@/primitives/shared/imageRegionMath'
import type { PrimitiveInteraction } from '@/primitives/types'

type GalleryMode = 'interactive' | 'review'

function correctResponse(primitive: TypedPrimitive): unknown {
  switch (primitive.type) {
    case 'image_hotspot':
      if (primitive.content.mode !== 'assess') return undefined
      {
        const content = primitive.content
        return regionCenter(
          content.regions.find(({ id }) => content.targetRegionIds.includes(id)) ??
            content.regions[0]!,
        )
      }
    case 'multiple_choice':
      return primitive.content.correctOptionId
    case 'multiple_select':
      return primitive.content.correctOptionIds
    case 'true_false':
      return primitive.content.answer
    case 'classification':
      return Object.fromEntries(
        primitive.content.items.map(({ id, categoryId }) => [id, categoryId]),
      )
    case 'match_pairs':
      return Object.fromEntries(
        primitive.content.pairs.map(({ leftId, rightId }) => [leftId, rightId]),
      )
    case 'ordering':
      return primitive.content.items.map(({ id }) => id)
    case 'fill_blank':
      return Object.fromEntries(
        primitive.content.blanks.map(({ id, accepted }) => [id, accepted[0]]),
      )
    case 'numeric':
      return 'answer' in primitive.content
        ? String(primitive.content.answer)
        : String(primitive.content.range.min)
    case 'scenario':
      return primitive.content.nodes.flatMap((node) => {
        if (node.type !== 'decision') return []
        const scored = node.choices.filter(({ score }) => score !== undefined)
        const bestScore = Math.max(...scored.map(({ score }) => score ?? 0))
        const choice = scored.find(({ score }) => score === bestScore) ?? node.choices[0]
        return choice ? [{ nodeId: node.id, choiceId: choice.id }] : []
      })
    default:
      return undefined
  }
}

function PrimitiveGalleryCard({
  primitive,
  mode,
  disabled,
}: {
  primitive: Primitive
  mode: GalleryMode
  disabled: boolean
}) {
  const resolved = resolvePrimitiveDefinition(primitive)
  const [draft, setDraft] = useState<unknown>()
  const [activity, setActivity] = useState('Ready')
  const onInteract = useCallback((interaction: PrimitiveInteraction) => {
    setActivity(`Interaction: ${interaction.name}`)
  }, [])
  const onDraftChange = useCallback((next: unknown) => {
    setDraft(next)
    setActivity('Draft changed')
  }, [])
  const onSubmit = useCallback((response: unknown) => {
    setDraft(response)
    setActivity('Submitted locally')
  }, [])
  const onComplete = useCallback(() => {
    setActivity((current) => (current === 'Ready' ? 'Completed locally' : current))
  }, [])

  if (!resolved) return null

  const response = correctResponse(resolved.primitive)
  const evaluation = evaluatePrimitive(resolved.primitive, response)
  const family =
    typeof resolved.definition.family === 'function'
      ? resolved.definition.family(resolved.primitive)
      : resolved.definition.family

  return (
    <Card className="min-w-0">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-4">
        <div>
          <p className="font-mono text-caption text-neutral-500">{primitive.id}</p>
          <h2 className="mt-1 text-heading font-bold">{resolved.definition.label}</h2>
        </div>
        <div className="flex gap-2">
          <Chip>{family}</Chip>
          {primitive.timer ? <Chip tone="warning">Timed</Chip> : null}
        </div>
      </div>
      <PrimitiveRenderer
        key={`${mode}:${disabled}`}
        attempt={1}
        disabled={disabled}
        draft={draft}
        mode={mode}
        onComplete={onComplete}
        onDraftChange={onDraftChange}
        onInteract={onInteract}
        onSubmit={onSubmit}
        primitive={primitive}
        review={mode === 'review' ? { response, evaluation, revealAnswer: true } : undefined}
      />
      <p
        className="mt-5 border-t border-neutral-200 pt-3 text-caption text-neutral-500"
        role="status"
      >
        {activity}
      </p>
    </Card>
  )
}

export function PrimitiveGalleryPage() {
  const registry = useContent()
  const [mode, setMode] = useState<GalleryMode>('interactive')
  const [disabled, setDisabled] = useState(false)
  const [missingAssets, setMissingAssets] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const lesson = registry.courseById
    .get('runtime-showcase')
    ?.lessons.find(({ id }) => id === 'primitive-showcase')
  const previewRegistry = useMemo(
    () => (missingAssets ? { ...registry, assetById: new Map<string, never>() } : registry),
    [missingAssets, registry],
  )

  if (!lesson) {
    return (
      <EmptyState
        title="Primitive showcase unavailable"
        message="The internal runtime showcase lesson is not configured."
      />
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <Chip tone="warning">Local callback sandbox</Chip>
        <h1 className="mt-3 text-display font-bold">Primitive gallery</h1>
        <p className="mt-2 max-w-3xl text-neutral-600">
          Every primitive from the internal showcase is rendered here without learner events or
          progress mutations.
        </p>
        <Link
          className="mt-4 inline-flex font-semibold text-brand-700 underline-offset-4 hover:underline"
          to="/learn/courses/runtime-showcase/lessons/primitive-showcase"
        >
          Open the real showcase lesson
        </Link>
      </header>

      <Card>
        <div className="flex flex-wrap items-end gap-5">
          <fieldset>
            <legend className="text-small font-semibold text-neutral-700">Rendering mode</legend>
            <div className="mt-2 flex gap-4">
              {(['interactive', 'review'] as const).map((option) => (
                <label className="flex min-h-11 items-center gap-2" key={option}>
                  <input
                    checked={mode === option}
                    name="gallery-mode"
                    onChange={() => setMode(option)}
                    type="radio"
                  />
                  <span className="capitalize">{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex min-h-11 items-center gap-2">
            <input
              checked={disabled}
              onChange={(event) => setDisabled(event.target.checked)}
              type="checkbox"
            />
            Disable interaction
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input
              checked={missingAssets}
              onChange={(event) => setMissingAssets(event.target.checked)}
              type="checkbox"
            />
            Simulate missing assets
          </label>
          <Button
            leadingIcon={<RotateCcw aria-hidden="true" size={17} />}
            onClick={() => setResetKey((current) => current + 1)}
            size="sm"
            variant="secondary"
          >
            Reset local state
          </Button>
        </div>
      </Card>

      <ContentContext.Provider value={previewRegistry}>
        <div className="grid items-start gap-6 xl:grid-cols-2" key={resetKey}>
          {lesson.primitives.map((primitive) => (
            <PrimitiveGalleryCard
              disabled={disabled || mode === 'review'}
              key={primitive.id}
              mode={mode}
              primitive={primitive}
            />
          ))}
        </div>
      </ContentContext.Provider>
    </div>
  )
}
