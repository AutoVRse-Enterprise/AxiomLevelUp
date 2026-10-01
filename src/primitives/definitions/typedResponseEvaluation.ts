export function normalizeTextResponse(value: string, caseSensitive = false): string {
  const normalized = value.normalize('NFKC').trim().replace(/\s+/gu, ' ')
  return caseSensitive ? normalized : normalized.toLowerCase()
}

export function parseNumericResponse(value: unknown): number | null {
  if (typeof value !== 'string') return null

  const normalized = value.normalize('NFKC').trim()
  if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/u.test(normalized)) return null

  const parsed = Number(normalized.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}
