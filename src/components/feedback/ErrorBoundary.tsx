import { Component, type ErrorInfo, type ReactNode } from 'react'

import { ErrorState } from '@/components/feedback/ErrorState'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error boundary', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <ErrorState
          actionLabel="Reload application"
          message={this.state.error.message}
          onAction={() => window.location.reload()}
          onSecondaryAction={() => window.location.assign('/')}
          secondaryActionLabel="Return home"
          title="The learning experience could not continue"
        />
      </main>
    )
  }
}
