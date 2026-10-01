import { registerSW } from 'virtual:pwa-register'

let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null

export function registerServiceWorker() {
  updateServiceWorker = registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error('Service worker registration failed', error)
    },
  })
}

export function applyServiceWorkerUpdate() {
  return updateServiceWorker?.(true)
}
