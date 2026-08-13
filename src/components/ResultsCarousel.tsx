import { useEffect, useRef, useState, type TouchEvent } from 'react'
import img7462 from '../assets/attachments/IMG_7462.webp'
import img7463 from '../assets/attachments/IMG_7463.webp'
import img7464 from '../assets/attachments/IMG_7464.webp'
import img7465 from '../assets/attachments/IMG_7465.webp'
import img7466 from '../assets/attachments/IMG_7466.webp'
import img7467 from '../assets/attachments/IMG_7467.webp'
import img7468 from '../assets/attachments/IMG_7468.webp'
import img7469 from '../assets/attachments/IMG_7469.webp'
import img7472 from '../assets/attachments/IMG_7472.webp'

const SLIDE_SRCS = [
  img7462,
  img7463,
  img7464,
  img7465,
  img7466,
  img7467,
  img7468,
  img7469,
  img7472,
] as const

const SLIDE_ALT = 'Client transformation — before and after side by side'
const SWIPE_THRESHOLD = 48
const AUTOPLAY_MS = 5000
const TOTAL = SLIDE_SRCS.length

function padIndex(n: number): string {
  return String(n).padStart(2, '0')
}

function wrapIndex(n: number): number {
  return ((n % TOTAL) + TOTAL) % TOTAL
}

function ResultsCarousel() {
  const [index, setIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [paused, setPaused] = useState(false)
  const [tabHidden, setTabHidden] = useState(false)
  const [inView, setInView] = useState(false)
  const [timerEpoch, setTimerEpoch] = useState(0)
  /** Only mount slides that have been shown or are next — keeps DOM/network light. */
  const [mounted, setMounted] = useState(() => new Set([0, 1]))

  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden)
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setMounted((prev) => {
      const next = new Set(prev)
      next.add(index)
      next.add(wrapIndex(index + 1))
      next.add(wrapIndex(index - 1))
      return next.size === prev.size && [...next].every((i) => prev.has(i)) ? prev : next
    })
  }, [index])

  const goTo = (next: number, fromUser = false) => {
    setIndex(wrapIndex(next))
    if (fromUser) setTimerEpoch((e) => e + 1)
  }

  useEffect(() => {
    if (reduceMotion || paused || tabHidden || !inView) return
    const id = window.setTimeout(() => setIndex((i) => wrapIndex(i + 1)), AUTOPLAY_MS)
    return () => window.clearTimeout(id)
  }, [index, reduceMotion, paused, tabHidden, inView, timerEpoch])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goTo(index - 1, true)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goTo(index + 1, true)
      }
    }

    el.addEventListener('keydown', onKeyDown)
    return () => el.removeEventListener('keydown', onKeyDown)
  }, [index])

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
    touchDeltaX.current = 0
    setPaused(true)
  }

  const onTouchMove = (e: TouchEvent) => {
    if (touchStartX.current == null) return
    touchDeltaX.current = (e.touches[0]?.clientX ?? touchStartX.current) - touchStartX.current
  }

  const onTouchEnd = () => {
    if (touchStartX.current == null) {
      setPaused(false)
      return
    }
    const dx = touchDeltaX.current
    touchStartX.current = null
    touchDeltaX.current = 0
    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      goTo(index + (dx > 0 ? -1 : 1), true)
    }
    setPaused(false)
  }

  return (
    <div
      ref={rootRef}
      className={`results-carousel${reduceMotion ? ' results-carousel--reduced' : ''}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Client transformations"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false)
        }
      }}
    >
      <div
        className="results-carousel__stage"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => {
          touchStartX.current = null
          touchDeltaX.current = 0
          setPaused(false)
        }}
      >
        <div className="results-carousel__frame">
          {SLIDE_SRCS.map((src, i) =>
            mounted.has(i) ? (
              <img
                key={src}
                src={src}
                alt={i === index ? SLIDE_ALT : ''}
                className={`results-carousel__image${i === index ? ' is-active' : ''}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                width={1200}
                height={1200}
                aria-hidden={i !== index}
              />
            ) : null
          )}
          <div className="results-carousel__grain" aria-hidden="true" />
          <span className="results-carousel__label results-carousel__label--before">Before</span>
          <span className="results-carousel__label results-carousel__label--after">After</span>
        </div>
      </div>

      <p className="results-carousel__counter" aria-live="polite" aria-atomic="true">
        <span className="sr-only">
          Slide {index + 1} of {TOTAL}
        </span>
        <span aria-hidden="true">
          {padIndex(index + 1)} — {padIndex(TOTAL)}
        </span>
      </p>

      <div className="results-carousel__controls">
        <button
          type="button"
          className="results-carousel__nav"
          onClick={() => goTo(index - 1, true)}
          aria-label="Previous transformation"
        >
          ← Prev
        </button>

        <div className="results-carousel__ticks" aria-label="Choose transformation">
          {SLIDE_SRCS.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`results-carousel__tick${i === index ? ' is-active' : ''}`}
              aria-current={i === index ? 'true' : undefined}
              aria-label={`Transformation ${i + 1} of ${TOTAL}`}
              onClick={() => goTo(i, true)}
            />
          ))}
        </div>

        <button
          type="button"
          className="results-carousel__nav"
          onClick={() => goTo(index + 1, true)}
          aria-label="Next transformation"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default ResultsCarousel
