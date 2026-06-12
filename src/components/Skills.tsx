import Reveal from './Reveal'
import SectionHead from './SectionHead'
import { skills } from '../data/profile'
import type { CSSProperties } from 'react'

export default function Skills() {
  return (
    <section className="section container" id="skills">
      <SectionHead index="06" title="Toolbox" note="AI-first · full-stack · DevOps · cloud" />

      <div className="skills__grid">
        {skills.map((group, i) => (
          <Reveal key={group.group} delay={(i % 3) * 0.08}>
            <div
              className="skills__group"
              style={{ '--group-accent': group.accentVar } as CSSProperties}
            >
              <h3>{group.group}</h3>
              <div className="skills__items">
                {group.items.map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <p className="skills__note">
          This is not a complete list. I really like learning new technologies, but{' '}
          <em>I always try to choose the best tool for the job.</em>
        </p>
      </Reveal>
    </section>
  )
}
