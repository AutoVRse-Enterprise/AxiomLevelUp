import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { idbStorage } from '@/state/persistence/idbStorage'
import type { OfflinePackageKind } from '@/offline/package'

export type OfflineDownloadStatus =
  'queued' | 'downloading' | 'paused' | 'available' | 'incomplete' | 'outdated' | 'failed'

export type OfflineFailureKind = 'network' | 'integrity' | 'quota' | 'cancelled' | 'cache'

export interface OfflineDownloadRecord {
  key: string
  packageKind: OfflinePackageKind
  packageId: string
  status: OfflineDownloadStatus
  downloadedBytes: number
  totalBytes: number
  urls: readonly string[]
  assetUrls: Readonly<Record<string, readonly string[]>>
  fingerprint: string
  verifiedAt: string | null
  error: { kind: OfflineFailureKind; message: string } | null
}

interface OfflineLibraryStore {
  records: Record<string, OfflineDownloadRecord>
  hydrated: boolean
  setRecord: (record: OfflineDownloadRecord) => void
  updateRecord: (
    key: string,
    update:
      | Partial<OfflineDownloadRecord>
      | ((record: OfflineDownloadRecord) => Partial<OfflineDownloadRecord>),
  ) => void
  removeRecord: (key: string) => void
  clear: () => void
  setHydrated: (hydrated: boolean) => void
}

export const useOfflineLibraryStore = create<OfflineLibraryStore>()(
  persist(
    (set) => ({
      records: {},
      hydrated: false,
      setRecord: (record) =>
        set((state) => ({ records: { ...state.records, [record.key]: record } })),
      updateRecord: (key, update) =>
        set((state) => {
          const current = state.records[key]
          if (!current) return state
          const patch = typeof update === 'function' ? update(current) : update
          return { records: { ...state.records, [key]: { ...current, ...patch } } }
        }),
      removeRecord: (key) =>
        set((state) => {
          const records = { ...state.records }
          delete records[key]
          return { records }
        }),
      clear: () => set({ records: {} }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'offline-library',
      version: 2,
      storage: createJSONStorage(() => idbStorage),
      migrate: (persistedState) => {
        const state = persistedState as {
          records?: Record<string, OfflineDownloadRecord & { courseId?: string }>
        }
        const records = Object.fromEntries(
          Object.entries(state.records ?? {}).map(([key, record]) => [
            key,
            record.packageKind
              ? record
              : {
                  ...record,
                  key,
                  packageKind: 'course' as const,
                  packageId: record.courseId ?? key,
                },
          ]),
        )
        return { ...state, records }
      },
      partialize: ({ records }) => ({ records }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
)

export function offlineLibrarySnapshot() {
  return useOfflineLibraryStore.getState().records
}
