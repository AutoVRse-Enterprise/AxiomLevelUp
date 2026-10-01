import { ExternalLink, FileText } from 'lucide-react'
import { useEffect } from 'react'

import type { PdfReferencePrimitive as PdfReferencePrimitiveConfig } from '@/content/schema/primitives'
import { useAssetUrl } from '@/content/useAssetUrl'
import type { PrimitiveComponentProps } from '@/primitives/types'

export function PdfReferencePrimitive({
  primitive,
  onComplete,
  onInteract,
}: PrimitiveComponentProps<PdfReferencePrimitiveConfig>) {
  const documentUrl = useAssetUrl(primitive.content.assetId)
  const coverUrl = useAssetUrl(primitive.content.coverAssetId)
  const href = documentUrl
    ? `${documentUrl}${primitive.content.page ? `#page=${primitive.content.page}` : ''}`
    : undefined

  useEffect(onComplete, [onComplete])

  return (
    <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {coverUrl ? <img className="max-h-56 w-full object-cover" src={coverUrl} alt="" /> : null}
      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
          <div>
            <cite className="not-italic font-semibold text-neutral-950">
              {primitive.content.citation}
            </cite>
            <p className="mt-2 text-small text-neutral-700">{primitive.content.summary}</p>
          </div>
        </div>
        {href ? (
          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onInteract({ name: 'pdf_opened', key: 'opened' })}
          >
            {primitive.content.linkLabel}
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        ) : (
          <p className="text-small text-neutral-600" role="status">
            Reference unavailable
          </p>
        )}
      </div>
    </article>
  )
}
