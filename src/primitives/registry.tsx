import {
  Component,
  lazy,
  Suspense,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react'

import type { PrimitiveComponentProps } from '@/primitives/types'

const RichTextPrimitive = lazy(async () => {
  const module = await import('@/primitives/RichTextPrimitive')
  return { default: module.RichTextPrimitive }
})
const ImagePrimitive = lazy(async () => {
  const module = await import('@/primitives/ImagePrimitive')
  return { default: module.ImagePrimitive }
})
const MultipleChoicePrimitive = lazy(async () => {
  const module = await import('@/primitives/MultipleChoicePrimitive')
  return { default: module.MultipleChoicePrimitive }
})
const UnsupportedPrimitive = lazy(async () => {
  const module = await import('@/primitives/UnsupportedPrimitive')
  return { default: module.UnsupportedPrimitive }
})

interface PrimitiveRegistration {
  component: ComponentType<PrimitiveComponentProps>
}

const registry: Record<string, PrimitiveRegistration> = {
  rich_text: { component: RichTextPrimitive },
  image: { component: ImagePrimitive },
  multiple_choice: { component: MultipleChoicePrimitive },
}

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
  const Registered = registry[props.primitive.type]?.component ?? UnsupportedPrimitive
  const fallback = <UnsupportedPrimitive {...props} />
  return (
    <PrimitiveErrorBoundary fallback={fallback}>
      <Suspense
        fallback={
          <div className="min-h-48 animate-pulse rounded-xl bg-neutral-100" role="status">
            <span className="sr-only">Loading activity</span>
          </div>
        }
      >
        <Registered {...props} />
      </Suspense>
    </PrimitiveErrorBoundary>
  )
}
