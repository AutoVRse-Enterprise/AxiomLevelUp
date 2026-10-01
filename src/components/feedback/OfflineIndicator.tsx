import { WifiOff } from 'lucide-react'

import { useOnlineStatus } from '@/pwa/useOnlineStatus'

export function OfflineIndicator() {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-1 text-caption font-semibold text-warning-700"
      role="status"
    >
      <WifiOff aria-hidden="true" size={14} />
      Offline
    </span>
  )
}
