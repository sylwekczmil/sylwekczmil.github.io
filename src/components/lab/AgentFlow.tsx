import { useEffect, useRef, useState } from 'react'

interface Node {
  id: string
  x: number
  y: number
  label: string
  sub?: string
}

const NODES: Node[] = [
  { id: 'q', x: 78, y: 150, label: 'question', sub: 'natural language' },
  { id: 'plan', x: 248, y: 150, label: 'planner', sub: 'LLM · routing' },
  { id: 'rag', x: 432, y: 64, label: 'RAG retriever', sub: 'schemas · ArcGIS' },
  { id: 'sql', x: 432, y: 236, label: 'Text-to-SQL', sub: 'LLM · Databricks' },
  { id: 'exec', x: 612, y: 236, label: 'executor', sub: 'validate · run' },
  { id: 'synth', x: 726, y: 150, label: 'synthesizer', sub: 'LLM · provenance' },
  { id: 'ans', x: 868, y: 150, label: 'answer', sub: 'map + table' },
]

const EDGES: Array<{ id: string; from: string; to: string }> = [
  { id: 'q-plan', from: 'q', to: 'plan' },
  { id: 'plan-rag', from: 'plan', to: 'rag' },
  { id: 'plan-sql', from: 'plan', to: 'sql' },
  { id: 'rag-sql', from: 'rag', to: 'sql' },
  { id: 'sql-exec', from: 'sql', to: 'exec' },
  { id: 'exec-synth', from: 'exec', to: 'synth' },
  { id: 'rag-synth', from: 'rag', to: 'synth' },
  { id: 'synth-ans', from: 'synth', to: 'ans' },
]

interface Step {
  node: string
  edges: string[]
  line: string
}

const SCENARIOS: Step[][] = [
  [
    { node: 'q', edges: [], line: '> q: "Which wells within 5 km of the Brent fault produced over 1,000 bbl/d last year?"' },
    { node: 'plan', edges: ['q-plan'], line: 'planner   spatial constraint + production filter → retrieve, generate SQL, execute' },
    { node: 'rag', edges: ['plan-rag'], line: 'rag       3 ArcGIS layers · table schemas · 2 few-shot pairs' },
    { node: 'sql', edges: ['plan-sql', 'rag-sql'], line: 'text2sql  ST_DWithin spatial join + windowed aggregate' },
    { node: 'exec', edges: ['sql-exec'], line: 'executor  dry-run ✓ · scan 0.8 s · 14 rows' },
    { node: 'synth', edges: ['exec-synth', 'rag-synth'], line: 'synth     answer + map layer + provenance links' },
    { node: 'ans', edges: ['synth-ans'], line: '> a: 14 wells match, top producer W-113 at 1,840 bbl/d ▸ map + table' },
  ],
  [
    { node: 'q', edges: [], line: '> q: "Average porosity of sandstone intervals in block B, by formation?"' },
    { node: 'plan', edges: ['q-plan'], line: 'planner   lithology filter + aggregation → retrieve, generate SQL, execute' },
    { node: 'rag', edges: ['plan-rag'], line: 'rag       well-log schemas · formation tops · 2 few-shot pairs' },
    { node: 'sql', edges: ['plan-sql', 'rag-sql'], line: 'text2sql  join log_intervals ⨝ porosity_measurements, group by formation' },
    { node: 'exec', edges: ['sql-exec'], line: 'executor  scan 0.4 s · 312 intervals' },
    { node: 'synth', edges: ['exec-synth', 'rag-synth'], line: 'synth     stats + confidence note' },
    { node: 'ans', edges: ['synth-ans'], line: '> a: mean porosity 18.4% (σ 3.1) across 312 sandstone intervals' },
  ],
]

const STEP_MS = 1150
const PULSE_MS = 520

