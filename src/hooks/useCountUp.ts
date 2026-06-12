import { useEffect, useRef, useState } from 'react'

/**
 * Counts from 0 to `target` once the element scrolls into view.
 *
 * Robust against backgrounded tabs: the count-up is a requestAnimationFrame
 * animation (which throttles when hidden), so if the page isn't visible we
 * snap straight to the final value instead of risking a stat frozen at a
 * partial number like "0 years". Triggering uses a synchronous scroll check
 * rather than IntersectionObserver for the same reliability reason.
 */
export function useCountUp(target: number, duration = 1400) {
  const ref = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }

    let started = false
    let raf = 0
    let finished = false

    const snap = () => {
      finished = true
      cancelAnimationFrame(raf)
      setValue(target)
    }

    const animate = () => {
      const t0 = performance.now()
      const step = (t: number) => {
        if (finished) return
        const p = Math.min((t - t0) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 4)
        setValue(Math.round(eased * target))
        if (p < 1) raf = requestAnimationFrame(step)
        else finished = true
      }
      raf = requestAnimationFrame(step)
    }

    const trigger = () => {
      if (started) return
      started = true
      cleanup()
      // a hidden tab pauses rAF — show the final number rather than a partial
      if (document.visibilityState === 'hidden') snap()
      else animate()
    }

    const check = () => {
      if (started) return
      const vh = window.innerHeight || document.documentElement.clientHeight
      const r = el.getBoundingClientRect()
      if (r.top < vh * 0.9 && r.bottom > 0) trigger()
    }

    // if the tab is backgrounded mid-count, jump to the final value
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && started && !finished) snap()
    }

    function cleanup() {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }

    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    check()

    return () => {
      cleanup()
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(raf)
    }
  }, [target, duration])

  return { ref, value }
}
