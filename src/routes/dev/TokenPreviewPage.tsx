import { FlaskConical, Plus } from 'lucide-react'
import { useState } from 'react'

import {
  AnimatedNumber,
  Button,
  Card,
  Chip,
  InlineNotice,
  LoadingState,
  ProgressBar,
  Sheet,
  Skeleton,
} from '@/components/ui'

interface ColorPreview {
  className: string
  label: string
  value?: string
}

const colorGroups: Array<{ name: string; colors: ColorPreview[] }> = [
  {
    name: 'Autovrse accents',
    colors: [
      { className: 'bg-primary', label: 'Primary', value: '#5C4ACF' },
      { className: 'bg-primary-strong', label: 'Primary strong', value: '#8564D4' },
      { className: 'bg-accent', label: 'Accent', value: '#7E48B7' },
      {
        className: 'bg-accent-decorative',
        label: 'Decorative only',
        value: '#C46DD2',
      },
    ],
  },
  {
    name: 'Semantic',
    colors: [
      { className: 'bg-success-600', label: 'Success' },
      { className: 'bg-warning-600', label: 'Warning' },
      { className: 'bg-danger-600', label: 'Danger' },
      { className: 'bg-info-600', label: 'Information' },
    ],
  },
  {
    name: 'Game',
    colors: [
      { className: 'bg-xp', label: 'XP' },
      { className: 'bg-streak', label: 'Streak' },
      { className: 'bg-badge', label: 'Badge' },
      { className: 'bg-star', label: 'Star' },
    ],
  },
  {
    name: 'Clinical',
    colors: [
      { className: 'bg-clinical-700', label: 'Clinical 700' },
      { className: 'bg-clinical-800', label: 'Clinical 800' },
      { className: 'bg-clinical-900', label: 'Clinical 900' },
      { className: 'bg-clinical-950', label: 'Clinical 950' },
    ],
  },
]

export function TokenPreviewPage() {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-5 sm:p-8">
      <header>
        <Chip tone="brand">Internal preview</Chip>
        <h1 className="mt-3 text-display font-bold tracking-tight">Design foundation</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          Scientific content stays restrained; progress and rewards carry the visual energy.
        </p>
      </header>

      <section aria-labelledby="colors-heading">
        <h2 id="colors-heading" className="text-heading font-bold">
          Color tokens
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {colorGroups.map((group) => (
            <Card interactive key={group.name}>
              <h3 className="font-semibold">{group.name}</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {group.colors.map(({ className, label, value }) => (
                  <div key={className}>
                    <div
                      aria-label={`${label} color sample${value ? ` ${value}` : ''}`}
                      className={`aspect-[2/1] rounded-md ${className}`}
                    />
                    <p className="mt-1 text-caption text-neutral-600">
                      {label}
                      {value ? ` · ${value}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <h2 className="text-heading font-bold">Components</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button leadingIcon={<Plus aria-hidden="true" size={18} />}>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Quiet action</Button>
          <Button variant="danger">Destructive</Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Chip tone="success">Completed</Chip>
          <Chip tone="warning">In progress</Chip>
          <Chip>Locked</Chip>
        </div>
        <ProgressBar className="mt-6" label="Course progress" value={64} />
        <p className="mt-5 text-title font-bold text-xp">
          +<AnimatedNumber value={135} /> XP
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InlineNotice
            message="This reusable notice supports a recovery action."
            title="Designed feedback"
            tone="success"
          />
          <LoadingState compact title="Preparing artifact" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <div className="rounded-lg bg-clinical-950 p-5 text-white">
            <FlaskConical aria-hidden="true" />
            <p className="mt-4 font-semibold">Clinical artifact surface</p>
          </div>
        </div>
        <Button className="mt-6" variant="secondary" onClick={() => setSheetOpen(true)}>
          Open sheet
        </Button>
      </Card>

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Accessible sheet"
        description="Focus is trapped and returned by Radix Dialog."
      >
        <p className="text-neutral-700">
          This adapts from a mobile bottom sheet to a desktop panel.
        </p>
      </Sheet>
    </div>
  )
}
