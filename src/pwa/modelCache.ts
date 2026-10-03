const SHA_256_PATTERN = /^[a-f0-9]{64}$/
const HASHED_GLB_PATTERN = /(?:[.-])[a-f0-9]{8,64}\.glb$/i

export interface VersionedModelAsset {
  path: string
  type: string
  sha256?: string
}

export function versionedModelUrl(asset: VersionedModelAsset): string {
  if (asset.type !== 'model' || !asset.sha256 || !SHA_256_PATTERN.test(asset.sha256)) {
    return asset.path
  }

  const separator = asset.path.includes('?') ? '&' : '?'
  return `${asset.path}${separator}v=${asset.sha256}`
}

export function isVersionedGlbRequest(url: URL): boolean {
  if (!url.pathname.toLowerCase().endsWith('.glb')) return false
  return (
    SHA_256_PATTERN.test(url.searchParams.get('v') ?? '') || HASHED_GLB_PATTERN.test(url.pathname)
  )
}

export async function prefetchVersionedModel(
  url: string,
  options: { signal?: AbortSignal; fetcher?: typeof fetch } = {},
): Promise<void> {
  const parsedUrl = new URL(url, globalThis.location?.origin ?? 'https://runtime.invalid')
  if (!isVersionedGlbRequest(parsedUrl)) {
    throw new Error('The configured 3D model URL is not hash-versioned.')
  }

  const response = await (options.fetcher ?? fetch)(url, {
    credentials: 'same-origin',
    signal: options.signal,
  })
  if (!response.ok) {
    throw new Error(`The 3D model preload returned HTTP ${response.status}.`)
  }

  await response.arrayBuffer()
}
