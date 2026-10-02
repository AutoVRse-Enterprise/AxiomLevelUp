export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export interface CacheStore {
  match: (cacheName: string, url: string) => Promise<Response | undefined>
  put: (cacheName: string, url: string, response: Response) => Promise<void>
  delete: (cacheName: string, url: string) => Promise<boolean>
  keys: (cacheName: string) => Promise<string[]>
}

export interface StorageEstimate {
  usage?: number
  quota?: number
}

export interface StorageAdapter {
  estimate: () => Promise<StorageEstimate>
  persist: () => Promise<boolean>
  persisted: () => Promise<boolean>
}

export const browserCacheStore: CacheStore = {
  async match(cacheName, url) {
    return (await (await caches.open(cacheName)).match(url, { ignoreVary: true })) ?? undefined
  },
  async put(cacheName, url, response) {
    await (await caches.open(cacheName)).put(url, response)
  },
  async delete(cacheName, url) {
    return (await caches.open(cacheName)).delete(url, { ignoreVary: true })
  },
  async keys(cacheName) {
    return (await (await caches.open(cacheName)).keys()).map(({ url }) => url)
  },
}

const unsupportedStorage: StorageAdapter = {
  async estimate() {
    return {}
  },
  async persist() {
    return false
  },
  async persisted() {
    return false
  },
}

export const browserStorageAdapter: StorageAdapter =
  typeof navigator !== 'undefined' && navigator.storage
    ? {
        estimate: () => navigator.storage.estimate(),
        persist: () => navigator.storage.persist(),
        persisted: () => navigator.storage.persisted(),
      }
    : unsupportedStorage

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export class MemoryCacheStore implements CacheStore {
  private readonly caches = new Map<string, Map<string, Response>>()

  private cache(name: string) {
    const existing = this.caches.get(name)
    if (existing) return existing
    const created = new Map<string, Response>()
    this.caches.set(name, created)
    return created
  }

  async match(cacheName: string, url: string) {
    return this.cache(cacheName).get(new URL(url, 'http://localhost').href)?.clone()
  }

  async put(cacheName: string, url: string, response: Response) {
    this.cache(cacheName).set(new URL(url, 'http://localhost').href, response.clone())
  }

  async delete(cacheName: string, url: string) {
    return this.cache(cacheName).delete(new URL(url, 'http://localhost').href)
  }

  async keys(cacheName: string) {
    return [...this.cache(cacheName).keys()]
  }
}

export class MemoryStorageAdapter implements StorageAdapter {
  constructor(
    public value: StorageEstimate = {},
    public persistent = false,
  ) {}

  async estimate() {
    return this.value
  }

  async persist() {
    this.persistent = true
    return true
  }

  async persisted() {
    return this.persistent
  }
}
