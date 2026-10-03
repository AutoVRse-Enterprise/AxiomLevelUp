import { beforeEach, describe, expect, it, vi } from 'vitest'
import foundationCaseData from '../../public/content/cases/asthma-foundation.json'

import { validateContentBundle, type ContentRegistry } from '@/content/loader'
import { caseDocumentSchema } from '@/content/schema'
import { DownloadManager, type DownloadManagerError } from '@/offline/downloadManager'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import {
  buildCoursePackage,
  buildCasePackage,
  offlinePackageKey,
  packageFingerprint,
  type CourseOfflinePackage,
} from '@/offline/package'
import { MemoryCacheStore, MemoryStorageAdapter } from '@/offline/platform'
import { isCaseOfflineReady, isCourseOfflineReady, isLessonOfflineReady } from '@/offline/readiness'
import { PASSIVE_DICOM_CACHE, VERIFIED_COURSE_CACHE } from '@/pwa/cachePolicy'
import { isDicomRequest, isDownloadableAssetRequest } from '@/pwa/requestPolicy'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())
const abcSha256 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'

function fixture() {
  const asset = {
    assetId: 'fixture-binary',
    path: '/assets/fixture.bin',
    type: 'document' as const,
    offlineRequired: true,
    offlineAvailable: true,
    sizeBytes: 3,
    sha256: abcSha256,
  }
  const coursePackage: CourseOfflinePackage = {
    kind: 'course',
    id: 'fixture-course',
    version: '1',
    assets: [
      {
        assetId: asset.assetId,
        type: asset.type,
        url: asset.path,
        sizeBytes: asset.sizeBytes,
        sha256: asset.sha256,
        required: true,
        delivery: 'download',
      },
    ],
    lessons: [
      {
        lessonId: 'fixture-lesson',
        assetIds: [asset.assetId],
        requiredAssetIds: [asset.assetId],
      },
    ],
    fingerprint: packageFingerprint('1', [
      {
        assetId: asset.assetId,
        type: asset.type,
        url: asset.path,
        sizeBytes: asset.sizeBytes,
        sha256: asset.sha256,
        required: true,
        delivery: 'download',
      },
    ]),
    totalBytes: 3,
  }
  const fixtureRegistry = {
    assetById: new Map([[asset.assetId, asset]]),
  } as unknown as ContentRegistry
  return { asset, coursePackage, fixtureRegistry }
}

