import {
  Brain,
  CalendarCheck,
  ChartScatter,
  ClipboardCheck,
  Flame,
  Focus,
  Scan,
  ScanLine,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'

const badgeIcons: Record<string, LucideIcon> = {
  brain: Brain,
  'calendar-check': CalendarCheck,
  'chart-scatter': ChartScatter,
  'clipboard-check': ClipboardCheck,
  flame: Flame,
  focus: Focus,
  scan: Scan,
  'scan-line': ScanLine,
  sparkles: Sparkles,
  target: Target,
}

export function getBadgeIcon(id: string) {
  return badgeIcons[id] ?? Sparkles
}
