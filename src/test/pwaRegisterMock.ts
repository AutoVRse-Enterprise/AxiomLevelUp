interface RegisterOptions {
  onRegisteredSW?: () => void
  onNeedRefresh?: () => void
  onOfflineReady?: () => void
  onRegisterError?: (error: unknown) => void
}

let latestOptions: RegisterOptions | undefined
let updateCalls: boolean[] = []

export function registerSW(options?: RegisterOptions) {
  latestOptions = options
  return async (reloadPage = false) => {
    updateCalls.push(reloadPage)
  }
}

export function triggerRegistered() {
  latestOptions?.onRegisteredSW?.()
}

export function triggerNeedRefresh() {
  latestOptions?.onNeedRefresh?.()
}

export function triggerOfflineReady() {
  latestOptions?.onOfflineReady?.()
}

export function triggerRegisterError(error: unknown) {
  latestOptions?.onRegisterError?.(error)
}

export function getUpdateCalls() {
  return [...updateCalls]
}

export function resetPwaRegisterMock() {
  latestOptions = undefined
  updateCalls = []
}
