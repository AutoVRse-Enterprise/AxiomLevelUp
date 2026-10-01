import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

import { Button } from '@/components/ui'
import type { CarouselPrimitive as CarouselPrimitiveConfig } from '@/content/schema/primitives'
import { useAssetUrl } from '@/content/useAssetUrl'
import type { PrimitiveComponentProps } from '@/primitives/types'

type Slide = CarouselPrimitiveConfig['content']['slides'][number]

function CarouselSlide({
  slide,
  index,
  count,
  setRef,
}: {
  slide: Slide
  index: number
  count: number
  setRef: (element: HTMLElement | null) => void
}) {
  const imageUrl = useAssetUrl(slide.imageAssetId)
  return (
    <article
      ref={setRef}
      className="min-w-full snap-center space-y-4 rounded-xl border border-neutral-200 bg-white p-5"
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${count}: ${slide.title}`}
      data-slide-index={index}
    >
      {imageUrl ? (
        <figure>
          <img
            className="max-h-72 w-full rounded-lg object-contain"
            src={imageUrl}
            alt={slide.imageAlt}
          />
          {slide.caption ? (
            <figcaption className="mt-2 text-caption text-neutral-600">{slide.caption}</figcaption>
          ) : null}
        </figure>
      ) : null}
      <div>
        <h3 className="font-bold text-neutral-950">{slide.title}</h3>
        <p className="mt-2 text-small text-neutral-700">{slide.body}</p>
      </div>
    </article>
  )
}

export function CarouselPrimitive({
  primitive,
  disabled,
  onInteract,
}: PrimitiveComponentProps<CarouselPrimitiveConfig>) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<Array<HTMLElement | null>>([])
  const reportedSlides = useRef(new Set<string>())
  const hasObserver = useRef(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const reportSlide = useCallback(
    (index: number) => {
      const slide = primitive.content.slides[index]
      if (!slide || reportedSlides.current.has(slide.id)) return
      reportedSlides.current.add(slide.id)
      onInteract({ name: 'slide_viewed', key: slide.id })
    },
    [onInteract, primitive.content.slides],
  )

  useEffect(() => {
    reportSlide(0)
    if (typeof IntersectionObserver === 'undefined') return
    hasObserver.current = true
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) continue
          const index = Number((entry.target as HTMLElement).dataset.slideIndex)
          setActiveIndex(index)
          reportSlide(index)
        }
      },
      { root: viewportRef.current, threshold: 0.6 },
    )
    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide)
    })
    return () => observer.disconnect()
  }, [primitive.content.slides, reportSlide])

  const showSlide = (index: number) => {
    const nextIndex = Math.min(primitive.content.slides.length - 1, Math.max(0, index))
    setActiveIndex(nextIndex)
    reportSlide(nextIndex)
    slideRefs.current[nextIndex]?.scrollIntoView?.({ behavior: 'smooth', inline: 'center' })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    showSlide(activeIndex + (event.key === 'ArrowRight' ? 1 : -1))
  }

  return (
    <section
      className="space-y-4"
      aria-roledescription="carousel"
      aria-label={primitive.content.title}
    >
      <h2 className="text-title font-bold text-neutral-950">{primitive.content.title}</h2>
      <div
        ref={viewportRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-xl"
        onScroll={(event) => {
          if (hasObserver.current || event.currentTarget.clientWidth <= 0) return
          const index = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth)
          setActiveIndex(index)
          reportSlide(index)
        }}
      >
        {primitive.content.slides.map((slide, index) => (
          <CarouselSlide
            key={slide.id}
            slide={slide}
            index={index}
            count={primitive.content.slides.length}
            setRef={(element) => {
              slideRefs.current[index] = element
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<ChevronLeft aria-hidden="true" />}
          disabled={disabled || activeIndex === 0}
          onClick={() => showSlide(activeIndex - 1)}
          onKeyDown={handleKeyDown}
        >
          Previous
        </Button>
        <div className="flex gap-2" aria-label="Choose slide">
          {primitive.content.slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className="h-3 w-3 rounded-full bg-neutral-300 aria-[current=true]:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              aria-label={`Show slide ${index + 1}: ${slide.title}`}
              aria-current={index === activeIndex}
              disabled={disabled}
              onClick={() => showSlide(index)}
              onKeyDown={handleKeyDown}
            />
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || activeIndex === primitive.content.slides.length - 1}
          onClick={() => showSlide(activeIndex + 1)}
          onKeyDown={handleKeyDown}
        >
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
