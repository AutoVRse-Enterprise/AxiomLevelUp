import {
  Component,
  Suspense,
  useMemo,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react'

import type { TypedPrimitive } from '@/content/schema/primitives'
import { primitiveComponents } from '@/primitives/componentRegistry'
import { UnsupportedPrimitive } from '@/primitives/components/UnsupportedPrimitive'
import { resolvePrimitiveDefinition } from '@/primitives/definitions'
import type { PrimitiveComponentProps } from '@/primitives/types'

class PrimitiveErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Primitive renderer failed', error, info)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function PrimitiveRenderer(props: PrimitiveComponentProps) {
  const resolved = useMemo(() => resolvePrimitiveDefinition(props.primitive), [props.primitive])
  const fallback = <UnsupportedPrimitive {...props} />
  if (!resolved) return fallback

  const Registered = primitiveComponents[resolved.primitive.type] as ComponentType<
    PrimitiveComponentProps<TypedPrimitive>
  >

  return (
    <PrimitiveErrorBoundary fallback={fallback}>
      <Suspense
        fallback={
          <div className="min-h-48 animate-pulse rounded-xl bg-neutral-100" role="status">
            <span className="sr-only">Loading activity</span>
          </div>
        }
      >
        <Registered {...props} primitive={resolved.primitive} />
      </Suspense>
    </PrimitiveErrorBoundary>
  )
}
