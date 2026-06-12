import Reveal from './Reveal'
import SectionHead from './SectionHead'
import { ventures } from '../data/profile'

export default function Experience() {
  return (
    <section className="section container" id="experience">
      <SectionHead index="03" title="A decade in production" note="what I built, not where" />

      <div className="xp">
        {ventures.map((v) => (
          <Reveal key={v.domain}>
            <article className="xp__item">
              <div className="xp__left">
                <h3 className="xp__company">
                  <span className="xp__for">for </span>
                  {v.domain}
                </h3>
                <p className="xp__role">{v.title}</p>
                <p className="xp__period">{v.period}</p>
              </div>
              <div>
                <ul className="xp__highlights">
                  {v.highlights.map((h) => (
                    <li key={h.slice(0, 24)}>{h}</li>
                  ))}
                </ul>
                {v.tags.length > 0 && (
                  <div className="xp__tags">
                    {v.tags.map((t) => (
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
