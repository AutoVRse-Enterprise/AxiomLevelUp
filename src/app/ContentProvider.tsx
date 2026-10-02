import { type ReactNode, useEffect, useState } from 'react'

import { ContentContext } from '@/app/contentContext'
import { ContentErrorScreen } from '@/components/feedback/ContentErrorScreen'
import { LoadingState } from '@/components/ui'
import { loadContent, type ContentRegistry } from '@/content/loader'
import { OfflineReconciler } from '@/offline/OfflineReconciler'

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
      <main className="mx-auto max-w-3xl p-5 sm:p-8">
        <LoadingState
          message="Validating courses, activities and scientific assets."
          title="Loading learning content"
        />
      </main>
    )
  }

  return (
    <ContentContext value={registry}>
      <OfflineReconciler />
      {children}
    </ContentContext>
  )
}
