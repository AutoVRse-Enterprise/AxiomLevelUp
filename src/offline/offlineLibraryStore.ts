import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { idbStorage } from '@/state/persistence/idbStorage'

export type OfflineDownloadStatus =
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'available'
  | 'incomplete'
  | 'outdated'
  | 'failed'

export type OfflineFailureKind = 'network' | 'integrity' | 'quota' | 'cancelled' | 'cache'

export interface OfflineDownloadRecord {
  courseId: string
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
    courseId: string,
    update:
      | Partial<OfflineDownloadRecord>
      | ((record: OfflineDownloadRecord) => Partial<OfflineDownloadRecord>),
  ) => void
  removeRecord: (courseId: string) => void
  clear: () => void
  setHydrated: (hydrated: boolean) => void
}

export const useOfflineLibraryStore = create<OfflineLibraryStore>()(
  persist(
    (set) => ({
      records: {},
      hydrated: false,
      setRecord: (record) =>
        set((state) => ({ records: { ...state.records, [record.courseId]: record } })),
      updateRecord: (courseId, update) =>
        set((state) => {
          const current = state.records[courseId]
          if (!current) return state
          const patch = typeof update === 'function' ? update(current) : update
          return { records: { ...state.records, [courseId]: { ...current, ...patch } } }
        }),
      removeRecord: (courseId) =>
        set((state) => {
          const records = { ...state.records }
          delete records[courseId]
          return { records }
        }),
      clear: () => set({ records: {} }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'offline-library',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: ({ records }) => ({ records }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
)

export function offlineLibrarySnapshot() {
  return useOfflineLibraryStore.getState().records
}
