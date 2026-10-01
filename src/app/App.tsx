import { RouterProvider } from 'react-router'

import { ContentProvider } from '@/app/ContentProvider'
import { router } from '@/app/router'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

export function App() {
  return (
    <ErrorBoundary>
      <ContentProvider>
        <RouterProvider router={router} />
      </ContentProvider>
    </ErrorBoundary>
  )
}
