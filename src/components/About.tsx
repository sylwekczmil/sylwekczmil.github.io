import Reveal from './Reveal'
import SectionHead from './SectionHead'
import { contact, summary } from '../data/profile'
import { ArrowUpRight } from './icons'

const PROFILE_LINKS = [
  { label: 'github', href: contact.github },
  { label: 'linkedin', href: contact.linkedin },
  { label: 'scholar', href: contact.scholar },
  { label: 'orcid', href: contact.orcid },
]

export default function About() {
  return (
    <section className="section container" id="about">
      <SectionHead index="02" title="Engineer × Researcher" note="who I am" />

      <div className="about__grid">
        <div>
          <Reveal>
            <p className="about__lead">
              I design and ship <em>production AI systems</em>, from LLM agents and geospatial
              analytics to real-time ML pipelines processing 25,000+ events per second.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="about__body" style={{ marginTop: '2rem' }}>
              {summary.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <aside className="about__card">
            <img
              className="about__avatar"
              src={contact.avatar}
              alt="Sylwester Czmil"
              width="84"
              height="84"
              loading="lazy"
            />
            <dl className="about__facts">
              {summary.facts.map((f) => (
                <div key={f.label} className="about__fact">
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="about__links">
              {PROFILE_LINKS.map((l) => (
                <a key={l.label} className="chip" href={l.href} target="_blank" rel="noreferrer">
                  {l.label} <ArrowUpRight size={11} />
                </a>
              ))}
            </div>
          </aside>
        </Reveal>
      </div>
    </section>
  )
}
