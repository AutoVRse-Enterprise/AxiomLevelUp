let override: Date | null = null

export function now() {
  return override ? new Date(override) : new Date()
}

export function today() {
  const value = now()
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function setClockForTests(value: Date | string | null) {
  override = value === null ? null : new Date(value)
}