function edgePath(e: { from: string; to: string }): string {
  const a = NODES.find((n) => n.id === e.from)!
  const b = NODES.find((n) => n.id === e.to)!
  const mx = (a.x + b.x) / 2
  return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`
}

export default function AgentFlow() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [active, setActive] = useState<string>('')
  const [visited, setVisited] = useState<Set<string>>(new Set())
  const [lines, setLines] = useState<string[]>([])
  const termRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setVisited(new Set(NODES.map((n) => n.id)))
      setLines(SCENARIOS[0].map((s) => s.line))
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    let raf = 0
    let started = false

    const pulse = (edgeIds: string[]) => {
      const paths = edgeIds
        .map((id) => svg.querySelector<SVGPathElement>(`[data-edge="${id}"]`))
        .filter((p): p is SVGPathElement => p !== null)
      const dots = paths.map((p) => {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        dot.setAttribute('r', '3.4')
        dot.setAttribute('class', 'flow__pulse')
        svg.appendChild(dot)
        return { p, dot, len: p.getTotalLength() }
      })
      const t0 = performance.now()
      const frame = (t: number) => {
        const k = Math.min((t - t0) / PULSE_MS, 1)
        for (const { p, dot, len } of dots) {
          const pt = p.getPointAtLength(len * k)
          dot.setAttribute('cx', String(pt.x))
          dot.setAttribute('cy', String(pt.y))
        }
        if (k < 1 && !cancelled) raf = requestAnimationFrame(frame)
        else dots.forEach(({ dot }) => dot.remove())
      }
      raf = requestAnimationFrame(frame)
    }

    const runScenario = (sIdx: number) => {
      if (cancelled) return
      setVisited(new Set())
      setLines([])
      const steps = SCENARIOS[sIdx % SCENARIOS.length]
      const runStep = (i: number) => {
        if (cancelled) return
        if (i >= steps.length) {
          setActive('')
          timer = setTimeout(() => runScenario(sIdx + 1), 3600)
          return
        }
        const step = steps[i]
        if (step.edges.length > 0) pulse(step.edges)
        timer = setTimeout(
          () => {
            if (cancelled) return
            setActive(step.node)
            setVisited((v) => new Set(v).add(step.node))
            setLines((ls) => [...ls.slice(-8), step.line])
            timer = setTimeout(() => runStep(i + 1), STEP_MS - (step.edges.length ? PULSE_MS : 0))
          },
          step.edges.length ? PULSE_MS : 60,
        )
      }
      runStep(0)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true
          runScenario(0)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(svg)

    return () => {
      cancelled = true
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [])

  useEffect(() => {
    termRef.current?.scrollTo({ top: termRef.current.scrollHeight })
  }, [lines])

  return (
    <div className="lab__panel" id="lab-agents">
      <div className="lab__head">
        <p className="lab__exhibit">exhibit 03 · what I ship at work</p>
        <h3 className="lab__title">Anatomy of an LLM agent system</h3>
        <p className="lab__blurb">
          A simplified, illustrative walkthrough of the kind of{' '}
          <strong>multi-LLM Text-to-SQL + RAG architecture</strong> I build for geospatial
          analytics in the energy sector (LangGraph · Databricks · ArcGIS): a domain expert asks a
          question in plain English and gets a verified, provenance-tracked answer.
        </p>
      </div>

      <div className="flow__wrap">
        <svg
          ref={svgRef}
          className="flow"
          viewBox="0 0 940 300"
          role="img"
          aria-label="LLM agent pipeline: question, planner, RAG retriever, Text-to-SQL, executor, synthesizer, answer"
        >
          {EDGES.map((e) => (
            <path key={e.id} data-edge={e.id} className="flow__edge" d={edgePath(e)} />
          ))}
          {NODES.map((n) => (
            <g
              key={n.id}
              className={`flow__node ${active === n.id ? 'active' : ''} ${visited.has(n.id) ? 'visited' : ''}`}
              transform={`translate(${n.x}, ${n.y})`}
            >
              <rect x="-66" y="-26" width="132" height="52" rx="10" />
              <text className="flow__label" y="-3">
                {n.label}
              </text>
              {n.sub && (
                <text className="flow__sub" y="13">
                  {n.sub}
                </text>
              )}
            </g>
          ))}
        </svg>

        <div className="term" ref={termRef} aria-live="polite">
          {lines.map((l, i) => (
            <p key={`${i}-${l.slice(0, 12)}`} className={l.startsWith('>') ? 'term__io' : 'term__step'}>
              {l}
            </p>
          ))}
          {lines.length === 0 && <p className="term__step">initializing agents…</p>}
        </div>
      </div>

      <div className="lab__stats">
        <span className="lab__stats-note">
          Note: the data, queries and node names here are invented, and the architecture is
          simplified. The real systems I ship are under NDA, so this only illustrates the shape of
          the multi-LLM pipelines I build in production.
        </span>
      </div>
    </div>
  )
}
