const courseAssetExtensions = new Set([
  'dcm',
  'dicom',
  'jpg',
  'jpeg',
  'mp4',
  'm4a',
  'mp3',
  'wav',
  'vtt',
  'pdf',
  'txt',
])

export function isDicomRequest(url: URL, dicomBaseUrl: string) {
  const base = new URL(dicomBaseUrl, url.origin)
  return url.href.startsWith(base.href)
}

export function isDownloadableAssetRequest(url: URL, dicomBaseUrl: string) {
  if (isDicomRequest(url, dicomBaseUrl)) return true
  if (url.origin !== globalThis.location?.origin || !url.pathname.startsWith('/assets/')) {
    return false
  }
  const extension = url.pathname.split('.').pop()?.toLowerCase()
  return extension ? courseAssetExtensions.has(extension) : false
}
