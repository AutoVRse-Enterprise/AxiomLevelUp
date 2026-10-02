import { HardDrive, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useContent } from '@/app/contentContext'
import { formatBytes } from '@/components/offline/CourseOfflineControl'
import { Button, Card, ProgressBar } from '@/components/ui'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import { browserStorageAdapter, type StorageEstimate } from '@/offline/platform'
import { getDownloadManager } from '@/offline/runtime'

export function OfflineStorageManager() {
  const registry = useContent()
  const records = useOfflineLibraryStore((state) => state.records)
  const [estimate, setEstimate] = useState<StorageEstimate>({})
  const [persistent, setPersistent] = useState(false)
  const manager = getDownloadManager(registry.appConfig.product.offline)
  const downloads = Object.values(records)

  useEffect(() => {
    void Promise.all([browserStorageAdapter.estimate(), browserStorageAdapter.persisted()]).then(
      ([nextEstimate, nextPersistent]) => {
        setEstimate(nextEstimate)
        setPersistent(nextPersistent)
      },
    )
  }, [records])

  const usage = estimate.usage ?? downloads.reduce((sum, record) => sum + record.downloadedBytes, 0)
  const quota = estimate.quota
  const usagePercentage = quota ? (usage / quota) * 100 : 0

  return (
    <Card className="mt-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 font-bold">
            <HardDrive aria-hidden="true" size={19} /> Device storage
          </h3>
          <p className="mt-1 text-small text-neutral-600">
            {formatBytes(usage)}
            {quota ? ` of ${formatBytes(quota)} used by this site` : ' used by offline downloads'}
            {' · '}
            {persistent ? 'Persistent storage granted' : 'Storage may be cleared by the browser'}
          </p>
        </div>
        {downloads.length ? (
          <Button
            leadingIcon={<Trash2 aria-hidden="true" size={16} />}
            size="sm"
            variant="danger"
            onClick={() => {
              if (window.confirm('Remove all offline course downloads from this device?')) {
                void manager.removeAll()
              }
            }}
          >
            Remove all
          </Button>
        ) : null}
      </div>
      {quota ? (
        <ProgressBar className="mt-4" label="Browser storage usage" value={usagePercentage} />
      ) : null}
      {downloads.length ? (
        <ul className="mt-5 divide-y divide-neutral-200">
          {downloads.map((record) => {
            const course = registry.courseById.get(record.courseId)
            return (
              <li
                className="flex flex-wrap items-center justify-between gap-3 py-3"
                key={record.courseId}
              >
                <div>
                  <p className="font-semibold">{course?.title ?? record.courseId}</p>
                  <p className="text-caption capitalize text-neutral-600">
                    {record.status} · {formatBytes(record.downloadedBytes)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void manager.remove(record.courseId)}
                >
                  Remove
                </Button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-5 text-small text-neutral-600">
          No courses have been downloaded on this device.
        </p>
      )}
    </Card>
  )
}
