import { ContentValidationError } from '@/content/errors'
import { loadContent } from '@/content/loader'
import type { ContentWorkerResponse } from '@/content/runtime'

interface ContentWorkerRequest {
  baseUrl: string
}

const workerScope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<ContentWorkerRequest>) => void) | null
  postMessage(message: ContentWorkerResponse): void
}

workerScope.onmessage = (event) => {
  void loadContent(event.data.baseUrl)
    .then((registry) => {
      workerScope.postMessage({ type: 'success', registry })
    })
    .catch((reason: unknown) => {
      const error = reason instanceof Error ? reason : new Error(String(reason))
      workerScope.postMessage({
        type: 'failure',
        error: {
          name: error.name,
          message: error.message,
          ...(error instanceof ContentValidationError ? { issues: error.issues } : {}),
        },
      })
    })
}
