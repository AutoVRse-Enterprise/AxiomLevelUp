import { registerSW } from 'virtual:pwa-register'
import { useSyncExternalStore } from 'react'

import { syncSimulatedOffline } from '@/pwa/connectivity'

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null
const initialStatus = { needRefresh: false, offlineReady: false }
let status = initialStatus
const listeners = new Set<() => void>()

function updateStatus(update: Partial<typeof status>) {
  status = { ...status, ...update }
  listeners.forEach((listener) => listener())
}

export function registerServiceWorker() {
  updateServiceWorker = registerSW({
    immediate: true,
    onRegisteredSW() {
      void syncSimulatedOffline()
    },
    onNeedRefresh() {
      updateStatus({ needRefresh: true })
    },
    onOfflineReady() {
      updateStatus({ offlineReady: true })
    },
    onRegisterError(error) {
      console.error('Service worker registration failed', error)
    },
  })
}

export function applyServiceWorkerUpdate() {
  return updateServiceWorker?.(true)
}

export function dismissServiceWorkerNotice(kind: keyof typeof status) {
  updateStatus({ [kind]: false })
}

export function useServiceWorkerStatus() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => status,
    () => initialStatus,
  )
}
