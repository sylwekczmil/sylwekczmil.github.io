import { useCallback, useEffect, useRef, useState } from 'react'
import { DATASETS, mulberry32, shuffle, type DatasetKey, type Sample } from '../../lib/datasets'
import { makeArenaClassifiers, WINDOW_BUDGET } from '../../lib/classifiers'
import { drawDecisionRegions, drawSampleDot, squareTransform } from '../../lib/draw'

type Protocol = 'stream' | 'batch'

/**
 * Real data streams drift. We order the training stream along a drift axis
 * (spiral: inside → out, others: left → right), so early regions are never
 * seen again — the setting incremental learners are built for.
 */
function orderForStream(train: Sample[], key: DatasetKey): Sample[] {
  const drift = (s: Sample) =>
    key === 'spiral' ? (s.x - 0.5) ** 2 + (s.y - 0.5) ** 2 : s.x
  return [...train].sort((a, b) => drift(a) - drift(b))
}

interface Result {
  key: string
  name: string
  detail: string
  incremental: boolean
  status: 'idle' | 'training' | 'done'
  acc: number
  ms: number
  size: string
}

const NOISE: Record<DatasetKey, number> = {
  moons: 0.04,
  circles: 0.032,
  spiral: 0.028,
  xor: 0.04,
  blobs: 0.05,
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const initialResults = (): Result[] =>
  makeArenaClassifiers().map((c) => ({
    key: c.key,
    name: c.name,
    detail: c.detail,
    incremental: c.incremental,
    status: 'idle',
    acc: 0,
    ms: 0,
    size: '·',
  }))

export default function CacpArena() {
  const [dataset, setDataset] = useState<DatasetKey>('spiral')
  const [protocol, setProtocol] = useState<Protocol>('stream')
  const [results, setResults] = useState<Result[]>(initialResults)
  const [running, setRunning] = useState(false)
  const [ranked, setRanked] = useState(false)
  const canvases = useRef(new Map<string, HTMLCanvasElement>())
  const runId = useRef(0)
  const seed = useRef(42)

  const run = useCallback(
    async (key: DatasetKey, proto: Protocol, reseed: boolean) => {
      const id = ++runId.current
      if (reseed) seed.current += 101
      setRunning(true)
      setRanked(false)
      setResults(initialResults())

      const rnd = mulberry32(seed.current)
      const data = shuffle(DATASETS[key].gen(360, NOISE[key], rnd), rnd).map((s) => ({
        ...s,
        x: Math.min(Math.max(s.x, 0.02), 0.98),
        y: Math.min(Math.max(s.y, 0.02), 0.98),
      }))
      const cut = Math.floor(data.length * 0.7)
      const train = proto === 'stream' ? orderForStream(data.slice(0, cut), key) : data.slice(0, cut)
      const test = data.slice(cut)

      for (const clf of makeArenaClassifiers()) {
        if (id !== runId.current) return
        setResults((rs) => rs.map((r) => (r.key === clf.key ? { ...r, status: 'training' } : r)))
        await sleep(160)

        const t0 = performance.now()
        if (proto === 'stream') clf.fitStream(train)
        else clf.fit(train)
        const ms = performance.now() - t0
        const acc = test.filter((s) => clf.predict(s.x, s.y) === s.label).length / test.length

        const canvas = canvases.current.get(clf.key)
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const w = canvas.clientWidth
            const h = canvas.clientHeight
            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, w, h)
            const { toPx, toData } = squareTransform(w, h)
            drawDecisionRegions(
              ctx,
              (fx, fy) => {
                const [dx, dy] = toData(fx * w, fy * h)
                return clf.predict(dx, dy)
              },
              w,
              h,
              52,
              96,
              64,
            )
            for (const s of test) {
              const miss = clf.predict(s.x, s.y) !== s.label
              const [px, py] = toPx(s.x, s.y)
              drawSampleDot(ctx, px, py, s.label, miss ? 2.6 : 2, miss ? 1 : 0.8)
              if (miss) {
                ctx.strokeStyle = 'rgba(233,236,231,0.85)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.arc(px, py, 4.4, 0, Math.PI * 2)
                ctx.stroke()
              }
            }
          }
        }

        if (id !== runId.current) return
        setResults((rs) =>
          rs.map((r) =>
            r.key === clf.key ? { ...r, status: 'done', acc, ms, size: clf.size() } : r,
          ),
        )
      }

      if (id !== runId.current) return
      await sleep(220)
      setRanked(true)
      setRunning(false)
    },
    [],
  )

  // cancel an in-flight run on unmount (StrictMode remounts share canvases)
  useEffect(() => {
    const id = runId
    return () => {
      id.current++
    }
  }, [])

  // auto-run once when scrolled into view
  const rootRef = useRef<HTMLDivElement>(null)
  const booted = useRef(false)
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !booted.current) {
          booted.current = true
          run('spiral', 'stream', false)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [run])

  const board = ranked ? [...results].sort((a, b) => b.acc - a.acc) : results
  const bestAcc = Math.max(...results.map((r) => r.acc))

  return (
    <div className="lab__panel" id="lab-cacp" ref={rootRef}>
      <div className="lab__head">
        <p className="lab__exhibit">exhibit 02 · benchmark, don&apos;t guess</p>
        <h3 className="lab__title">CACP Arena</h3>
        <p className="lab__blurb">
          A miniature of{' '}
          <a href="https://github.com/sylwekczmil/cacp" target="_blank" rel="noreferrer">
            CACP
          </a>
          , my benchmarking pipeline published in SoftwareX. The same four classifiers, including
          SEVQ, run live on identical data under two protocols.{' '}
          <strong>batch</strong> hands every model all the data at once: a level field where the
          textbook classifiers often match or beat SEVQ. <strong>stream</strong> feeds the data
          once, in order, with bounded memory. That is the setting incremental learning exists
          for: SEVQ&apos;s prototypes keep what a fixed-size buffer forgets. Same code, same
          split, computed in front of you. <em>The ranking genuinely flips between protocols, so
          measure instead of guessing.</em>
        </p>
      </div>

      <div className="lab__toolbar">
        <span className="lab__toolbar-label">protocol</span>
        {(['stream', 'batch'] as Protocol[]).map((p) => (
          <button
            key={p}
            className={`lab-btn ${protocol === p ? 'on' : ''}`}
            disabled={running}
            onClick={() => setProtocol(p)}
          >
            {p === 'stream' ? 'stream → test' : 'batch 70/30'}
          </button>
        ))}
        <span className="lab__toolbar-sep" />
        <span className="lab__toolbar-label">dataset</span>
        {(Object.keys(DATASETS) as DatasetKey[]).map((key) => (
          <button
            key={key}
            className={`lab-btn ${dataset === key ? 'on' : ''}`}
            disabled={running}
            onClick={() => setDataset(key)}
          >
            {DATASETS[key].name}
          </button>
        ))}
        <span className="lab__toolbar-sep" />
        <button
          className="lab-btn lab-btn--solid"
          disabled={running}
          onClick={() => run(dataset, protocol, true)}
        >
          {running ? 'running…' : '▶ run benchmark'}
        </button>
      </div>

      <div className="arena__grid">
        {results.map((r) => (
          <figure key={r.key} className={`arena__cell ${r.status}`}>
            <figcaption>
              <span className="arena__name">
                {r.name}
                {r.key === 'sevq' && <em> ← mine</em>}
              </span>
              <span className="arena__metric">
                {r.status === 'done' ? `${(r.acc * 100).toFixed(1)}%` : r.status === 'training' ? 'training…' : ''}
              </span>
            </figcaption>
            <canvas
              ref={(el) => {
                if (el) canvases.current.set(r.key, el)
              }}
              className="arena__canvas"
              aria-label={`${r.name} decision boundary`}
            />
          </figure>
        ))}
      </div>

      <div className="arena__board" aria-live="polite">
        {board.map((r, i) => (
          <div
            key={r.key}
            className={`arena__row ${ranked && r.acc === bestAcc ? 'winner' : ''} ${r.status}`}
          >
            <span className="arena__rank">{ranked ? `#${i + 1}` : '··'}</span>
            <span className="arena__row-name">
              {r.name} <small>{r.detail}</small>
            </span>
            <span className="arena__bar">
              <span
                className="arena__bar-fill"
                style={{ width: r.status === 'done' ? `${r.acc * 100}%` : '0%' }}
              />
            </span>
            <span className="arena__nums">
              {r.status === 'done' ? (
                <>
                  <em>{(r.acc * 100).toFixed(1)}%</em> · {r.ms < 1 ? r.ms.toFixed(2) : r.ms.toFixed(1)} ms · {r.size}
                </>
              ) : (
                <em>{r.status === 'training' ? 'fitting…' : 'queued'}</em>
              )}
            </span>
          </div>
        ))}
        <div className="arena__legend">
          <p>
            {protocol === 'stream'
              ? `Stream: one drift-ordered pass; a real stream can't be stored, so lazy learners keep only the last ${WINDOW_BUDGET} samples, then face unseen test data.`
              : 'Batch: a classic 70/30 fit then test; every model sees all the training data at once.'}{' '}
            Misses are ringed in white · reproducible seed.
          </p>
          <p className="arena__legend-cta">
            Full pipeline with statistical validation <span>→</span> <code>pip install cacp</code>
          </p>
        </div>
      </div>
    </div>
  )
}
