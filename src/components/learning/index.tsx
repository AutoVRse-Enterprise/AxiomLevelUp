import {
  Check,
  Download,
  LockKeyhole,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { m } from 'motion/react'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import { Link } from 'react-router'

import type { AppConfig } from '@/content/schema'
import { Card, Chip, ProgressBar } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { LearningStatus } from '@/state/selectors'

const statusLabels: Record<LearningStatus, string> = {
  completed: 'Completed',
  in_progress: 'In progress',
  available: 'Available',
  locked: 'Locked',
  new: 'New',
}

const statusTones: Record<LearningStatus, 'success' | 'brand' | 'neutral' | 'warning'> = {
  completed: 'success',
  in_progress: 'brand',
  available: 'neutral',
  locked: 'neutral',
  new: 'warning',
}

export function StatusBadge({ status }: { status: LearningStatus }) {
  return (
    <Chip tone={statusTones[status]}>
      {status === 'locked' ? <LockKeyhole aria-hidden="true" className="mr-1" size={13} /> : null}
      {status === 'completed' ? <Check aria-hidden="true" className="mr-1" size={13} /> : null}
      {statusLabels[status]}
    </Chip>
  )
}

export function StarRating({ value }: { value: number }) {
  return (
    <span aria-label={`${value} of 3 stars`} className="inline-flex gap-0.5 text-star">
      {[1, 2, 3].map((star) => (
        <Star aria-hidden="true" fill={star <= value ? 'currentColor' : 'none'} key={star} size={16} />
      ))}
    </span>
  )
}

export function Avatar({ name, src, className }: { name: string; src?: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return src ? (
    <img alt="" className={cn('size-11 rounded-full object-cover', className)} src={src} />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-800',
        className,
      )}
    >
      {initials}
    </span>
  )
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-heading font-bold">{title}</h2>
        {description ? <p className="mt-1 text-small text-neutral-600">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function StatTile({
  label,
  value,
  icon,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2 text-neutral-600">
        {icon}
        <span className="text-caption font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-title font-bold tabular-nums text-neutral-900">{value}</div>
    </div>
  )
}

export function MasteryBar({ label, value }: { label: string; value: number }) {
  return <ProgressBar label={label} value={value} />
}

export function WeeklyActivityStrip({
  days,
  completedCount,
  targetDays,
}: {
  days: Array<{ date: string; label: string; completed: boolean; isToday: boolean }>
  completedCount: number
  targetDays: number
}) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-2" role="list" aria-label="Learning activity this week">
        {days.map((day) => (
          <div className="text-center" key={day.date} role="listitem">
            <span className="text-caption text-neutral-600">{day.label}</span>
            <m.span
              animate={{ opacity: 1, scale: 1 }}
              aria-label={`${day.date}: ${day.completed ? 'learning completed' : 'no learning'}${day.isToday ? ', today' : ''}`}
              className={cn(
                'mx-auto mt-2 grid size-9 place-items-center rounded-full border text-small font-bold',
                day.completed
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-neutral-200 bg-white text-neutral-400',
                day.isToday && 'ring-2 ring-brand-200 ring-offset-2',
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              role="img"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            >
              {day.completed ? <Check aria-hidden="true" size={16} /> : '·'}
            </m.span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-small font-medium text-neutral-700">
        {completedCount} of {targetDays} goal days complete
      </p>
    </div>
  )
}

export function LockReason({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <p className="flex items-start gap-2 text-small text-neutral-600" role="status">
      <LockKeyhole aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
      Complete {items.join(' and ')} first
    </p>
  )
}

export function CourseCard({
  id,
  title,
  description,
  category,
  imageUrl,
  difficulty,
  estimatedMinutes,
  completion,
  lessonCount,
  status,
  lockReasons = [],
  offlineReady = false,
}: {
  id: string
  title: string
  description: string
  category: string
  imageUrl?: string
  difficulty: string
  estimatedMinutes: number
  completion: number
  lessonCount: number
  status: LearningStatus
  lockReasons?: string[]
  offlineReady?: boolean
}) {
  return (
    <Card interactive className="flex h-full flex-col overflow-hidden p-0 sm:p-0">
      {imageUrl ? <img alt="" className="h-32 w-full object-cover" src={imageUrl} /> : null}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="brand">{category}</Chip>
          <StatusBadge status={status} />
          {offlineReady ? (
            <Chip tone="success">
              <Download aria-hidden="true" className="mr-1" size={13} />
              Offline
            </Chip>
          ) : null}
        </div>
        <h3 className="mt-4 text-heading font-bold">{title}</h3>
        <p className="mt-2 line-clamp-2 text-small text-neutral-600">{description}</p>
        <p className="mt-3 text-caption font-medium text-neutral-600">
          {difficulty} · {estimatedMinutes} min · {lessonCount} lessons
        </p>
        <ProgressBar className="mt-4" label="Course progress" value={completion} />
        <div className="mt-4">
          {status === 'locked' ? (
            <LockReason items={lockReasons} />
          ) : (
            <Link className="font-semibold text-brand-700 underline-offset-4 hover:underline" to={`/learn/courses/${id}`}>
              View course
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}

export function LessonRow({
  title,
  description,
  estimatedMinutes,
  difficulty,
  status,
  stars,
  bestScore,
  lockReasons,
  to,
  offlineReady = false,
}: {
  title: string
  description: string
  estimatedMinutes: number
  difficulty: string
  status: LearningStatus
  stars: number
  bestScore: number | null
  lockReasons: string[]
  to: string
  offlineReady?: boolean
}) {
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        {offlineReady ? (
          <Chip tone="success">
            <Download aria-hidden="true" className="mr-1" size={13} />
            Offline
          </Chip>
        ) : null}
        <span className="text-caption text-neutral-600">
          {difficulty} · {estimatedMinutes} min
        </span>
      </div>
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1 text-small text-neutral-600">{description}</p>
      {status === 'completed' ? (
        <div className="mt-3 flex items-center gap-3">
          <StarRating value={stars} />
          {bestScore !== null ? <span className="text-small text-neutral-600">Best {bestScore}%</span> : null}
        </div>
      ) : null}
      {status === 'locked' ? <div className="mt-3"><LockReason items={lockReasons} /></div> : null}
    </>
  )
  return status === 'locked' ? (
    <div aria-disabled="true" className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 opacity-80">
      {content}
    </div>
  ) : (
    <Link
      className="block rounded-lg border border-neutral-200 bg-white p-5 shadow-card transition hover:border-brand-300 focus-visible:outline-2"
      to={to}
    >
      {content}
    </Link>
  )
}

export function BadgeTile({
  title,
  description,
  icon: Icon,
  unlocked,
  progress,
  unlockedLabel,
}: {
  title: string
  description: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  unlocked: boolean
  progress?: number
  unlockedLabel?: string
}) {
  return (
    <div className={cn('rounded-lg border p-4', unlocked ? 'border-badge/30 bg-info-50' : 'border-neutral-200 bg-neutral-50')}>
      <Icon aria-hidden="true" className={unlocked ? 'text-badge' : 'text-neutral-400'} height={28} width={28} />
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1 text-small text-neutral-600">{description}</p>
      <p className="mt-3 text-caption font-semibold text-neutral-600">
        {unlocked ? unlockedLabel ?? 'Unlocked' : `${Math.round(progress ?? 0)}% complete`}
      </p>
    </div>
  )
}

export function LeaderboardRow({
  rank,
  name,
  xp,
  movement,
  current,
}: {
  rank: number
  name: string
  xp: number
  movement: number
  current: boolean
}) {
  return (
    <li
      aria-current={current ? 'true' : undefined}
      className={cn(
        'grid grid-cols-[2rem_2.75rem_1fr_auto] items-center gap-3 rounded-md px-3 py-3',
        current ? 'bg-brand-50 ring-1 ring-brand-200' : 'bg-white',
      )}
    >
      <span className="font-bold tabular-nums text-neutral-600">{rank}</span>
      <Avatar name={name} />
      <div className="min-w-0">
        <p className="truncate font-semibold">{name}{current ? ' (you)' : ''}</p>
        <p className="flex items-center gap-1 text-caption text-neutral-600">
          {movement > 0 ? <TrendingUp aria-hidden="true" size={13} /> : null}
          {movement < 0 ? <TrendingDown aria-hidden="true" size={13} /> : null}
          {movement === 0 ? 'No change' : `${Math.abs(movement)} ${movement > 0 ? 'up' : 'down'}`}
        </p>
      </div>
      <span className="font-bold tabular-nums">{xp.toLocaleString()} XP</span>
    </li>
  )
}

export function FallbackBadgeIcon(props: SVGProps<SVGSVGElement>) {
  return <Sparkles {...props} />
}

export type BadgeDefinition = AppConfig['badges'][number]
