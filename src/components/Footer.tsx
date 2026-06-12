import { useState } from 'react'
import Reveal from './Reveal'
import { contact, getEmail } from '../data/profile'
import { CopyIcon, GitHubIcon, LinkedInIcon, MailIcon } from './icons'

export default function Footer() {
  const [copied, setCopied] = useState(false)
  const email = getEmail()

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard unavailable, the mailto button still works
    }
  }

  return (
    <footer className="footer" id="contact">
      <div className="container footer__inner">
        <Reveal>
          <p className="footer__kicker">// open to interesting problems</p>
          <h2 className="footer__title">
            Let&apos;s build something <em>intelligent</em>
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="footer__actions">
            <a className="btn btn--solid" href={`mailto:${email}`}>
              <MailIcon /> {email}
            </a>
            <button className="btn" onClick={copyEmail}>
              <CopyIcon /> {copied ? 'copied ✓' : 'copy email'}
            </button>
            <a className="btn" href={contact.linkedin} target="_blank" rel="noreferrer">
              <LinkedInIcon /> linkedin
            </a>
          </div>
        </Reveal>

        <div className="footer__meta">
          <span>
            © 2026 {contact.name} · {contact.location}
          </span>
          <span className="links">
            <a href={contact.github} target="_blank" rel="noreferrer">
              <GitHubIcon size={13} /> github
            </a>
            <a href={contact.linkedin} target="_blank" rel="noreferrer">
              linkedin
            </a>
            <a href={contact.scholar} target="_blank" rel="noreferrer">
              scholar
            </a>
            <a href={contact.orcid} target="_blank" rel="noreferrer">
              orcid
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
