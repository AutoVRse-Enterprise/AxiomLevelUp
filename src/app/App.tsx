import { RouterProvider } from 'react-router'

import { ContentProvider } from '@/app/ContentProvider'
import { router } from '@/app/router'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { LearnerStateProvider } from '@/state/LearnerStateProvider'

export function App() {
  return (
    <ErrorBoundary>
      <ContentProvider>
        <LearnerStateProvider>
          <RouterProvider router={router} />
        </LearnerStateProvider>
      </ContentProvider>
    </ErrorBoundary>
  )
}
