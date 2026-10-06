import { AlertTriangle } from 'lucide-react'

import { Button, Card } from '@/components/ui'
import { ContentValidationError } from '@/content/errors'
import type { ExperienceShellCopy } from '@/app/experienceShell'

export function ContentErrorScreen({
  error,
  copy = {
    title: 'Course content could not be loaded',
    message:
      'The course configuration did not pass validation. Reload after the content source has been corrected.',
    reloadLabel: 'Reload content',
  },
}: {
  error: Error
  copy?: ExperienceShellCopy['contentError']
}) {
  const issues =
    error instanceof ContentValidationError
      ? error.issues
      : [{ file: 'runtime', path: '$', message: error.message, severity: 'error' as const }]

  return (
    <main className="mx-auto max-w-3xl p-5 sm:p-8">
      <Card className="border-danger-600/20">
        <AlertTriangle aria-hidden="true" className="text-danger-700" />
        <h1 className="mt-4 text-title font-bold">{copy.title}</h1>
        <p className="mt-2 text-neutral-600">{copy.message}</p>
        <details className="mt-5 rounded-lg bg-danger-50 p-4">
          <summary className="cursor-pointer font-semibold text-danger-700">
            Technical details ({issues.length})
          </summary>
          <ul className="mt-4 space-y-3">
            {issues.map((issue, index) => (
              <li key={`${issue.file}-${issue.path}-${index}`}>
                <code className="text-small font-semibold text-danger-700">{issue.file}</code>
                <p className="mt-1 text-small text-neutral-700">
                  <code>{issue.path}</code>: {issue.message}
                </p>
              </li>
            ))}
          </ul>
        </details>
        <Button className="mt-6" variant="secondary" onClick={() => window.location.reload()}>
          {copy.reloadLabel}
        </Button>
      </Card>
    </main>
  )
}
