import { type ReactNode, useEffect, useState } from 'react'

import { ContentContext } from '@/app/contentContext'
import { ContentErrorScreen } from '@/components/feedback/ContentErrorScreen'
import { LoadingState } from '@/components/ui'
import type { ContentRegistry } from '@/content/loader'
import { loadRuntimeContent } from '@/content/runtime'
import { OfflineReconciler } from '@/offline/OfflineReconciler'
import type { ExperienceShellCopy } from '@/app/experienceShell'

export function ContentProvider({
  children,
  baseUrl = '/content',
  copy,
}: {
  children: ReactNode
  baseUrl?: string
  copy?: Pick<ExperienceShellCopy, 'contentLoading' | 'contentError'>
}) {
  const [registry, setRegistry] = useState<ContentRegistry | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true
    void loadRuntimeContent(baseUrl)
      .then((content) => {
        if (active) setRegistry(content)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason : new Error(String(reason)))
      })

    return () => {
      active = false
    }
  }, [baseUrl])

  if (error) return <ContentErrorScreen error={error} copy={copy?.contentError} />
  if (!registry) {
    return (
      <main className="mx-auto max-w-3xl p-5 sm:p-8">
        <LoadingState
          message={
            copy?.contentLoading.message ?? 'Validating courses, activities and scientific assets.'
          }
          title={copy?.contentLoading.title ?? 'Loading learning content'}
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
