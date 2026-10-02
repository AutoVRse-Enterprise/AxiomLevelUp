import { registerSW } from 'virtual:pwa-register'

import { syncSimulatedOffline } from '@/pwa/connectivity'

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null

export function registerServiceWorker() {
  updateServiceWorker = registerSW({
    immediate: true,
    onRegisteredSW() {
      void syncSimulatedOffline()
    },
    onRegisterError(error) {
      console.error('Service worker registration failed', error)
    },
  })
}

export function applyServiceWorkerUpdate() {
  return updateServiceWorker?.(true)
}
