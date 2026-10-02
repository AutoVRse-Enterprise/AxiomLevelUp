import {
  Component,
  Suspense,
  useMemo,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react'

import type { TypedPrimitive } from '@/content/schema/primitives'
import { LoadingState } from '@/components/ui'
import { ErrorState } from '@/components/feedback/ErrorState'
import { primitiveComponents } from '@/primitives/componentRegistry'
import { DicomAssetUnavailableError } from '@/primitives/components/dicomUtils'
import { UnsupportedPrimitive } from '@/primitives/components/UnsupportedPrimitive'
import { resolvePrimitiveDefinition } from '@/primitives/definitions'
import type { PrimitiveComponentProps } from '@/primitives/types'

class PrimitiveErrorBoundary extends Component<
  { fallback: (error: Error, retry: () => void) => ReactNode; children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Primitive renderer failed', error, info)
  }

  render() {
    return this.state.error
      ? this.props.fallback(this.state.error, () => this.setState({ error: null }))
      : this.props.children
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
    <PrimitiveErrorBoundary
      fallback={(error, retry) =>
        error instanceof DicomAssetUnavailableError ? (
          <ErrorState
            actionLabel="Continue"
            message={error.message}
            onAction={props.onComplete}
            title="Imaging study unavailable"
            titleAs="h2"
          />
        ) : (
          <ErrorState
            actionLabel="Retry activity"
            message="The activity renderer encountered an unexpected problem. Try again or continue."
            onAction={retry}
            onSecondaryAction={props.onComplete}
            secondaryActionLabel="Continue"
            title="Activity could not load"
            titleAs="h2"
          />
        )
      }
    >
      <Suspense
        fallback={
          <LoadingState
            className={resolved.definition.layout === 'viewer' ? 'min-h-[55dvh]' : 'min-h-48'}
            message={`Preparing ${resolved.definition.label.toLowerCase()}.`}
            title="Loading activity"
          />
        }
      >
        <Registered {...props} primitive={resolved.primitive} />
      </Suspense>
    </PrimitiveErrorBoundary>
  )
}
