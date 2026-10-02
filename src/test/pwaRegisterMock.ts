interface RegisterOptions {
  onRegisteredSW?: () => void
  onNeedRefresh?: () => void
  onOfflineReady?: () => void
  onRegisterError?: (error: unknown) => void
}

export function registerSW(options?: RegisterOptions) {
  void options
  return async () => undefined
}
