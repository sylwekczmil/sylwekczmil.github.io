import Reveal from './Reveal'
import SectionHead from './SectionHead'
import { experience } from '../data/profile'

export default function Experience() {
  return (
    <section className="section container" id="experience">
      <SectionHead index="03" title="A decade in production" note="2015 – present" />

      <div className="xp">
        {experience.map((job) => (
          <Reveal key={job.company}>
            <article className="xp__item">
              <div className="xp__left">
                <h3 className="xp__company">{job.company}</h3>
                <p className="xp__role">{job.role}</p>
                <p className="xp__period">{job.period}</p>
                {job.clients && (
                  <div className="xp__clients">
                    <span>{job.note}</span>
                    {job.clients.map((c) => (
                      <span key={c} className="xp__client">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <ul className="xp__highlights">
                  {job.highlights.map((h) => (
                    <li key={h.slice(0, 24)}>{h}</li>
                  ))}
                </ul>
                {job.tags.length > 0 && (
                  <div className="xp__tags">
                    {job.tags.map((t) => (
                      <span key={t} className="chip">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
