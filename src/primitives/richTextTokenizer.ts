export interface RichTextTerm {
  term: string
  definition: string
}

export type RichTextToken =
  | { type: 'text'; text: string }
  | { type: 'emphasis'; text: string }
  | { type: 'term'; text: string; definition: string }

interface Match {
  index: number
  text: string
  type: 'emphasis' | 'term'
  definition?: string
  termIndex?: number
}

function nextMatch(
  text: string,
  from: number,
  terms: readonly RichTextTerm[],
  usedTerms: ReadonlySet<number>,
  emphasis: readonly string[],
): Match | null {
  const lowerText = text.toLocaleLowerCase()
  const matches: Match[] = []

  terms.forEach((entry, termIndex) => {
    if (usedTerms.has(termIndex)) return
    const index = lowerText.indexOf(entry.term.toLocaleLowerCase(), from)
    if (index >= 0) {
      matches.push({
        index,
        text: text.slice(index, index + entry.term.length),
        type: 'term',
        definition: entry.definition,
        termIndex,
      })
    }
  })

  emphasis.forEach((phrase) => {
    const index = lowerText.indexOf(phrase.toLocaleLowerCase(), from)
    if (index >= 0) {
      matches.push({
        index,
        text: text.slice(index, index + phrase.length),
        type: 'emphasis',
      })
    }
  })

  return (
    matches.sort((left, right) => {
      if (left.index !== right.index) return left.index - right.index
      if (left.type !== right.type) return left.type === 'term' ? -1 : 1
      return right.text.length - left.text.length
    })[0] ?? null
  )
}

export function tokenizeRichText(
  text: string,
  terms: readonly RichTextTerm[] = [],
  emphasis: readonly string[] = [],
): RichTextToken[] {
  const tokens: RichTextToken[] = []
  const usedTerms = new Set<number>()
  let position = 0

  while (position < text.length) {
    const match = nextMatch(text, position, terms, usedTerms, emphasis)
    if (!match) {
      tokens.push({ type: 'text', text: text.slice(position) })
      break
    }
    if (match.index > position) {
      tokens.push({ type: 'text', text: text.slice(position, match.index) })
    }
    if (match.type === 'term') {
      usedTerms.add(match.termIndex!)
      tokens.push({
        type: 'term',
        text: match.text,
        definition: match.definition!,
      })
    } else {
      tokens.push({ type: 'emphasis', text: match.text })
    }
    position = match.index + match.text.length
  }

  return tokens
}
