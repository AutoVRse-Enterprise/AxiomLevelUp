import type { ContentRegistry } from '@/content/loader'
import {
  assertManifestMatchesAsset,
  dicomSeriesManifestSchema,
  type DicomAsset,
} from '@/imaging/series'
import {
  type OfflineDownloadRecord,
  type OfflineFailureKind,
  useOfflineLibraryStore,
} from '@/offline/offlineLibraryStore'
import type { CourseOfflinePackage } from '@/offline/package'
import {
  browserCacheStore,
  browserStorageAdapter,
  sha256Hex,
  type CacheStore,
  type FetchLike,
  type StorageAdapter,
} from '@/offline/platform'
import { PASSIVE_DICOM_CACHE, VERIFIED_COURSE_CACHE } from '@/pwa/cachePolicy'

interface DownloadConfiguration {
  downloadConcurrency: number
  quotaSafetyMarginRatio: number
  requestPersistentStorage: boolean
}

interface DownloadManagerDependencies {
  cache?: CacheStore
  storage?: StorageAdapter
  fetch?: FetchLike
  now?: () => string
  isOnline?: () => boolean
  onEvent?: (event: DownloadManagerEvent) => void
}

export type DownloadManagerEvent =
  | { type: 'started'; courseId: string; bytes: number }
  | { type: 'completed'; courseId: string; bytes: number }
  | { type: 'failed'; courseId: string; reason: OfflineFailureKind }
  | { type: 'removed'; courseId: string; bytes: number }

interface DownloadItem {
  assetId: string
  url: string
  sizeBytes: number
  sha256: string
  passiveCacheEligible: boolean
}

class PauseDownloadError extends Error {}

export class DownloadManagerError extends Error {
  constructor(
    readonly kind: OfflineFailureKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'DownloadManagerError'
  }
}

function isQuotaError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === 'QuotaExceededError') ||
    (error instanceof Error &&
      (error.name === 'QuotaExceededError' || /storage is full|quota/i.test(error.message)))
  )
}

function responseFrom(bytes: ArrayBuffer, source: Response) {
  return new Response(bytes, {
    status: source.status || 200,
    statusText: source.statusText,
    headers: source.headers,
  })
}

function absoluteUrl(url: string) {
  const origin =
    typeof globalThis.location === 'undefined' ? 'http://localhost' : globalThis.location.origin
  return new URL(url, origin).href
}

async function mapConcurrent<T>(
  values: readonly T[],
  concurrency: number,
  operation: (value: T) => Promise<void>,
) {
  let index = 0
  const workers = Array.from(
    { length: Math.min(Math.max(1, concurrency), values.length) },
    async () => {
      while (index < values.length) {
        const value = values[index]
        index += 1
        if (value) await operation(value)
      }
    },
  )
  await Promise.all(workers)
}

export class DownloadManager {
  private readonly cache: CacheStore
  private readonly storage: StorageAdapter
  private readonly fetcher: FetchLike
  private readonly now: () => string
  private readonly isOnline: () => boolean
  private readonly onEvent?: (event: DownloadManagerEvent) => void
  private readonly controllers = new Map<string, AbortController>()

  constructor(
    private readonly configuration: DownloadConfiguration,
    dependencies: DownloadManagerDependencies = {},
  ) {
    this.cache = dependencies.cache ?? browserCacheStore
    this.storage = dependencies.storage ?? browserStorageAdapter
    this.fetcher = dependencies.fetch ?? fetch.bind(globalThis)
    this.now = dependencies.now ?? (() => new Date().toISOString())
    this.isOnline =
      dependencies.isOnline ?? (() => typeof navigator === 'undefined' || navigator.onLine)
    this.onEvent = dependencies.onEvent
  }

  cancel(courseId: string) {
    this.controllers.get(courseId)?.abort()
  }

