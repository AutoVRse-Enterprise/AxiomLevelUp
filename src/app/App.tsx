import { RouterProvider } from 'react-router'

import { router } from '@/app/router'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}