describe('offline packages and readiness', () => {
  it('loads the v0.2 integrity and availability contract', () => {
    expect(registry.assetManifest.schemaVersion).toBe('0.2')
    expect(
      registry.assetManifest.assets.every(
        (asset) =>
          typeof asset.offlineAvailable === 'boolean' &&
          Number.isInteger(asset.sizeBytes) &&
          (asset.type === 'dicom' || /^[a-f0-9]{64}$/.test(asset.sha256 ?? '')),
      ),
    ).toBe(true)
  })

  it('derives a deduplicated DICOM package and lesson requirements', () => {
    const course = registry.courseById.get('scientific-imaging')!
    const result = buildCoursePackage(course, registry)
    const dicom = result.assets.find(({ assetId }) => assetId === 'thoracic-ct-series')

    expect(dicom).toMatchObject({
      required: true,
      delivery: 'download',
      sizeBytes: 65_894_350,
    })
    expect(result.assets.filter(({ assetId }) => assetId === 'thoracic-ct-series')).toHaveLength(1)
    expect(
      result.lessons.find(({ lessonId }) => lessonId === 'thoracic-ct')?.requiredAssetIds,
    ).toContain('thoracic-ct-series')
  })

  it('derives an exact, deduplicated case package with a versioned model', () => {
    const caseDocument = caseDocumentSchema.parse(foundationCaseData)
    const anatomyMap = registry.anatomyMapById.get(caseDocument.anatomyMapId)!
    const result = buildCasePackage(caseDocument, anatomyMap, registry)
    const model = registry.assetById.get(anatomyMap.modelAssetId)!

    expect(result.assets.map(({ assetId }) => assetId)).toEqual([
      'lung-model',
      'airway-comparison-image',
      'wheeze-audio',
    ])
    expect(result.assets.find(({ assetId }) => assetId === 'lung-model')?.url).toBe(
      `${model.path}?v=${model.sha256}`,
    )
    expect(result.totalBytes).toBe(704_445)
    expect(result.fingerprint).toContain(`lung-model:${model.sha256}:${model.sizeBytes}`)
    expect(
      packageFingerprint(result.version, [
        ...result.assets.filter(({ assetId }) => assetId !== 'lung-model'),
        {
          ...result.assets.find(({ assetId }) => assetId === 'lung-model')!,
          sha256: 'f'.repeat(64),
        },
      ]),
    ).not.toBe(result.fingerprint)

    const withPatientImage = buildCasePackage(
      {
        ...caseDocument,
        patient: { ...caseDocument.patient, imageAssetId: 'asthma-histology-image' },
        stages: caseDocument.stages.map((stage, index) =>
          index === 0
            ? {
                ...stage,
                steps: stage.steps.map((step, stepIndex) =>
                  stepIndex === 0 ? { ...step, assets: ['crackles-audio'] } : step,
                ),
              }
            : stage,
        ),
      },
      anatomyMap,
      registry,
    )
    expect(withPatientImage.assets.map(({ assetId }) => assetId)).toContain(
      'asthma-histology-image',
    )
    expect(withPatientImage.assets.map(({ assetId }) => assetId)).toContain('crackles-audio')
    expect(new Set(withPatientImage.assets.map(({ assetId }) => assetId)).size).toBe(
      withPatientImage.assets.length,
    )
  })

  it('requires the current verified record for downloadable lesson assets', () => {
    const { coursePackage } = fixture()
    expect(isLessonOfflineReady(coursePackage, 'fixture-lesson')).toBe(false)
    const record = {
      key: coursePackage.id,
      packageKind: 'course' as const,
      packageId: coursePackage.id,
      status: 'available' as const,
      downloadedBytes: 3,
      totalBytes: 3,
      urls: ['/assets/fixture.bin'],
      assetUrls: { 'fixture-binary': ['/assets/fixture.bin'] },
      fingerprint: coursePackage.fingerprint,
      verifiedAt: new Date().toISOString(),
      error: null,
    }
    expect(isCourseOfflineReady(coursePackage, record)).toBe(true)
    expect(isLessonOfflineReady(coursePackage, 'fixture-lesson', record)).toBe(true)
    expect(isCourseOfflineReady(coursePackage, { ...record, fingerprint: 'old-version' })).toBe(
      false,
    )
  })

  it('requires a matching case kind, id and fingerprint', () => {
    const caseDocument = caseDocumentSchema.parse(foundationCaseData)
    const casePackage = buildCasePackage(
      caseDocument,
      registry.anatomyMapById.get(caseDocument.anatomyMapId)!,
      registry,
    )
    const key = offlinePackageKey(casePackage.kind, casePackage.id)
    const record = {
      key,
      packageKind: 'case' as const,
      packageId: casePackage.id,
      status: 'available' as const,
      downloadedBytes: casePackage.totalBytes,
      totalBytes: casePackage.totalBytes,
      urls: casePackage.assets.map(({ url }) => url),
      assetUrls: {},
      fingerprint: casePackage.fingerprint,
      verifiedAt: new Date().toISOString(),
      error: null,
    }

    expect(isCaseOfflineReady(casePackage, record)).toBe(true)
    expect(isCaseOfflineReady(casePackage, { ...record, packageKind: 'course' })).toBe(false)
    expect(isCaseOfflineReady(casePackage, { ...record, fingerprint: 'stale' })).toBe(false)
  })
})

