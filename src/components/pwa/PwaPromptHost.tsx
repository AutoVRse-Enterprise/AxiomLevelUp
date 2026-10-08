import { Download, RefreshCw, Wifi } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useContent } from '@/app/contentContext'
import { useExperienceShell } from '@/app/experienceShell'
import { Button, Card } from '@/components/ui'
import {
  applyServiceWorkerUpdate,
  dismissServiceWorkerNotice,
  useServiceWorkerStatus,
} from '@/pwa/registerSW'
import { installPromptEligible } from '@/pwa/installPrompt'
import { usePreferencesStore } from '@/state/preferences'
import { useLearnerStore } from '@/state/learnerStore'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandalone() {
  return (
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function PwaPromptHost() {
  const { appConfig } = useContent()
  const { installPrompt, copy } = useExperienceShell()
  const completedLessons = useLearnerStore((state) => state.stats.lessonsCompleted)
  const serviceWorker = useServiceWorkerStatus()
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)
  const dismissedAt = usePreferencesStore((state) => state.installPromptDismissedAt)
  const setDismissedAt = usePreferencesStore((state) => state.setInstallPromptDismissedAt)
  const promptConfig = appConfig.product.offline.installPrompt
  const engaged =
    installPrompt &&
    installPromptEligible(
      completedLessons,
      promptConfig.minCompletedLessons,
      dismissedAt,
      promptConfig.dismissCooldownDays,
    )
  const standalone = typeof window !== 'undefined' && isStandalone()
  const showIosGuidance = engaged && !standalone && isIos() && !installEvent

  useEffect(() => {
    if (!installPrompt) return
    const capture = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', capture)
    return () => window.removeEventListener('beforeinstallprompt', capture)
  }, [installPrompt])

  function dismissInstall() {
    const value = new Date().toISOString()
    setDismissedAt(value)
    setInstallEvent(null)
  }

  return (
    <aside
      aria-label="Application notifications"
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-auto z-50 grid w-[calc(100vw-2rem)] max-w-sm gap-3 sm:left-auto sm:right-4"
    >
      {serviceWorker.needRefresh ? (
        <Card className="min-w-0 shadow-lg">
          <h2 className="flex items-center gap-2 font-bold">
            <RefreshCw aria-hidden="true" size={18} /> {copy.updateNotice.title}
          </h2>
          <p className="mt-2 text-small text-neutral-600">{copy.updateNotice.message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void applyServiceWorkerUpdate()}>
              {copy.updateNotice.reloadLabel}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dismissServiceWorkerNotice('needRefresh')}
            >
              {copy.updateNotice.laterLabel}
            </Button>
          </div>
        </Card>
      ) : null}

      {installPrompt && serviceWorker.offlineReady ? (
        <Card className="min-w-0 shadow-lg" role="status">
          <h2 className="flex items-center gap-2 font-bold">
            <Wifi aria-hidden="true" size={18} /> Ready to work offline
          </h2>
          <p className="mt-2 text-small text-neutral-600">
            The application shell is available without a connection.
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant="ghost"
            onClick={() => dismissServiceWorkerNotice('offlineReady')}
          >
            Dismiss
          </Button>
        </Card>
      ) : null}

      {engaged && !standalone && installEvent ? (
        <Card className="min-w-0 shadow-lg">
          <h2 className="flex items-center gap-2 font-bold">
            <Download aria-hidden="true" size={18} /> Install Learning App
          </h2>
          <p className="mt-2 text-small text-neutral-600">
            Access downloaded courses offline and launch directly from your home screen.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                void installEvent
                  .prompt()
                  .then(() => installEvent.userChoice)
                  .then(() => {
                    setInstallEvent(null)
                  })
              }}
            >
              Install
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissInstall}>
              Not now
            </Button>
          </div>
        </Card>
      ) : null}

      {showIosGuidance ? (
        <Card className="min-w-0 shadow-lg">
          <h2 className="font-bold">Add Learning App to your Home Screen</h2>
          <p className="mt-2 text-small text-neutral-600">
            In Safari, tap Share, then choose Add to Home Screen.
          </p>
          <Button className="mt-3" size="sm" variant="ghost" onClick={dismissInstall}>
            Not now
          </Button>
        </Card>
      ) : null}
    </aside>
  )
}
