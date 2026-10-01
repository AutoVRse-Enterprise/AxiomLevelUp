const DAY_MS = 86_400_000

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, 12)
}

export function formatLocalDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function localDateFromTimestamp(value: string) {
  return formatLocalDate(new Date(value))
}

export function addLocalDays(value: string, days: number) {
  const date = parseLocalDate(value)
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}

export function differenceInLocalDays(left: string, right: string) {
  return Math.round((parseLocalDate(left).getTime() - parseLocalDate(right).getTime()) / DAY_MS)
}

export function startOfLocalWeek(value: string, weekStartsOn: number) {
  const date = parseLocalDate(value)
  const offset = (date.getDay() - weekStartsOn + 7) % 7
  date.setDate(date.getDate() - offset)
  return formatLocalDate(date)
}

export function periodKey(type: 'daily' | 'weekly', date: string, weekStartsOn: number) {
  return type === 'daily' ? date : startOfLocalWeek(date, weekStartsOn)
}
