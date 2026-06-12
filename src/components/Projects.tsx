import { useState } from 'react'
import Reveal from './Reveal'
import SectionHead from './SectionHead'
import { projects, projectsFootnote } from '../data/profile'
import { ArrowUpRight, BookIcon, CopyIcon, GitHubIcon } from './icons'
import type { CSSProperties } from 'react'

function InstallLine({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard unavailable (http / old browser) — nothing to do
    }
  }

  return (
    <div className="project__install">
      <code>
        <span className="prompt">$</span>
        {command}
      </code>
      <button className="project__copy" onClick={copy} aria-label={`Copy ${command}`}>
        {copied ? 'copied ✓' : <CopyIcon />}
      </button>
    </div>
  )
}

export default function Projects() {
  return (
    <section className="section container" id="work">
      <SectionHead index="04" title="Open source & research code" note="pip install …" />

      <div className="projects__grid">
        {projects.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.12}>
            <article
              className="project"
              style={
                {
                  '--project-accent': p.accentVar,
                  '--glow': `color-mix(in srgb, ${p.accentVar} 14%, transparent)`,
                } as CSSProperties
              }
            >
              <div className="project__top">
                <h3 className="project__name">{p.name}</h3>
                <span className="project__stars" style={{ color: p.accentVar }}>
                  ▼ {p.downloads}
                </span>
              </div>
              <p className="project__abbr">{p.abbr}</p>
              <p className="project__desc">{p.description}</p>
              <div className="project__badges">
                {p.badges.map((b) => (
                  <span key={b} className="chip">
                    {b}
                  </span>
                ))}
              </div>
              <InstallLine command={p.install} />
              <div className="project__links">
                <a href={p.docs} target="_blank" rel="noreferrer">
                  <BookIcon /> docs <ArrowUpRight size={11} />
                </a>
                <a href={p.repo} target="_blank" rel="noreferrer">
                  <GitHubIcon size={13} /> source <ArrowUpRight size={11} />
                </a>
                <a href={`#lab-${p.name.toLowerCase()}`} style={{ color: p.accentVar }}>
                  ▶ try it live in the lab
                </a>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <p className="skills__note" style={{ marginTop: '1.5rem' }}>
          {projectsFootnote.text}{' '}
          <a href={projectsFootnote.link} target="_blank" rel="noreferrer">
            <em>{projectsFootnote.linkLabel} ↗</em>
          </a>
        </p>
      </Reveal>
    </section>
  )
}
