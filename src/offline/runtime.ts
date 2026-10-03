import type { AppConfig } from '@/content/schema'
import { emitEvent } from '@/events/bus'
import { DownloadManager, type DownloadManagerEvent } from '@/offline/downloadManager'

let manager: DownloadManager | null = null

function emitDownloadEvent(event: DownloadManagerEvent) {
  if (event.packageKind !== 'course') return
  switch (event.type) {
    case 'started':
      emitEvent({
        event: 'course_download_started',
        courseId: event.packageId,
        bytes: event.bytes,
      })
      return
    case 'completed':
      emitEvent({ event: 'course_downloaded', courseId: event.packageId, bytes: event.bytes })
      return
    case 'failed':
      emitEvent({
        event: 'course_download_failed',
        courseId: event.packageId,
        reason: event.reason === 'cache' ? 'integrity' : event.reason,
      })
      return
    case 'removed':
      emitEvent({
        event: 'course_download_removed',
        courseId: event.packageId,
        bytes: event.bytes,
      })
  }
}

export function getDownloadManager(configuration: AppConfig['product']['offline']) {
  manager ??= new DownloadManager(configuration, { onEvent: emitDownloadEvent })
  return manager
}

export function resetDownloadManagerForTests() {
  manager = null
}
