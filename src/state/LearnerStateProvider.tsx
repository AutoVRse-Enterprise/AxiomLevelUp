import { type ReactNode, useEffect, useState } from 'react'

import { useContent } from '@/app/contentContext'
import { ErrorState } from '@/components/feedback/ErrorState'
import { LoadingState } from '@/components/ui'
import { initializeHapticEffects } from '@/effects/haptics'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { initializeLearningProgressHandlers } from '@/events/handlers'
import { useLearnerStore } from '@/state/learnerStore'

export function LearnerStateProvider({ children }: { children: ReactNode }) {
  const registry = useContent()
  const { seed } = registry
  const [ready, setReady] = useState(false)
  const storageError = useLearnerStore((state) => state.storageError)

  useEffect(() => {
    initializeLearningProgressHandlers(registry)
    const stopHaptics = initializeHapticEffects(registry.appConfig.product.presentation.haptics)
    let active = true
    void Promise.all([
      Promise.resolve(useLearnerStore.persist.rehydrate()),
      Promise.resolve(useActivitySessionStore.persist.rehydrate()),
    ])
      .then(() => {
        const store = useLearnerStore.getState()
        store.initialize(seed)
        if (active) setReady(true)
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Learner progress could not be restored.'
        useLearnerStore.getState().setStorageError(message)
        if (active) setReady(true)
      })

    return () => {
      active = false
      stopHaptics()
    }
  }, [registry, seed])

  if (storageError) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <ErrorState
          title="Progress storage is unavailable"
          message={storageError}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </main>
    )
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl p-5 sm:p-8">
        <LoadingState
          message="Restoring your progress and active learning session."
          title="Preparing your learning space"
        />
      </main>
    )
  }

  return children
}
