import { afterEach, describe, expect, it, vi } from 'vitest'

import { ContentValidationError } from '@/content/errors'
import type { ContentRegistry } from '@/content/loader'
import { loadRuntimeContent, type ContentWorkerResponse } from '@/content/runtime'

let response: ContentWorkerResponse
let constructedOptions: WorkerOptions | null = null
const terminateWorker = vi.fn()

class MockWorker {
  onmessage: ((event: MessageEvent<ContentWorkerResponse>) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  terminated = false

  constructor(
    readonly url: URL,
    readonly options: WorkerOptions,
  ) {
    constructedOptions = options
  }

  postMessage() {
    queueMicrotask(() =>
      this.onmessage?.({ data: response } as MessageEvent<ContentWorkerResponse>),
    )
  }

  terminate() {
    this.terminated = true
    terminateWorker()
  }
}

describe('runtime content worker', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    constructedOptions = null
    terminateWorker.mockClear()
  })

  it('returns the validated registry and terminates the worker', async () => {
    const registry = {
      courseById: new Map(),
      lessonById: new Map(),
    } as unknown as ContentRegistry
    response = { type: 'success', registry }
    vi.stubGlobal('Worker', MockWorker)

    await expect(loadRuntimeContent()).resolves.toBe(registry)
    expect(constructedOptions).toEqual({ type: 'module' })
    expect(terminateWorker).toHaveBeenCalledOnce()
  })

  it('reconstructs validation errors for the eager error screen', async () => {
    response = {
      type: 'failure',
      error: {
        name: 'ContentValidationError',
        message: 'Content validation failed with 1 issue.',
        issues: [
          {
            file: 'content/app-config.json',
            path: 'product',
            message: 'Required',
            severity: 'error',
          },
        ],
      },
    }
    vi.stubGlobal('Worker', MockWorker)

    const promise = loadRuntimeContent()
    await expect(promise).rejects.toBeInstanceOf(ContentValidationError)
    await expect(promise).rejects.toMatchObject({
      issues: [expect.objectContaining({ file: 'content/app-config.json' })],
    })
    expect(terminateWorker).toHaveBeenCalledOnce()
  })
})
