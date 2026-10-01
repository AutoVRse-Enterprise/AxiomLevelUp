export type RevealAnswerPolicy = 'never' | 'final_attempt' | 'always'

interface RevealAnswerContext {
  attempt: number
  maxAttempts: number
  retry: boolean
  correct: boolean
}

export function shouldRevealAnswer(
  policy: RevealAnswerPolicy,
  context: RevealAnswerContext,
): boolean {
  if (policy === 'always') return true
  if (policy === 'never') return false

  return context.correct || !context.retry || context.attempt >= context.maxAttempts
}