  async download(coursePackage: CourseOfflinePackage, registry: ContentRegistry) {
    this.cancel(coursePackage.id)
    const controller = new AbortController()
    this.controllers.set(coursePackage.id, controller)
    const initial = this.createRecord(coursePackage)
    useOfflineLibraryStore.getState().setRecord(initial)
    this.onEvent?.({ type: 'started', courseId: coursePackage.id, bytes: initial.totalBytes })

    try {
      await this.assertCapacity(coursePackage.totalBytes)
      if (this.configuration.requestPersistentStorage) await this.storage.persist()
      if (!this.isOnline()) throw new PauseDownloadError('Download paused while offline.')

      const { items, assetUrls, manifestEntries } = await this.expand(
        coursePackage,
        registry,
        controller.signal,
      )
      const urls = [...manifestEntries.map(({ url }) => url), ...items.map(({ url }) => url)]
      useOfflineLibraryStore.getState().updateRecord(coursePackage.id, {
        urls,
        assetUrls,
      })

      let downloadedBytes = 0
      const pending: DownloadItem[] = []
      for (const item of items) {
        const existing = await this.cache.match(VERIFIED_COURSE_CACHE, item.url)
        if (existing && (await this.verify(existing, item))) {
          downloadedBytes += item.sizeBytes
        } else {
          pending.push(item)
        }
      }
      useOfflineLibraryStore.getState().updateRecord(coursePackage.id, {
        downloadedBytes,
        status: 'downloading',
      })

      await mapConcurrent(pending, this.configuration.downloadConcurrency, async (item) => {
        if (controller.signal.aborted) {
          throw new DownloadManagerError('cancelled', 'Download cancelled.')
        }
        if (!this.isOnline()) throw new PauseDownloadError('Download paused while offline.')
        await this.downloadItem(item, controller.signal)
        downloadedBytes += item.sizeBytes
        useOfflineLibraryStore.getState().updateRecord(coursePackage.id, { downloadedBytes })
      })

      const completed: Partial<OfflineDownloadRecord> = {
        status: 'available',
        downloadedBytes: coursePackage.totalBytes,
        verifiedAt: this.now(),
        error: null,
      }
      useOfflineLibraryStore.getState().updateRecord(coursePackage.id, completed)
      this.onEvent?.({
        type: 'completed',
        courseId: coursePackage.id,
        bytes: coursePackage.totalBytes,
      })
    } catch (error) {
      const failure = this.normalizeError(error, controller.signal)
      const paused = error instanceof PauseDownloadError
      useOfflineLibraryStore.getState().updateRecord(coursePackage.id, {
        status: paused ? 'paused' : 'failed',
        error: paused ? null : { kind: failure.kind, message: failure.message },
      })
      if (!paused) {
        this.onEvent?.({ type: 'failed', courseId: coursePackage.id, reason: failure.kind })
      }
      if (!paused && failure.kind !== 'cancelled') throw failure
    } finally {
      if (this.controllers.get(coursePackage.id) === controller) {
        this.controllers.delete(coursePackage.id)
      }
    }
  }

  async remove(courseId: string) {
    const { records, removeRecord } = useOfflineLibraryStore.getState()
    const record = records[courseId]
    if (!record) return
    const retained = new Set(
      Object.values(records)
        .filter(
          (candidate) => candidate.courseId !== courseId && candidate.status === 'available',
        )
        .flatMap(({ urls }) => [...urls]),
    )
    await Promise.all(
      record.urls
        .filter((url) => !retained.has(url))
        .map((url) => this.cache.delete(VERIFIED_COURSE_CACHE, url)),
    )
    removeRecord(courseId)
    this.onEvent?.({ type: 'removed', courseId, bytes: record.totalBytes })
  }

  async removeAll() {
    const courseIds = Object.keys(useOfflineLibraryStore.getState().records)
    for (const courseId of courseIds) await this.remove(courseId)
  }

  async reconcile(packages: ReadonlyMap<string, CourseOfflinePackage>) {
    const availableUrls = new Set(await this.cache.keys(VERIFIED_COURSE_CACHE))
    const { records, updateRecord } = useOfflineLibraryStore.getState()
    for (const record of Object.values(records)) {
      const current = packages.get(record.courseId)
      if (current && current.fingerprint !== record.fingerprint) {
        updateRecord(record.courseId, { status: 'outdated' })
        continue
      }
      if (
        record.status === 'available' &&
        record.urls.some((url) => !availableUrls.has(absoluteUrl(url)))
      ) {
        updateRecord(record.courseId, {
          status: 'incomplete',
          error: { kind: 'cache', message: 'Some downloaded files were removed by the browser.' },
        })
      }
    }
  }

  private createRecord(coursePackage: CourseOfflinePackage): OfflineDownloadRecord {
    return {
      courseId: coursePackage.id,
      status: 'queued',
      downloadedBytes: 0,
      totalBytes: coursePackage.totalBytes,
      urls: [],
      assetUrls: {},
      fingerprint: coursePackage.fingerprint,
      verifiedAt: null,
      error: null,
    }
  }

  private async assertCapacity(requiredBytes: number) {
    const { quota, usage = 0 } = await this.storage.estimate()
    if (quota === undefined) return
    const usable = quota * (1 - this.configuration.quotaSafetyMarginRatio)
    if (usage + requiredBytes > usable) {
      throw new DownloadManagerError(
        'quota',
        'Not enough browser storage is available. Remove an offline course and try again.',
      )
    }
  }

