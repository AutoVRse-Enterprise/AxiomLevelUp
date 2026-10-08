import { useContent } from '@/app/contentContext'

export function SyntheticCaseNotice() {
  const text = useContent().appConfig.games?.notice?.text
  if (!text) return null

  return <p className="text-center text-caption text-neutral-500">{text}</p>
}
