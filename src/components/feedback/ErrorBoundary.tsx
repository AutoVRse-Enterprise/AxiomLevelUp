import { Component, type ErrorInfo, type ReactNode } from 'react'

import { ErrorState } from '@/components/feedback/ErrorState'
import type { ExperienceShellCopy } from '@/app/experienceShell'

interface ErrorBoundaryProps {
  children: ReactNode
  copy?: ExperienceShellCopy['applicationError']
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
    const copy = this.props.copy ?? {
      title: 'The learning experience could not continue',
      reloadLabel: 'Reload application',
      homeLabel: 'Return home',
    }

    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <ErrorState
          actionLabel={copy.reloadLabel}
          message={this.state.error.message}
          onAction={() => window.location.reload()}
          onSecondaryAction={() => window.location.assign('/')}
          secondaryActionLabel={copy.homeLabel}
          title={copy.title}
        />
      </main>
    )
  }
}
