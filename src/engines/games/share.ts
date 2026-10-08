import { encodeChallenge, type ChallengePayload } from '@/engines/games/links'

export function buildChallengeUrl(origin: string, payload: ChallengePayload): string {
  return new URL(`/c/${encodeChallenge(payload)}`, origin).toString()
}

export function formatShareMessage(
  template: string,
  values: { score: number; gameTitle: string },
): string {
  return template
    .replaceAll('{score}', values.score.toLocaleString())
    .replaceAll('{gameTitle}', values.gameTitle)
}

export function shareChannelUrls(message: string, url: string) {
  const body = encodeURIComponent(`${message}\n${url}`)
  return {
    messaging: `sms:?&body=${body}`,
    email: `mailto:?subject=${encodeURIComponent('Can you beat my score?')}&body=${body}`,
  }
}
