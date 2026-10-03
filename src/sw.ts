/// <reference lib="webworker" />

import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { createPartialResponse } from 'workbox-range-requests'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'

import {
  PASSIVE_DICOM_CACHE,
  PASSIVE_DICOM_MAX_AGE_SECONDS,
  PASSIVE_DICOM_MAX_ENTRIES,
  VERIFIED_PACKAGE_CACHE,
  VERSIONED_MODEL_CACHE,
  VERSIONED_MODEL_MAX_AGE_SECONDS,
  VERSIONED_MODEL_MAX_ENTRIES,
} from '@/pwa/cachePolicy'
import { isVersionedGlbRequest } from '@/pwa/modelCache'
import { isDicomRequest, isDownloadableAssetRequest } from '@/pwa/requestPolicy'

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision?: string }>
}

const dicomBaseUrl = import.meta.env.VITE_DICOM_BASE_URL?.trim() || '/assets/dicom/'
const settingsDatabase = 'axiom-runtime-service-worker'
const settingsStore = 'settings'
const simulatedOfflineKey = 'simulated-offline'

function openSettings() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(settingsDatabase, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(settingsStore)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readSimulatedOffline() {
  const database = await openSettings()
  return new Promise<boolean>((resolve, reject) => {
    const request = database
      .transaction(settingsStore)
      .objectStore(settingsStore)
      .get(simulatedOfflineKey)
    request.onsuccess = () => resolve(request.result === true)
    request.onerror = () => reject(request.error)
  }).finally(() => database.close())
}

async function writeSimulatedOffline(value: boolean) {
  const database = await openSettings()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(settingsStore, 'readwrite')
    transaction.objectStore(settingsStore).put(value, simulatedOfflineKey)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  database.close()
}

let simulatedOffline = false
const settingsReady = readSimulatedOffline()
  .then((value) => {
    simulatedOffline = value
  })
  .catch(() => undefined)

const passiveDicomStrategy = new CacheFirst({
  cacheName: PASSIVE_DICOM_CACHE,
  plugins: [
    new ExpirationPlugin({
      maxEntries: PASSIVE_DICOM_MAX_ENTRIES,
      maxAgeSeconds: PASSIVE_DICOM_MAX_AGE_SECONDS,
    }),
    new CacheableResponsePlugin({ statuses: [0, 200] }),
  ],
})

const versionedModelStrategy = new CacheFirst({
  cacheName: VERSIONED_MODEL_CACHE,
  plugins: [
    new ExpirationPlugin({
      maxEntries: VERSIONED_MODEL_MAX_ENTRIES,
      maxAgeSeconds: VERSIONED_MODEL_MAX_AGE_SECONDS,
    }),
    new CacheableResponsePlugin({ statuses: [0, 200] }),
  ],
})

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
clientsClaim()

registerRoute(
  ({ request, url }) => request.method === 'GET' && isDownloadableAssetRequest(url, dicomBaseUrl),
  async ({ request, url, event }) => {
    await settingsReady
    const verified = await (
      await caches.open(VERIFIED_PACKAGE_CACHE)
    ).match(request, { ignoreVary: true })
    if (verified) {
      return request.headers.has('range') ? createPartialResponse(request, verified) : verified
    }
    if (simulatedOffline) return Response.error()
    if (isVersionedGlbRequest(url)) {
      return versionedModelStrategy.handle({ request, event })
    }
    if (isDicomRequest(url, dicomBaseUrl)) {
      return passiveDicomStrategy.handle({ request, event })
    }
    return fetch(request)
  },
)

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

self.addEventListener('message', (event) => {
  const data = event.data as { type?: string; value?: boolean } | undefined
  if (data?.type === 'SKIP_WAITING') {
    void self.skipWaiting()
    return
  }
  if (data?.type === 'GET_SIMULATED_OFFLINE') {
    event.ports[0]?.postMessage({ type: 'SIMULATED_OFFLINE_STATE', value: simulatedOffline })
    return
  }
  if (data?.type === 'SET_SIMULATED_OFFLINE' && typeof data.value === 'boolean') {
    event.waitUntil(
      writeSimulatedOffline(data.value).then(async () => {
        simulatedOffline = data.value!
        const clients = await self.clients.matchAll({ type: 'window' })
        clients.forEach((client) =>
          client.postMessage({ type: 'SIMULATED_OFFLINE_CHANGED', value: simulatedOffline }),
        )
        event.ports[0]?.postMessage({
          type: 'SIMULATED_OFFLINE_STATE',
          value: simulatedOffline,
        })
      }),
    )
  }
})
