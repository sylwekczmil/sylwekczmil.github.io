import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import SevqCanvas from './SevqCanvas'
import { useCountUp } from '../hooks/useCountUp'
import { contact, stats } from '../data/profile'
import { ArrowUpRight, GitHubIcon, LinkedInIcon } from './icons'

const KICKER = '// PhD · SENIOR AI SOFTWARE ENGINEER'
const CHARSET = '!<>-_\\/[]{}=+*^?#'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Decide once, at mount, whether entrance animations can actually run. In a
 * backgrounded tab requestAnimationFrame is throttled, which would otherwise
 * freeze a fade-from-transparent animation and leave the hero invisible. When
 * we can't animate we render content at its final, fully-visible state instead.
 */
function useCanAnimate() {
  const [can] = useState(
    () => !prefersReducedMotion() && (typeof document === 'undefined' || !document.hidden),
  )
  return can
}

/** Terminal-style decode effect for the kicker line. */
function useDecode(text: string) {
  const [output, setOutput] = useState(text)

  useEffect(() => {
    // output already holds the final text — skip the scramble when we can't
    // animate so the line is never left mid-decode
    if (prefersReducedMotion() || document.hidden) return
    let frame = 0
    const total = 36
    const interval = setInterval(() => {
      frame++
      const progress = frame / total
      const resolved = Math.floor(progress * text.length)
      let out = text.slice(0, resolved)
      for (let i = resolved; i < text.length; i++) {
        out += text[i] === ' ' ? ' ' : CHARSET[Math.floor(Math.random() * CHARSET.length)]
      }
      setOutput(out)
      if (frame >= total) clearInterval(interval)
    }, 38)
    return () => clearInterval(interval)
  }, [text])

  return output
}

function Stat({
  value,
  suffix,
  label,
  delay,
  animate,
}: (typeof stats)[number] & { delay: number; animate: boolean }) {
  const { ref, value: current } = useCountUp(value)
  return (
    <motion.div
      ref={ref}
      className="stat"
      initial={animate ? { opacity: 0, y: 18 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="stat__value">
        {current}
        <em>{suffix}</em>
      </div>
      <div className="stat__label">{label}</div>
    </motion.div>
  )
}

export default function Hero() {
  const canAnimate = useCanAnimate()
  const kicker = useDecode(KICKER)

  // when we can't animate, pass `false` so motion renders the final state
  const intro = (state: { opacity: number; y: number }) => (canAnimate ? state : false)

  return (
    <section className="hero" id="top">
      <SevqCanvas />

      <div className="container hero__content">
        <p className="hero__kicker">{kicker}</p>

        <h1 className="hero__name">
          <motion.span
            className="row"
            initial={intro({ opacity: 0, y: 40 })}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            Sylwester
          </motion.span>
          <motion.span
            className="row"
            initial={intro({ opacity: 0, y: 40 })}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            Czmil
          </motion.span>
        </h1>

        <motion.p
          className="hero__sub"
          initial={intro({ opacity: 0, y: 24 })}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          I build <strong>production AI systems</strong>: LLM agents, geospatial analytics and
          real-time ML. I also research <strong>incremental machine learning</strong>. Don&apos;t
          take my word for it, <strong>this site runs my algorithms live</strong>.
        </motion.p>

        <motion.div
          className="hero__actions"
          initial={intro({ opacity: 0, y: 24 })}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <a className="btn btn--solid" href="#lab">
            enter the lab <ArrowUpRight />
          </a>
          <a className="btn" href={contact.github} target="_blank" rel="noreferrer">
            <GitHubIcon /> github
          </a>
          <a className="btn" href={contact.linkedin} target="_blank" rel="noreferrer">
            <LinkedInIcon /> linkedin
          </a>
        </motion.div>
      </div>

      <div className="container hero__stats">
        <div className="hero__stats-grid">
          {stats.map((s, i) => (
            <Stat key={s.label} {...s} delay={0.8 + i * 0.1} animate={canAnimate} />
          ))}
        </div>
      </div>

      <div className="hero__scroll">scroll</div>
    </section>
  )
}
