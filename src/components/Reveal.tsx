import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

/**
 * Shared, synchronous scroll/resize driver for all reveals. Using one set of
 * geometry checks (rather than a per-element IntersectionObserver) keeps reveal
 * timing reliable even when the tab is backgrounded — IntersectionObserver and
 * requestAnimationFrame are both throttled while hidden, which can otherwise
 * leave a section stuck invisible. Geometry reads via getBoundingClientRect are
 * synchronous and always accurate.
 */
const watchers = new Set<() => void>()
let bound = false

function bindOnce() {
  if (bound || typeof window === 'undefined') return
  bound = true
  const tick = () => watchers.forEach((fn) => fn())
  window.addEventListener('scroll', tick, { passive: true })
  window.addEventListener('resize', tick, { passive: true })
  window.addEventListener('orientationchange', tick)
  document.addEventListener('visibilitychange', tick)
}

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

/**
 * Scroll-triggered fade-up used across all sections. The motion itself is a
 * CSS transition (time-based, so it can never freeze half-way); JS only flips
 * the target state once the element scrolls into view. If JS is unavailable
 * the element still renders — it just starts hidden, so reduced-motion and the
 * in-view check both fall back to "shown".
 */
export default function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }

    bindOnce()
    const check = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight
      const r = el.getBoundingClientRect()
      // reveal once the element's top edge crosses 92% of the viewport height
      if (r.top < vh * 0.92 && r.bottom > -1) {
        setShown(true)
        watchers.delete(check)
      }
    }
    watchers.add(check)
    check() // catch anything already in view on mount

    return () => {
      watchers.delete(check)
    }
  }, [])

  // Skip the entrance transition when the tab isn't visible: a backgrounded
  // tab pauses repaints, which would otherwise leave the transition frozen
  // mid-way until the user returns. Snapping straight to the target state
  // guarantees content is fully shown the instant the page is looked at.
  const instant = typeof document !== 'undefined' && document.visibilityState === 'hidden'

  const style: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? 'none' : 'translateY(26px)',
    transition: instant
      ? 'none'
      : `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
    willChange: shown ? 'auto' : 'opacity, transform',
  }

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
