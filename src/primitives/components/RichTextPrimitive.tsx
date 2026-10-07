import { Fragment, useEffect, useMemo, useState } from 'react'

import type { RichTextPrimitive as RichTextPrimitiveConfig } from '@/content/schema/primitives'
import { useAssetUrl } from '@/content/useAssetUrl'
import { tokenizeRichText } from '@/primitives/richTextTokenizer'
import { usePresentation } from '@/primitives/presentation/PresentationContext'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function RichTextPrimitive({
  primitive,
  onComplete,
  onInteract,
}: PrimitiveComponentProps<RichTextPrimitiveConfig>) {
  const { labels } = usePresentation()
  const imageUrl = useAssetUrl(primitive.content.imageAssetId)
  const [activeDefinition, setActiveDefinition] = useState<{
    term: string
    definition: string
  } | null>(null)
  const tokens = useMemo(
    () =>
      tokenizeRichText(primitive.content.body, primitive.content.terms, primitive.content.emphasis),
    [primitive.content.body, primitive.content.emphasis, primitive.content.terms],
  )

  useEffect(onComplete, [onComplete])

  return (
    <article className="space-y-5">
      {primitive.content.heading ? (
        <h2 className="text-title font-bold text-neutral-950">{primitive.content.heading}</h2>
      ) : null}
      {imageUrl ? (
        <img className="max-h-72 w-full rounded-lg object-cover" src={imageUrl} alt="" />
      ) : null}
      <p className="text-body text-neutral-700">
        {tokens.map((token, index) => (
          <Fragment key={`${token.type}-${index}`}>
            {token.type === 'term' ? (
              <button
                type="button"
                className="rounded-sm font-semibold text-brand-800 underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                aria-expanded={activeDefinition?.term === token.text}
                onClick={() => {
                  setActiveDefinition({ term: token.text, definition: token.definition })
                  onInteract({ name: 'term_opened', key: token.text.toLocaleLowerCase() })
                }}
              >
                {token.text}
              </button>
            ) : token.type === 'emphasis' ? (
              <strong className="font-semibold text-neutral-950">{token.text}</strong>
            ) : (
              token.text
            )}
          </Fragment>
        ))}
      </p>
      {activeDefinition ? (
        <aside
          className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-small"
          aria-live="polite"
        >
          <p className="font-semibold text-neutral-950">{activeDefinition.term}</p>
          <p className="mt-1 text-neutral-700">{activeDefinition.definition}</p>
        </aside>
      ) : null}
      {primitive.content.bullets?.length ? (
        <ul className="list-disc space-y-2 pl-6 text-neutral-700">
          {primitive.content.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {primitive.content.keyTakeaway ? (
        <aside className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <p className="text-small font-semibold text-brand-900">{labels.keyTakeaway}</p>
          <p className="mt-1 text-neutral-800">{primitive.content.keyTakeaway}</p>
        </aside>
      ) : null}
    </article>
  )
}
