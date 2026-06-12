export interface Sample {
  x: number
  y: number
  label: number
}

/** Deterministic PRNG so every benchmark run is reproducible. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const gauss = (rnd: () => number) => {
  // Box–Muller
  const u = Math.max(rnd(), 1e-9)
  const v = rnd()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** All generators emit points roughly inside [0,1]². */

export function twoMoons(n: number, noise: number, rnd: () => number): Sample[] {
  // classic interlocking crescents (à la sklearn make_moons), scaled into [0,1]²
  const out: Sample[] = []
  const k = 0.29
  for (let i = 0; i < n; i++) {
    const label = i % 2
    const t = rnd() * Math.PI
    const mx = label === 0 ? Math.cos(t) : 1 - Math.cos(t)
    const my = label === 0 ? Math.sin(t) : 0.5 - Math.sin(t)
    out.push({
      // y flipped: canvas y grows downward
      x: 0.5 + (mx - 0.5) * k + gauss(rnd) * noise,
      y: 0.5 - (my - 0.25) * k + gauss(rnd) * noise,
      label,
    })
  }
  return out
}

export function circles(n: number, noise: number, rnd: () => number): Sample[] {
  const out: Sample[] = []
  for (let i = 0; i < n; i++) {
    const label = i % 2
    const r = label === 0 ? 0.16 : 0.36
    const t = rnd() * Math.PI * 2
    out.push({
      x: 0.5 + Math.cos(t) * r + gauss(rnd) * noise,
      y: 0.5 + Math.sin(t) * r + gauss(rnd) * noise,
      label,
    })
  }
  return out
}

export function spiral(n: number, noise: number, rnd: () => number): Sample[] {
  const out: Sample[] = []
  const classes = 3
  for (let i = 0; i < n; i++) {
    const label = i % classes
    const t = i / n // 0 → 1, radius grows with index (the stream drifts outward)
    const angle = t * 1.7 * Math.PI + (label * 2 * Math.PI) / classes
    const r = 0.07 + t * 0.36
    out.push({
      x: 0.5 + Math.cos(angle) * r + gauss(rnd) * noise,
      y: 0.5 + Math.sin(angle) * r + gauss(rnd) * noise,
      label,
    })
  }
  return out
}

export function xor(n: number, noise: number, rnd: () => number): Sample[] {
  const out: Sample[] = []
  for (let i = 0; i < n; i++) {
    const x = rnd()
    const y = rnd()
    const label = (x > 0.5 ? 1 : 0) ^ (y > 0.5 ? 1 : 0)
    out.push({ x: x + gauss(rnd) * noise * 0.5, y: y + gauss(rnd) * noise * 0.5, label })
  }
  return out
}

export function blobs(n: number, noise: number, rnd: () => number): Sample[] {
  const centers: Array<[number, number]> = [
    [0.25, 0.3],
    [0.75, 0.25],
    [0.5, 0.75],
    [0.85, 0.8],
  ]
  const out: Sample[] = []
  for (let i = 0; i < n; i++) {
    const label = i % centers.length
    out.push({
      x: centers[label][0] + gauss(rnd) * (noise + 0.04),
      y: centers[label][1] + gauss(rnd) * (noise + 0.04),
      label,
    })
  }
  return out
}

export type DatasetKey = 'moons' | 'circles' | 'spiral' | 'xor' | 'blobs'

export const DATASETS: Record<
  DatasetKey,
  { name: string; gen: (n: number, noise: number, rnd: () => number) => Sample[] }
> = {
  moons: { name: 'two moons', gen: twoMoons },
  circles: { name: 'circles', gen: circles },
  spiral: { name: 'spiral ×3', gen: spiral },
  xor: { name: 'xor', gen: xor },
  blobs: { name: 'blobs ×4', gen: blobs },
}

export function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
