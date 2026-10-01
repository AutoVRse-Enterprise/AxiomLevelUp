import { AlertTriangle } from 'lucide-react'

import { Button, Card } from '@/components/ui'
import { ContentValidationError } from '@/content/loader'

export function ContentErrorScreen({ error }: { error: Error }) {
  const issues =
    error instanceof ContentValidationError
      ? error.issues
      : [{ file: 'runtime', path: '$', message: error.message, severity: 'error' as const }]

  return (
    <main className="mx-auto max-w-3xl p-5 sm:p-8">
      <Card className="border-danger-600/20">
        <AlertTriangle aria-hidden="true" className="text-danger-700" />
        <h1 className="mt-4 text-title font-bold">Course content could not be loaded</h1>
        <p className="mt-2 text-neutral-600">
          Fix the configuration issues below, then reload the runtime.
        </p>
        <ul className="mt-6 space-y-3">
          {issues.map((issue, index) => (
            <li className="rounded-md bg-danger-50 p-4" key={`${issue.file}-${issue.path}-${index}`}>
              <code className="text-small font-semibold text-danger-700">{issue.file}</code>
              <p className="mt-1 text-small text-neutral-700">
                <code>{issue.path}</code>: {issue.message}
              </p>
            </li>
          ))}
        </ul>
        <Button className="mt-6" variant="secondary" onClick={() => window.location.reload()}>
          Reload content
        </Button>
      </Card>
    </main>
  )
}
