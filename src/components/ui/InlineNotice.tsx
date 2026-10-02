import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type NoticeTone = 'info' | 'success' | 'warning' | 'danger'

const tones: Record<NoticeTone, string> = {
  info: 'bg-info-50 text-info-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
}

const icons: Record<NoticeTone, ReactNode> = {
  info: <Info aria-hidden="true" size={19} />,
  success: <CircleCheck aria-hidden="true" size={19} />,
  warning: <TriangleAlert aria-hidden="true" size={19} />,
  danger: <CircleAlert aria-hidden="true" size={19} />,
}

interface InlineNoticeProps {
  title: string
  message?: string
  tone?: NoticeTone
  action?: ReactNode
  className?: string
}

export function InlineNotice({
  title,
  message,
  tone = 'info',
  action,
  className,
}: InlineNoticeProps) {
  return (
    <aside
      className={cn(
        'flex items-start gap-3 rounded-lg border border-current/20 p-4',
        tones[tone],
        className,
      )}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <span className="mt-0.5 shrink-0">{icons[tone]}</span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        {message ? <p className="mt-1 text-small opacity-90">{message}</p> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </aside>
  )
}
