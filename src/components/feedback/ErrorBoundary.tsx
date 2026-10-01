import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/ui'

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
        <div className="max-w-md text-center">
          <p className="text-small font-semibold text-danger-700">Application error</p>
          <h1 className="mt-2 text-title font-bold">The learning experience could not continue.</h1>
          <p className="mt-3 text-neutral-600">{this.state.error.message}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Reload application
          </Button>
        </div>
      </main>
    )
  }
}
