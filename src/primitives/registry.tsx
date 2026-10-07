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
import { AnatomyAssetUnavailableError } from '@/primitives/components/anatomyUtils'
import { DicomAssetUnavailableError } from '@/primitives/components/dicomUtils'
import { UnsupportedPrimitive } from '@/primitives/components/UnsupportedPrimitive'
import { resolvePrimitiveDefinition } from '@/primitives/definitions'
import { usePresentation } from '@/primitives/presentation/PresentationContext'
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
  const { labels } = usePresentation()
  const resolved = useMemo(() => resolvePrimitiveDefinition(props.primitive), [props.primitive])
  const fallback = <UnsupportedPrimitive {...props} />
  if (!resolved) return fallback

  const Registered = primitiveComponents[resolved.primitive.type] as ComponentType<
    PrimitiveComponentProps<TypedPrimitive>
  >

  return (
    <PrimitiveErrorBoundary
      fallback={(error, retry) =>
        error instanceof DicomAssetUnavailableError ||
        error instanceof AnatomyAssetUnavailableError ? (
          <ErrorState
            actionLabel={labels.continue}
            message={error.message}
            onAction={props.onComplete}
            title={
              error instanceof AnatomyAssetUnavailableError
                ? 'Anatomy model unavailable'
                : 'Imaging study unavailable'
            }
            titleAs="h2"
          />
        ) : (
          <ErrorState
            actionLabel={labels.retryActivity}
            message={labels.activityLoadErrorMessage}
            onAction={retry}
            onSecondaryAction={props.onComplete}
            secondaryActionLabel={labels.continue}
            title={labels.activityLoadError}
            titleAs="h2"
          />
        )
      }
    >
      <Suspense
        fallback={
          <LoadingState
            className={resolved.definition.layout === 'viewer' ? 'min-h-[55dvh]' : 'min-h-48'}
            message={labels.preparing(resolved.definition.label)}
            title={labels.loadingActivity}
          />
        }
      >
        <Registered {...props} primitive={resolved.primitive} />
      </Suspense>
    </PrimitiveErrorBoundary>
  )
}
