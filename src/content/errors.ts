export interface ContentIssue {
  file: string
  path: string
  message: string
  severity: 'error' | 'warning'
}

export class ContentValidationError extends Error {
  constructor(readonly issues: ContentIssue[]) {
    super(`Content validation failed with ${issues.length} issue${issues.length === 1 ? '' : 's'}.`)
    this.name = 'ContentValidationError'
  }
}
