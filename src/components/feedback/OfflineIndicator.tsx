import { WifiOff } from 'lucide-react'

import { useConnectivity } from '@/pwa/connectivity'

export function OfflineIndicator() {
  const { online, simulatedOffline } = useConnectivity()
  if (online) return null

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-1 text-caption font-semibold text-warning-700"
      role="status"
    >
      <WifiOff aria-hidden="true" size={14} />
      {simulatedOffline ? 'Offline (simulated)' : 'Offline'}
    </span>
  )
}