  private async expand(
    coursePackage: CourseOfflinePackage,
    registry: ContentRegistry,
    signal: AbortSignal,
  ) {
    const items: DownloadItem[] = []
    const manifestEntries: Array<{ assetId: string; url: string }> = []
    const assetUrls: Record<string, string[]> = {}

    for (const packageAsset of coursePackage.assets) {
      if (packageAsset.delivery === 'shell') continue
      const asset = registry.assetById.get(packageAsset.assetId)
      if (!asset) continue
      if (asset.type !== 'dicom') {
        if (!asset.sha256) {
          throw new DownloadManagerError(
            'integrity',
            `Asset "${asset.assetId}" has no integrity digest.`,
          )
        }
        items.push({
          assetId: asset.assetId,
          url: packageAsset.url,
          sizeBytes: asset.sizeBytes,
          sha256: asset.sha256,
          passiveCacheEligible: false,
        })
        assetUrls[asset.assetId] = [packageAsset.url]
        continue
      }

      const response = await this.responseFor(packageAsset.url, signal)
      if (!response.ok) {
        throw new DownloadManagerError(
          'network',
          `DICOM series manifest returned ${response.status}.`,
        )
      }
      const bytes = await response.arrayBuffer()
      const manifest = dicomSeriesManifestSchema.parse(
        JSON.parse(new TextDecoder().decode(bytes)) as unknown,
      )
      assertManifestMatchesAsset(manifest, asset as DicomAsset)
      if (manifest.files.length !== manifest.sliceCount || manifest.totalBytes !== asset.sizeBytes) {
        throw new DownloadManagerError(
          'integrity',
          'DICOM manifest counts do not match validated asset metadata.',
        )
      }
      await this.cache.put(
        VERIFIED_COURSE_CACHE,
        packageAsset.url,
        responseFrom(bytes, response),
      )
      manifestEntries.push({ assetId: asset.assetId, url: packageAsset.url })
      const manifestUrl = absoluteUrl(packageAsset.url)
      const fileUrls = manifest.files.map((file) => new URL(file.path, manifestUrl).href)
      assetUrls[asset.assetId] = [packageAsset.url, ...fileUrls]
      manifest.files.forEach((file, index) => {
        items.push({
          assetId: asset.assetId,
          url: fileUrls[index]!,
          sizeBytes: file.sizeBytes,
          sha256: file.sha256,
          passiveCacheEligible: true,
        })
      })
    }

    return { items, manifestEntries, assetUrls }
  }

  private async responseFor(url: string, signal: AbortSignal, passiveCacheEligible = true) {
    if (passiveCacheEligible) {
      const promoted = await this.cache.match(PASSIVE_DICOM_CACHE, url)
      if (promoted) return promoted
    }
    return this.fetcher(url, { signal })
  }

  private async verify(response: Response, item: DownloadItem) {
    try {
      const bytes = await response.arrayBuffer()
      return (
        bytes.byteLength === item.sizeBytes && (await sha256Hex(bytes)) === item.sha256
      )
    } catch {
      return false
    }
  }

  private async downloadItem(item: DownloadItem, signal: AbortSignal) {
    const response = await this.responseFor(item.url, signal, item.passiveCacheEligible)
    if (!response.ok) {
      throw new DownloadManagerError(
        'network',
        `Asset "${item.assetId}" returned ${response.status}.`,
      )
    }
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength !== item.sizeBytes || (await sha256Hex(bytes)) !== item.sha256) {
      throw new DownloadManagerError(
        'integrity',
        `Asset "${item.assetId}" failed size or SHA-256 verification.`,
      )
    }
    try {
      await this.cache.put(VERIFIED_COURSE_CACHE, item.url, responseFrom(bytes, response))
    } catch (error) {
      if (isQuotaError(error)) {
        throw new DownloadManagerError(
          'quota',
          'Browser storage filled during download. Remove an offline course and try again.',
          { cause: error },
        )
      }
      throw error
    }
  }

  private normalizeError(error: unknown, signal: AbortSignal) {
    if (error instanceof DownloadManagerError) return error
    if (signal.aborted) return new DownloadManagerError('cancelled', 'Download cancelled.')
    if (isQuotaError(error)) {
      return new DownloadManagerError(
        'quota',
        'Browser storage is full. Remove an offline course and try again.',
        { cause: error },
      )
    }
    if (!this.isOnline()) return new DownloadManagerError('network', 'Download paused offline.')
    if (error instanceof Error && error.name === 'ZodError') {
      return new DownloadManagerError('integrity', 'Downloaded metadata is invalid.', {
        cause: error,
      })
    }
    return new DownloadManagerError(
      'network',
      error instanceof Error ? error.message : 'Download failed.',
      { cause: error },
    )
  }
}
