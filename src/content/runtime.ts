import { ContentValidationError, type ContentIssue } from '@/content/errors'
import type { ContentRegistry } from '@/content/loader'

export interface ContentWorkerSuccess {
  type: 'success'
  registry: ContentRegistry
}

export interface ContentWorkerFailure {
  type: 'failure'
  error: {
    name: string
    message: string
    issues?: ContentIssue[]
  }
}

export type ContentWorkerResponse = ContentWorkerSuccess | ContentWorkerFailure

function deserializeError(error: ContentWorkerFailure['error']) {
  if (error.name === 'ContentValidationError' && error.issues) {
    return new ContentValidationError(error.issues)
  }
  const result = new Error(error.message)
  result.name = error.name
  return result
}

export async function loadRuntimeContent(baseUrl = '/content'): Promise<ContentRegistry> {
  if (typeof Worker === 'undefined') {
    const { loadContent } = await import('@/content/loader')
    return loadContent(baseUrl)
  }

  return new Promise<ContentRegistry>((resolve, reject) => {
    const worker = new Worker(new URL('./content.worker.ts', import.meta.url), { type: 'module' })
    const finish = () => worker.terminate()

    worker.onmessage = (event: MessageEvent<ContentWorkerResponse>) => {
      finish()
      if (event.data.type === 'success') {
        resolve(event.data.registry)
      } else {
        reject(deserializeError(event.data.error))
      }
    }
    worker.onerror = (event) => {
      finish()
      reject(new Error(event.message || 'The content validation worker could not start.'))
    }
    worker.postMessage({ baseUrl })
  })
}
