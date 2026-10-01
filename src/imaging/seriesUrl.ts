const DEFAULT_DICOM_BASE_URL = '/assets/dicom/'

export function dicomBaseUrl(configured = import.meta.env.VITE_DICOM_BASE_URL): URL {
  const base = configured?.trim() || DEFAULT_DICOM_BASE_URL
  const normalized = base.endsWith('/') ? base : `${base}/`
  return new URL(normalized, window.location.origin)
}

export function resolveDicomUrl(path: string, configured?: string): URL {
  const normalizedPath = path.replace(/^\/+/, '')
  return new URL(normalizedPath, dicomBaseUrl(configured))
}
