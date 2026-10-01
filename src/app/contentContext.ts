import { createContext, use } from 'react'

import type { ContentRegistry } from '@/content/loader'

export const ContentContext = createContext<ContentRegistry | null>(null)

export function useContent() {
  const content = use(ContentContext)
  if (!content) throw new Error('useContent must be called inside ContentProvider.')
  return content
}
