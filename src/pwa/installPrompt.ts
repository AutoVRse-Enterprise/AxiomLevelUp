export function installPromptEligible(
  completedLessons: number,
  minimum: number,
  dismissedAt: string | undefined,
  cooldownDays: number,
  now = Date.now(),
) {
  if (completedLessons < minimum) return false
  if (!dismissedAt) return true
  return now - new Date(dismissedAt).getTime() >= cooldownDays * 86_400_000
}
