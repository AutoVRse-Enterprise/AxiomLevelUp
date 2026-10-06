import { Suspense, type ReactNode } from 'react'

import { LoadingState } from '@/components/ui'
import type { ExperienceShellCopy } from '@/app/experienceShell'

export function createLazyPage(copy: ExperienceShellCopy['routeLoading']) {
  return function lazyPage(page: ReactNode) {
    return (
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-3xl p-5 sm:p-8">
            <LoadingState message={copy.message} title={copy.title} />
          </div>
        }
      >
        {page}
      </Suspense>
    )
  }
}
