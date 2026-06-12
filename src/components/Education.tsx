import Reveal from './Reveal'
import SectionHead from './SectionHead'
import { CertIcon } from './icons'
import { certifications, education } from '../data/profile'

export default function Education() {
  return (
    <section className="section container" id="education">
      <SectionHead index="07" title="Education & credentials" note="Rzeszów University of Technology" />

      <div className="edu__grid">
        <div>
          {education.map((e) => (
            <Reveal key={e.degree}>
              <div className="edu__item">
                <h3 className="edu__degree">
                  {e.degree.startsWith('PhD') ? (
                    <>
                      <span className="phd">PhD</span>
                      {e.degree.slice(3)}
                    </>
                  ) : (
                    e.degree
                  )}
                </h3>
                <p className="edu__meta">
                  {e.school} · {e.period}
                </p>
                <p className="edu__thesis">{e.thesis}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div>
          {certifications.map((c, i) => (
            <Reveal key={c.name} delay={i * 0.1}>
              <div className="cert">
                <span
                  className={`cert__icon ${c.org === 'azure' ? 'cert__icon--azure' : ''}`}
                  aria-hidden="true"
                >
                  <CertIcon />
                </span>
                <span className="cert__body">
                  <span className="cert__name">{c.name}</span>
                  <span className="cert__period">{c.period}</span>
                </span>
              </div>
            </Reveal>
          ))}
          <Reveal delay={0.2}>
            <p className="skills__note" style={{ marginTop: '1.5rem' }}>
              PhD thesis defended June 2025 · supervisor: prof. Jacek Kluska ·{' '}
              <em>SEVQ ranked best incremental classifier by AUC across 36 benchmark datasets</em>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
