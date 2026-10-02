import { Check, Download, RefreshCw, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'

import { useContent } from '@/app/contentContext'
import { Button, InlineNotice, ProgressBar } from '@/components/ui'
import type { Course } from '@/content/schema'
import { getDownloadManager } from '@/offline/runtime'
import { formatBytes } from '@/offline/format'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import { buildCoursePackage } from '@/offline/package'
import { isCourseOfflineReady } from '@/offline/readiness'
import { useConnectivity } from '@/pwa/connectivity'

export function CourseOfflineControl({ course }: { course: Course }) {
  const registry = useContent()
  const { online } = useConnectivity()
  const record = useOfflineLibraryStore((state) => state.records[course.id])
  const coursePackage = useMemo(
    () =>
      buildCoursePackage(
        course,
        registry,
        import.meta.env.VITE_DICOM_BASE_URL?.trim() || '/assets/dicom/',
      ),
    [course, registry],
  )
  const manager = getDownloadManager(registry.appConfig.product.offline)
  const ready = isCourseOfflineReady(coursePackage, record)

  if (coursePackage.totalBytes === 0) {
    return (
      <p className="mt-4 inline-flex items-center gap-2 text-small font-semibold text-success-700">
        <Check aria-hidden="true" size={17} /> Available offline
      </p>
    )
  }

  if (record?.status === 'queued' || record?.status === 'downloading') {
    const progress =
      record.totalBytes > 0 ? (record.downloadedBytes / record.totalBytes) * 100 : 0
    return (
      <div className="mt-5 max-w-md space-y-3" aria-live="polite">
        <ProgressBar label="Offline download" value={progress} />
        <div className="flex flex-wrap items-center justify-between gap-3 text-small">
          <span>
            {formatBytes(record.downloadedBytes)} of {formatBytes(record.totalBytes)}
          </span>
          <Button size="sm" variant="ghost" onClick={() => manager.cancel(course.id)}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  if (ready) {
    return (
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-small font-semibold text-success-700">
          <Check aria-hidden="true" size={17} /> Downloaded ·{' '}
          {formatBytes(record?.totalBytes ?? coursePackage.totalBytes)}
        </span>
        <Button
          leadingIcon={<Trash2 aria-hidden="true" size={16} />}
          size="sm"
          variant="ghost"
          onClick={() => {
            if (window.confirm(`Remove the offline copy of ${course.title}?`)) {
              void manager.remove(course.id)
            }
          }}
        >
          Remove
        </Button>
      </div>
    )
  }

  const retryLabel =
    record?.status === 'outdated'
      ? 'Update download'
      : record?.status === 'incomplete'
        ? 'Repair download'
        : record?.status === 'paused' || record?.status === 'failed'
          ? 'Retry download'
          : 'Download for offline'

  return (
    <div className="mt-5 max-w-md">
      <Button
        disabled={!online}
        leadingIcon={
          record ? <RefreshCw aria-hidden="true" size={17} /> : <Download aria-hidden="true" size={17} />
        }
        variant="secondary"
        onClick={() => void manager.download(coursePackage, registry).catch(() => undefined)}
      >
        {retryLabel} · {formatBytes(coursePackage.totalBytes)}
      </Button>
      {record?.error ? (
        <InlineNotice
          action={
            record.error.kind === 'quota' ? (
              <Link className="font-semibold underline underline-offset-4" to="/profile">
                Manage offline storage
              </Link>
            ) : undefined
          }
          className="mt-3"
          message={
            record.error.kind === 'quota'
              ? `${record.error.message} This course requires ${formatBytes(coursePackage.totalBytes)}.`
              : record.error.message
          }
          title={record.error.kind === 'quota' ? 'Not enough device storage' : 'Download interrupted'}
          tone="danger"
        />
      ) : !online ? (
        <p className="mt-2 text-small text-neutral-600">Connect to download this course.</p>
      ) : (
        <p className="mt-2 text-caption text-neutral-600">
          Keep this app open until the download finishes.
        </p>
      )}
    </div>
  )
}
