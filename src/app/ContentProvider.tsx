import { type ReactNode, useEffect, useState } from 'react'

import { ContentContext } from '@/app/contentContext'
import { ContentErrorScreen } from '@/components/feedback/ContentErrorScreen'
import { Skeleton } from '@/components/ui'
import { loadContent, type ContentRegistry } from '@/content/loader'

export function ContentProvider({ children }: { children: ReactNode }) {
  const [registry, setRegistry] = useState<ContentRegistry | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true
    void loadContent()
      .then((content) => {
        if (active) setRegistry(content)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason : new Error(String(reason)))
      })

    return () => {
      active = false
    }
  }, [])

  if (error) return <ContentErrorScreen error={error} />
  if (!registry) {
    return (
      <main className="mx-auto max-w-3xl space-y-5 p-5 sm:p-8">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-44 w-full" />
        <span className="sr-only" role="status">
          Loading course content
        </span>
      </main>
    )
  }

  return <ContentContext value={registry}>{children}</ContentContext>
}
