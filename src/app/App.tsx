import { RouterProvider } from 'react-router'

import { ContentProvider } from '@/app/ContentProvider'
import { router } from '@/app/router'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { PresentationAnnouncer } from '@/components/feedback/PresentationAnnouncer'
import { MotionProvider } from '@/design/motion'
import { LearnerStateProvider } from '@/state/LearnerStateProvider'

export function App() {
  return (
    <ErrorBoundary>
      <MotionProvider>
        <PresentationAnnouncer />
        <ContentProvider>
          <LearnerStateProvider>
            <RouterProvider router={router} />
          </LearnerStateProvider>
        </ContentProvider>
      </MotionProvider>
    </ErrorBoundary>
  )
}
