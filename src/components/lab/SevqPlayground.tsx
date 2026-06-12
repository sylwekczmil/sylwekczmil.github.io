import { useCallback, useEffect, useRef, useState } from 'react'
import { SEVQ } from '../../lib/sevq'
import { DATASETS, mulberry32, type DatasetKey, type Sample } from '../../lib/datasets'
import { CLASS_COLORS, drawDecisionRegions, drawSampleDot, squareTransform } from '../../lib/draw'

const STREAMABLE: DatasetKey[] = ['moons', 'spiral', 'blobs']
const ACC_WINDOW = 120
const STREAM_NOISE: Record<DatasetKey, number> = {
  moons: 0.035,
  spiral: 0.03,
  blobs: 0.045,
  circles: 0.032,
  xor: 0.04,
}

export default function SevqPlayground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const model = useRef(new SEVQ())
  const samples = useRef<Sample[]>([])
  const outcomes = useRef<number[]>([]) // 1 = correct prequential prediction
  const streamId = useRef(0)
  const seed = useRef(7)

  const [selectedClass, setSelectedClass] = useState(0)
  const [showRegions, setShowRegions] = useState(true)
  const [stats, setStats] = useState({ seen: 0, prototypes: 0, acc: -1 })
  const [streaming, setStreaming] = useState(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (canvas.width !== Math.round(w * dpr)) {
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // data lives in a square; the wide canvas letterboxes it so shapes stay true
    const { toPx, toData } = squareTransform(w, h)

    if (showRegions && model.current.prototypes.length > 0) {
      drawDecisionRegions(
        ctx,
        (fx, fy) => {
          const [dx, dy] = toData(fx * w, fy * h)
          return model.current.predict(dx, dy)
        },
        w,
        h,
      )
    }

    for (const s of samples.current) {
      const [px, py] = toPx(s.x, s.y)
      drawSampleDot(ctx, px, py, s.label, 2.2, 0.75)
    }

    for (const p of model.current.prototypes) {
      const color = CLASS_COLORS[p.label % CLASS_COLORS.length]
      const r = 5 + Math.min(p.n, 40) * 0.18
      const [px, py] = toPx(p.x, p.y)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.globalAlpha = 0.95
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(px, py, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }, [showRegions])

  const syncStats = useCallback(() => {
    const o = outcomes.current
    setStats({
      seen: samples.current.length,
      prototypes: model.current.prototypes.length,
      acc: o.length >= 10 ? o.reduce((a, b) => a + b, 0) / o.length : -1,
    })
  }, [])

  const learnOne = useCallback((s: Sample) => {
    // predict-then-train: honest streaming accuracy
    if (model.current.prototypes.length > 0) {
      const pred = model.current.predict(s.x, s.y)
      outcomes.current.push(pred === s.label ? 1 : 0)
      if (outcomes.current.length > ACC_WINDOW) outcomes.current.shift()
    }
    model.current.partialFit(s)
    samples.current.push(s)
  }, [])

  const reset = useCallback(() => {
    streamId.current++
    setStreaming(false)
    model.current.reset()
    samples.current = []
    outcomes.current = []
    syncStats()
    redraw()
  }, [redraw, syncStats])

  const stream = useCallback(
    (key: DatasetKey) => {
      reset()
      const id = ++streamId.current
      setStreaming(true)
      seed.current += 13
      const rnd = mulberry32(seed.current)
      const data = DATASETS[key].gen(key === 'spiral' ? 300 : 260, STREAM_NOISE[key], rnd)
      let i = 0
      const step = () => {
        if (id !== streamId.current) return
        for (let k = 0; k < 3 && i < data.length; k++, i++) {
          const s = data[i]
          learnOne({ x: Math.min(Math.max(s.x, 0.02), 0.98), y: Math.min(Math.max(s.y, 0.02), 0.98), label: s.label })
        }
        syncStats()
        redraw()
        if (i < data.length) requestAnimationFrame(step)
        else setStreaming(false)
      }
      requestAnimationFrame(step)
    },
    [learnOne, redraw, reset, syncStats],
  )

  const onPointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const { toData } = squareTransform(rect.width, rect.height)
      const [x, y] = toData(e.clientX - rect.left, e.clientY - rect.top)
      learnOne({ x, y, label: selectedClass })
      syncStats()
      redraw()
    },
    [learnOne, redraw, selectedClass, syncStats],
  )

  useEffect(() => {
    redraw()
    const onResize = () => redraw()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [redraw])

  // kill any in-flight stream on unmount — StrictMode remounts share the DOM
  // node, so an orphaned rAF loop would keep painting over the new instance
  useEffect(() => {
    const id = streamId
    return () => {
      id.current++
    }
  }, [])

  // a small demo runs on first reveal so the canvas is never an empty box
  const booted = useRef(false)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !booted.current) {
          booted.current = true
          stream('moons')
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(canvas)
    return () => io.disconnect()
  }, [stream])

  return (
    <div className="lab__panel" id="lab-sevq">
      <div className="lab__head">
        <p className="lab__exhibit">exhibit 01 · incremental learning, live</p>
        <h3 className="lab__title">SEVQ Playground</h3>
        <p className="lab__blurb">
          This is the actual algorithm from my PhD thesis (
          <a href="https://doi.org/10.61822/amcs-2024-0011" target="_blank" rel="noreferrer">
            AMCS 2024
          </a>
          ), running live right here. It learns <em>one sample at a time</em>, with no retraining
          and no hyperparameters. <strong>Click the canvas to teach it</strong>, or stream a
          dataset and watch the decision regions evolve.
        </p>
      </div>

      <div className="lab__toolbar">
        <span className="lab__toolbar-label">draw as</span>
        {[0, 1, 2].map((c) => (
          <button
            key={c}
            className={`lab__swatch ${selectedClass === c ? 'on' : ''}`}
            style={{ '--swatch': CLASS_COLORS[c] } as React.CSSProperties}
            onClick={() => setSelectedClass(c)}
            aria-label={`Draw class ${c + 1}`}
          />
        ))}
        <span className="lab__toolbar-sep" />
        <span className="lab__toolbar-label">stream</span>
        {STREAMABLE.map((key) => (
          <button key={key} className="lab-btn" disabled={streaming} onClick={() => stream(key)}>
            {DATASETS[key].name}
          </button>
        ))}
        <span className="lab__toolbar-sep" />
        <button className={`lab-btn ${showRegions ? 'on' : ''}`} onClick={() => setShowRegions((v) => !v)}>
          regions
        </button>
        <button className="lab-btn" onClick={reset}>
          clear
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="lab__canvas"
        onPointerDown={onPointer}
        aria-label="SEVQ interactive canvas, click to add training samples"
      />

      <div className="lab__stats">
        <span>
          samples <em>{stats.seen}</em>
        </span>
        <span>
          prototypes <em>{stats.prototypes}</em>
        </span>
        <span>
          streaming accuracy{' '}
          <em>{stats.acc < 0 ? '·' : `${(stats.acc * 100).toFixed(1)}%`}</em>
        </span>
        <span className="lab__stats-note">1 pass · 0 hyperparameters · predict-then-train</span>
      </div>
    </div>
  )
}
