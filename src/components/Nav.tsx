import { useEffect, useState } from 'react'
import { getEmail } from '../data/profile'

const LINKS = [
  { id: 'lab', label: 'lab' },
  { id: 'about', label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'work', label: 'open source' },
  { id: 'research', label: 'research' },
  { id: 'skills', label: 'skills' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let raf = 0
    const spy = () => {
      raf = 0
      const probe = window.innerHeight * 0.35
      let current = ''
      for (const link of LINKS) {
        const el = document.getElementById(link.id)
        if (el && el.getBoundingClientRect().top <= probe) current = link.id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(spy)
    }
    spy()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav__inner">
        <a href="#top" className="nav__logo" aria-label="Back to top">
          sc<em>.</em>
        </a>
        <nav className="nav__links" aria-label="Sections">
          {LINKS.map((link, i) => (
            <a key={link.id} href={`#${link.id}`} className={active === link.id ? 'active' : ''}>
              <sup>{String(i + 1).padStart(2, '0')}</sup>
              {link.label}
            </a>
          ))}
        </nav>
        <a className="nav__cta" href={`mailto:${getEmail()}`}>
          get in touch
        </a>
      </div>
    </header>
  )
}