describe('download manager', () => {
  beforeEach(() => {
    useOfflineLibraryStore.setState({ records: {}, hydrated: true })
  })

  it('verifies, caches and records a successful download', async () => {
    const { coursePackage, fixtureRegistry } = fixture()
    const cache = new MemoryCacheStore()
    const events: string[] = []
    const manager = new DownloadManager(
      {
        downloadConcurrency: 2,
        quotaSafetyMarginRatio: 0.1,
        requestPersistentStorage: true,
      },
      {
        cache,
        storage: new MemoryStorageAdapter({ quota: 100, usage: 0 }),
        fetch: vi.fn(async () => new Response('abc', { status: 200 })),
        onEvent: (event) => events.push(event.type),
      },
    )

    await manager.download(coursePackage, fixtureRegistry)

    expect(useOfflineLibraryStore.getState().records[coursePackage.id]).toMatchObject({
      status: 'available',
      downloadedBytes: 3,
    })
    expect(await cache.match(VERIFIED_COURSE_CACHE, '/assets/fixture.bin')).toBeDefined()
    expect(events).toEqual(['started', 'completed'])
  })

  it('promotes a verified passive response without a network request', async () => {
    const cache = new MemoryCacheStore()
    const manifestUrl = 'http://localhost/assets/dicom/fixture/manifest.json'
    const fileUrl = 'http://localhost/assets/dicom/fixture/one.dcm'
    const manifest = {
      schemaVersion: '0.2',
      seriesId: 'fixture',
      description: 'Fixture',
      modality: 'CT',
      transferSyntaxUid: '1.2.840.10008.1.2.1',
      sourceFileCount: 1,
      sliceCount: 1,
      totalBytes: 3,
      geometry: {
        rows: 1,
        columns: 1,
        pixelSpacingMm: [1, 1],
        sliceThicknessMm: 1,
      },
      files: [{ path: 'one.dcm', sizeBytes: 3, sha256: abcSha256 }],
      presets: [],
      attribution: { collection: 'Fixture', license: 'Test', doi: 'none' },
    }
    await cache.put(PASSIVE_DICOM_CACHE, manifestUrl, Response.json(manifest))
    await cache.put(PASSIVE_DICOM_CACHE, fileUrl, new Response('abc'))
    const dicomAsset = {
      assetId: 'fixture-dicom',
      path: 'fixture/manifest.json',
      type: 'dicom' as const,
      offlineRequired: true,
      offlineAvailable: true,
      sizeBytes: 3,
      series: {
        sliceCount: 1,
        rows: 1,
        columns: 1,
        pixelSpacingMm: [1, 1] as [number, number],
        sliceThicknessMm: 1,
        calibrated: true,
      },
    }
    const coursePackage: CourseOfflinePackage = {
      kind: 'course',
      id: 'dicom-course',
      version: '1',
      assets: [
        {
          assetId: dicomAsset.assetId,
          type: 'dicom',
          url: manifestUrl,
          sizeBytes: 3,
          required: true,
          delivery: 'download',
        },
      ],
      lessons: [
        {
          lessonId: 'dicom-lesson',
          assetIds: [dicomAsset.assetId],
          requiredAssetIds: [dicomAsset.assetId],
        },
      ],
      fingerprint: 'dicom-v1',
      totalBytes: 3,
    }
    const fixtureRegistry = {
      assetById: new Map([[dicomAsset.assetId, dicomAsset]]),
    } as unknown as ContentRegistry
    const fetcher = vi.fn()
    const manager = new DownloadManager(
      {
        downloadConcurrency: 1,
        quotaSafetyMarginRatio: 0,
        requestPersistentStorage: false,
      },
      { cache, storage: new MemoryStorageAdapter(), fetch: fetcher },
    )

    await manager.download(coursePackage, fixtureRegistry)

    expect(fetcher).not.toHaveBeenCalled()
    expect(await cache.match(VERIFIED_COURSE_CACHE, fileUrl)).toBeDefined()
  })

  it('rejects integrity mismatches and reports the failure', async () => {
    const { coursePackage, fixtureRegistry } = fixture()
    const manager = new DownloadManager(
      {
        downloadConcurrency: 1,
        quotaSafetyMarginRatio: 0,
        requestPersistentStorage: false,
      },
      {
        cache: new MemoryCacheStore(),
        storage: new MemoryStorageAdapter(),
        fetch: vi.fn(async () => new Response('bad')),
      },
    )

    await expect(manager.download(coursePackage, fixtureRegistry)).rejects.toMatchObject({
      kind: 'integrity',
    } satisfies Partial<DownloadManagerError>)
    expect(useOfflineLibraryStore.getState().records[coursePackage.id]?.status).toBe('failed')
  })

  it('checks quota before fetching', async () => {
    const { coursePackage, fixtureRegistry } = fixture()
    const fetcher = vi.fn()
    const manager = new DownloadManager(
      {
        downloadConcurrency: 1,
        quotaSafetyMarginRatio: 0.1,
        requestPersistentStorage: false,
      },
      {
        cache: new MemoryCacheStore(),
        storage: new MemoryStorageAdapter({ quota: 10, usage: 8 }),
        fetch: fetcher,
      },
    )

    await expect(manager.download(coursePackage, fixtureRegistry)).rejects.toMatchObject({
      kind: 'quota',
    } satisfies Partial<DownloadManagerError>)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('pauses when connectivity is unavailable and can be resumed later', async () => {
    const { coursePackage, fixtureRegistry } = fixture()
    const manager = new DownloadManager(
      {
        downloadConcurrency: 1,
        quotaSafetyMarginRatio: 0,
        requestPersistentStorage: false,
      },
      {
        cache: new MemoryCacheStore(),
        storage: new MemoryStorageAdapter(),
        isOnline: () => false,
      },
    )

    await manager.download(coursePackage, fixtureRegistry)
    expect(useOfflineLibraryStore.getState().records[coursePackage.id]?.status).toBe('paused')
  })

  it('cancels an in-flight request without leaving an available record', async () => {
    const { coursePackage, fixtureRegistry } = fixture()
    const fetcher = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )
    const failures: string[] = []
    const manager = new DownloadManager(
      {
        downloadConcurrency: 1,
        quotaSafetyMarginRatio: 0,
        requestPersistentStorage: false,
      },
      {
        cache: new MemoryCacheStore(),
        storage: new MemoryStorageAdapter(),
        fetch: fetcher,
        onEvent: (event) => {
          if (event.type === 'failed') failures.push(event.reason)
        },
      },
    )

    const pending = manager.download(coursePackage, fixtureRegistry)
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalled())
    manager.cancel(coursePackage.id)
    await pending

    expect(useOfflineLibraryStore.getState().records[coursePackage.id]).toMatchObject({
      status: 'failed',
      error: { kind: 'cancelled' },
    })
    expect(failures).toEqual(['cancelled'])
  })

  it('retains shared URLs on removal and detects eviction and version drift', async () => {
    const { coursePackage } = fixture()
    const cache = new MemoryCacheStore()
    await cache.put(VERIFIED_COURSE_CACHE, '/assets/fixture.bin', new Response('abc'))
    const base = {
      packageKind: 'course' as const,
      status: 'available' as const,
      downloadedBytes: 3,
      totalBytes: 3,
      urls: ['/assets/fixture.bin'],
      assetUrls: { 'fixture-binary': ['/assets/fixture.bin'] },
      fingerprint: coursePackage.fingerprint,
      verifiedAt: new Date().toISOString(),
      error: null,
    }
    useOfflineLibraryStore.setState({
      records: {
        'fixture-course': {
          ...base,
          key: 'fixture-course',
          packageId: 'fixture-course',
        },
        shared: { ...base, key: 'shared', packageId: 'shared' },
      },
    })
    const manager = new DownloadManager(
      {
        downloadConcurrency: 1,
        quotaSafetyMarginRatio: 0,
        requestPersistentStorage: false,
      },
      { cache, storage: new MemoryStorageAdapter() },
    )

    await manager.remove('fixture-course')
    expect(await cache.match(VERIFIED_COURSE_CACHE, '/assets/fixture.bin')).toBeDefined()

    await cache.delete(VERIFIED_COURSE_CACHE, '/assets/fixture.bin')
    await manager.reconcile(new Map([['shared', { ...coursePackage, id: 'shared' }]]))
    expect(useOfflineLibraryStore.getState().records.shared?.status).toBe('incomplete')

    useOfflineLibraryStore.setState({
      records: {
        shared: { ...base, key: 'shared', packageId: 'shared', fingerprint: 'old' },
      },
    })
    await manager.reconcile(new Map([['shared', { ...coursePackage, id: 'shared' }]]))
    expect(useOfflineLibraryStore.getState().records.shared?.status).toBe('outdated')
  })

  it('retains a shared model until the final case package is removed', async () => {
    const cache = new MemoryCacheStore()
    const modelUrl = '/assets/models/lung.glb?v=abc'
    await cache.put(VERIFIED_COURSE_CACHE, modelUrl, new Response('model'))
    const base = {
      packageKind: 'case' as const,
      status: 'available' as const,
      downloadedBytes: 5,
      totalBytes: 5,
      urls: [modelUrl],
      assetUrls: { model: [modelUrl] },
      fingerprint: 'fingerprint',
      verifiedAt: new Date().toISOString(),
      error: null,
    }
    useOfflineLibraryStore.setState({
      records: {
        'case:first': { ...base, key: 'case:first', packageId: 'first' },
        'case:second': { ...base, key: 'case:second', packageId: 'second' },
      },
    })
    const manager = new DownloadManager(
      {
        downloadConcurrency: 1,
        quotaSafetyMarginRatio: 0,
        requestPersistentStorage: false,
      },
      { cache, storage: new MemoryStorageAdapter() },
    )

    await manager.remove('case:first')
    expect(await cache.match(VERIFIED_COURSE_CACHE, modelUrl)).toBeDefined()
    await manager.remove('case:second')
    expect(await cache.match(VERIFIED_COURSE_CACHE, modelUrl)).toBeUndefined()
  })

  it('replaces obsolete unshared URLs after a package update', async () => {
    const { coursePackage, fixtureRegistry } = fixture()
    const cache = new MemoryCacheStore()
    const oldUrl = '/assets/fixture-old.bin'
    await cache.put(VERIFIED_COURSE_CACHE, oldUrl, new Response('old'))
    useOfflineLibraryStore.setState({
      records: {
        [coursePackage.id]: {
          key: coursePackage.id,
          packageKind: 'course',
          packageId: coursePackage.id,
          status: 'outdated',
          downloadedBytes: 3,
          totalBytes: 3,
          urls: [oldUrl],
          assetUrls: { 'fixture-binary': [oldUrl] },
          fingerprint: 'old',
          verifiedAt: new Date().toISOString(),
          error: null,
        },
      },
    })
    const manager = new DownloadManager(
      {
        downloadConcurrency: 1,
        quotaSafetyMarginRatio: 0,
        requestPersistentStorage: false,
      },
      {
        cache,
        storage: new MemoryStorageAdapter(),
        fetch: vi.fn(async () => new Response('abc')),
      },
    )

    await manager.download(coursePackage, fixtureRegistry)

    expect(await cache.match(VERIFIED_COURSE_CACHE, oldUrl)).toBeUndefined()
    expect(await cache.match(VERIFIED_COURSE_CACHE, '/assets/fixture.bin')).toBeDefined()
  })
})

describe('service-worker request policy', () => {
  it('recognizes configured DICOM and downloadable media URLs', () => {
    expect(
      isDicomRequest(new URL('https://images.example/study/1.dcm'), 'https://images.example/'),
    ).toBe(true)
    expect(
      isDownloadableAssetRequest(
        new URL('/assets/media/clip.mp4', window.location.origin),
        '/assets/dicom/',
      ),
    ).toBe(true)
    expect(
      isDownloadableAssetRequest(
        new URL('/assets/images/cover.svg', window.location.origin),
        '/assets/dicom/',
      ),
    ).toBe(false)
    expect(
      isDownloadableAssetRequest(
        new URL('/assets/models/lung.glb?v=abc', window.location.origin),
        '/assets/dicom/',
      ),
    ).toBe(true)
  })
})
