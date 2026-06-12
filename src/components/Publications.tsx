import type { ReactNode } from 'react'
import Reveal from './Reveal'
import SectionHead from './SectionHead'
import { contact, publications, publicationsNote } from '../data/profile'
import { ArrowUpRight } from './icons'

/** Highlight "Czmil S." among the author list. */
function renderAuthors(authors: string): ReactNode[] {
  return authors.split(/(Czmil S\.)/).map((part, i) =>
    part === 'Czmil S.' ? (
      <span key={i} className="me">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

export default function Publications() {
  return (
    <section className="section container" id="research">
      <SectionHead index="05" title="Peer-reviewed research" note={publicationsNote} />

      <div className="pubs">
        {publications.map((pub) => (
          <Reveal key={pub.doi}>
            <a className="pub" href={pub.doi} target="_blank" rel="noreferrer">
              <span className="pub__year">{pub.year}</span>
              <span>
                <span className="pub__title">{pub.title}</span>
                <span className="pub__meta" style={{ display: 'block' }}>
                  {renderAuthors(pub.authors)} · <span className="venue">{pub.venue}</span>
                </span>
              </span>
              <span className="pub__doi">
                doi <ArrowUpRight />
              </span>
            </a>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.15}>
        <p className="skills__note" style={{ marginTop: '1.5rem' }}>
          Full record on{' '}
          <a href={contact.scholar} target="_blank" rel="noreferrer">
            <em>Google Scholar ↗</em>
          </a>{' '}
          and{' '}
          <a href={contact.orcid} target="_blank" rel="noreferrer">
            <em>ORCID ↗</em>
          </a>
        </p>
      </Reveal>
    </section>
  )
}
