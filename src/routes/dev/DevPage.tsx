import { Link } from 'react-router'

import { Card, Chip } from '@/components/ui'

const tools = [
  { to: '/dev/tokens', title: 'Design tokens', description: 'Palette, type and base components' },
  {
    to: '/dev/dicom-spike',
    title: 'DICOM/PWA spike',
    description: 'Lazy Cornerstone3D feasibility route',
  },
]

export function DevPage() {
  return (
    <div>
      <Chip tone="warning">URL-only development area</Chip>
      <h1 className="mt-3 text-title font-bold">Runtime tools</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link className="rounded-lg focus-visible:outline-2" key={tool.to} to={tool.to}>
            <Card className="h-full transition-transform hover:-translate-y-0.5">
              <h2 className="font-bold">{tool.title}</h2>
              <p className="mt-2 text-small text-neutral-600">{tool.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
