import Reveal from './Reveal'
import SectionHead from './SectionHead'
import SevqPlayground from './lab/SevqPlayground'
import CacpArena from './lab/CacpArena'
import AgentFlow from './lab/AgentFlow'

export default function Lab() {
  return (
    <section className="section container" id="lab">
      <SectionHead index="01" title="The Lab" note="interactive demos" />

      <Reveal>
        <p className="lab__intro">
          Most portfolios <em>tell</em> you what the author can do. This one <em>runs it</em>. The
          demos below are real, working machine learning you can play with: my PhD algorithm
          learning sample-by-sample, a miniature of my published benchmarking pipeline, and the
          agent architecture I build for a living.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <SevqPlayground />
      </Reveal>
      <Reveal>
        <CacpArena />
      </Reveal>
      <Reveal>
        <AgentFlow />
      </Reveal>
    </section>
  )
}
