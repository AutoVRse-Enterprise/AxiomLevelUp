import { useSyncExternalStore } from 'react'

import { SIMULATED_OFFLINE_KEY } from '@/pwa/cachePolicy'
import { useOnlineStatus } from '@/pwa/useOnlineStatus'

let simulated =
  typeof localStorage !== 'undefined' && localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true'
const listeners = new Set<() => void>()
let listening = false

function notify(value: boolean) {
  simulated = value
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SIMULATED_OFFLINE_KEY, String(value))
  }
  listeners.forEach((listener) => listener())
}

function ensureWorkerListener() {
  if (listening || typeof navigator === 'undefined' || !navigator.serviceWorker) return
  listening = true
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data as { type?: string; value?: boolean } | undefined
    if (
      (data?.type === 'SIMULATED_OFFLINE_CHANGED' ||
        data?.type === 'SIMULATED_OFFLINE_STATE') &&
      typeof data.value === 'boolean'
    ) {
      notify(data.value)
    }
  })
}

function subscribe(listener: () => void) {
  ensureWorkerListener()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function snapshot() {
  return simulated
}

export async function setSimulatedOffline(value: boolean) {
  notify(value)
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const worker = navigator.serviceWorker.controller ?? registration.active
  worker?.postMessage({ type: 'SET_SIMULATED_OFFLINE', value })
}

export async function syncSimulatedOffline() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const worker = navigator.serviceWorker.controller ?? registration.active
  if (!worker) return
  const channel = new MessageChannel()
  channel.port1.onmessage = (event) => {
    const data = event.data as { value?: boolean }
    if (typeof data.value === 'boolean') notify(data.value)
  }
  worker.postMessage({ type: 'GET_SIMULATED_OFFLINE' }, [channel.port2])
}

export function useConnectivity() {
  const networkOnline = useOnlineStatus()
  const simulatedOffline = useSyncExternalStore(subscribe, snapshot, () => false)
  return {
    online: networkOnline && !simulatedOffline,
    networkOnline,
    simulatedOffline,
  }
}
