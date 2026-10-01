import { FlaskConical, Plus } from 'lucide-react'
import { useState } from 'react'

import { Button, Card, Chip, ProgressBar, Sheet, Skeleton } from '@/components/ui'

const colorGroups = [
  { name: 'Brand', classes: ['bg-brand-100', 'bg-brand-300', 'bg-brand-500', 'bg-brand-700'] },
  {
    name: 'Semantic',
    classes: ['bg-success-600', 'bg-warning-600', 'bg-danger-600', 'bg-info-600'],
  },
  { name: 'Game', classes: ['bg-xp', 'bg-streak', 'bg-badge', 'bg-star'] },
  {
    name: 'Clinical',
    classes: ['bg-clinical-700', 'bg-clinical-800', 'bg-clinical-900', 'bg-clinical-950'],
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
            <Card key={group.name}>
              <h3 className="font-semibold">{group.name}</h3>
              <div className="mt-3 flex gap-2">
                {group.classes.map((className) => (
                  <div
                    aria-label={`${group.name} color sample`}
                    className={`aspect-square flex-1 rounded-md ${className}`}
                    key={className}
                  />
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
        <p className="text-neutral-700">This adapts from a mobile bottom sheet to a desktop panel.</p>
      </Sheet>
    </div>
  )
}
