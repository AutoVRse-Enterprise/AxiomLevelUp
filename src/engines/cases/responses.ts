function comparisonKey(value: unknown) {
  return JSON.stringify(value)
}

export function normalizeCaseResponse(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeCaseResponse(item))
      .sort((left, right) => comparisonKey(left).localeCompare(comparisonKey(right)))
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalizeCaseResponse(item)]),
    )
  }

  return value
}

export function caseResponsesEqual(left: unknown, right: unknown) {
  return comparisonKey(normalizeCaseResponse(left)) === comparisonKey(normalizeCaseResponse(right))
}
