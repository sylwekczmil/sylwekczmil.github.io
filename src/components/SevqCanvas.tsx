import { useEffect, useRef } from 'react'

/**
 * Live visualization of incremental vector quantization (a nod to SEVQ,
 * the algorithm from my PhD): data points stream in, get classified into
 * the nearest category prototype, and each absorption nudges the prototype
 * — the model literally learns on screen, one sample at a time.
 *
 * Pointer repels nearby points; click/tap injects a burst of new samples.
 */

interface Centroid {
  x: number
  y: number
  hx: number // home position (fraction of canvas)
  hy: number
  color: string
  pulse: number
  label: string
}

interface Point {
  x: number
  y: number
  vx: number
  vy: number
  cat: number
  life: number
}

const COLORS = ['#c6f430', '#3ee6d2', '#ffb454', '#ff6ac2']
const LABELS = ['w₁', 'w₂', 'w₃', 'w₄']
const HOMES: Array<[number, number]> = [
  [0.58, 0.26],
  [0.86, 0.48],
  [0.62, 0.78],
  [0.36, 0.55],
]
const MAX_POINTS = 90
const LEARNING_RATE = 0.045

export default function SevqCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dpr = 1
    let raf = 0
    let running = true
    let lastSpawn = 0

    const centroids: Centroid[] = HOMES.map(([hx, hy], i) => ({
      x: 0,
      y: 0,
      hx,
      hy,
      color: COLORS[i],
      pulse: 0,
      label: LABELS[i],
    }))

    const points: Point[] = []
    const pointer = { x: -9999, y: -9999 }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      centroids.forEach((c) => {
        // keep prototypes near their home corner on resize
        c.x = c.hx * width
        c.y = c.hy * height
      })
    }

    const spawnPoint = (x?: number, y?: number) => {
      if (points.length >= MAX_POINTS) return
      const cat = Math.floor(Math.random() * centroids.length)
      let px = x
      let py = y
      if (px === undefined || py === undefined) {
        // spawn just outside a random edge
        const edge = Math.floor(Math.random() * 4)
        if (edge === 0) (px = Math.random() * width), (py = -10)
        else if (edge === 1) (px = width + 10), (py = Math.random() * height)
        else if (edge === 2) (px = Math.random() * width), (py = height + 10)
        else (px = -10), (py = Math.random() * height)
      }
      points.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        cat,
        life: 1,
      })
    }

    const drawStaticFrame = () => {
      // reduced-motion fallback: a single calm scatter, no animation
      resize()
      ctx.clearRect(0, 0, width, height)
      centroids.forEach((c) => {
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * Math.PI * 2
          const r = 20 + Math.random() * 90
          ctx.globalAlpha = 0.5
          ctx.fillStyle = c.color
          ctx.beginPath()
          ctx.arc(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r * 0.8, 1.6, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 0.9
        ctx.strokeStyle = c.color
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(c.x, c.y, 10, 0, Math.PI * 2)
        ctx.stroke()
      })
      ctx.globalAlpha = 1
    }

    const tick = (t: number) => {
      if (!running) return
      ctx.clearRect(0, 0, width, height)

      // steady stream of new samples
      if (t - lastSpawn > 220 && points.length < MAX_POINTS) {
        spawnPoint()
        lastSpawn = t
      }

      // draw classification edges first (under everything)
      for (const p of points) {
        const c = centroids[p.cat]
        const dx = c.x - p.x
        const dy = c.y - p.y
        const dist = Math.hypot(dx, dy)
        if (dist < 200) {
          ctx.globalAlpha = (1 - dist / 200) * 0.28 * p.life
          ctx.strokeStyle = c.color
          ctx.lineWidth = 0.7
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(c.x, c.y)
          ctx.stroke()
        }
      }

      // update + draw points
      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i]
        const c = centroids[p.cat]
        const dx = c.x - p.x
        const dy = c.y - p.y
        const dist = Math.hypot(dx, dy) || 1

        // attraction toward assigned prototype
        p.vx += (dx / dist) * 0.028
        p.vy += (dy / dist) * 0.028

        // gentle pointer repulsion
        const pdx = p.x - pointer.x
        const pdy = p.y - pointer.y
        const pdist = Math.hypot(pdx, pdy)
        if (pdist < 110 && pdist > 0.01) {
          const f = ((110 - pdist) / 110) * 0.55
          p.vx += (pdx / pdist) * f
          p.vy += (pdy / pdist) * f
        }

        p.vx *= 0.965
        p.vy *= 0.965
        p.x += p.vx
        p.y += p.vy

        // absorbed: prototype pulses and takes one incremental learning step
        if (dist < 14) {
          c.pulse = 1
          c.x += (p.x - c.x) * LEARNING_RATE
          c.y += (p.y - c.y) * LEARNING_RATE
          points.splice(i, 1)
          continue
        }

        ctx.globalAlpha = 0.85 * p.life
        ctx.fillStyle = c.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.7, 0, Math.PI * 2)
        ctx.fill()
      }

      // centroids drift back toward home so the composition stays balanced
      for (const c of centroids) {
        c.x += (c.hx * width - c.x) * 0.0012
        c.y += (c.hy * height - c.y) * 0.0012
        c.pulse *= 0.94

        const r = 9 + c.pulse * 7

        ctx.globalAlpha = 0.14 + c.pulse * 0.25
        ctx.fillStyle = c.color
        ctx.beginPath()
        ctx.arc(c.x, c.y, r * 2.6, 0, Math.PI * 2)
        ctx.fill()

        ctx.globalAlpha = 0.85
        ctx.strokeStyle = c.color
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2)
        ctx.stroke()

        ctx.globalAlpha = 1
        ctx.fillStyle = c.color
        ctx.beginPath()
        ctx.arc(c.x, c.y, 2.2, 0, Math.PI * 2)
        ctx.fill()

        ctx.globalAlpha = 0.55
        ctx.fillStyle = '#e9ece7'
        ctx.font = '11px "IBM Plex Mono", monospace'
        ctx.fillText(c.label, c.x + r + 8, c.y + 4)
      }

      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
    }
    const onPointerLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
    }
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      for (let i = 0; i < 12; i++) {
        spawnPoint(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50)
      }
    }

    const start = () => {
      if (!running) {
        running = true
        raf = requestAnimationFrame(tick)
      }
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const onVisibility = () => (document.hidden ? stop() : start())

    resize()

    if (reduceMotion) {
      drawStaticFrame()
      window.addEventListener('resize', drawStaticFrame)
      return () => window.removeEventListener('resize', drawStaticFrame)
    }

    for (let i = 0; i < 36; i++) {
      spawnPoint(Math.random() * width, Math.random() * height)
    }

    window.addEventListener('resize', resize)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('click', onClick)
    document.addEventListener('visibilitychange', onVisibility)

    // pause the loop when the hero scrolls out of view
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), {
      threshold: 0,
    })
    io.observe(canvas)

    raf = requestAnimationFrame(tick)

    return () => {
      stop()
      io.disconnect()
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('click', onClick)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="hero__canvas" aria-hidden="true" />
}
