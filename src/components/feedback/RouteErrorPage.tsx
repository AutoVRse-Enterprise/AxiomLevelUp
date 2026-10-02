import { isRouteErrorResponse, useRouteError } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'An unexpected route error occurred.'

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <ErrorState
        title="This screen could not load"
        message={message}
        actionLabel="Return home"
        onAction={() => window.location.assign('/')}
        secondaryActionLabel="Reload"
        onSecondaryAction={() => window.location.reload()}
      />
    </main>
  )
}
