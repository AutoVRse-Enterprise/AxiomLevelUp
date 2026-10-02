interface RegisterOptions {
  onRegisteredSW?: () => void
  onNeedRefresh?: () => void
  onOfflineReady?: () => void
  onRegisterError?: (error: unknown) => void
}

export function registerSW(_options?: RegisterOptions) {
  return async () => undefined
}
