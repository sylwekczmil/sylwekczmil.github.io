import type { Sample } from './datasets'

export interface Prototype {
  x: number
  y: number
  label: number
  n: number
}

/**
 * SEVQ — Simple Evolving Vector Quantization (Czmil, Kluska, Czmil; AMCS 2024).
 * 2-D browser implementation of the published algorithm:
 *  - first sample of a class spawns a prototype (category)
 *  - if the nearest prototype matches the sample's class, it absorbs the
 *    sample via an incremental mean update (ART-style learned averaging)
 *  - if it disagrees, a new prototype is created at the sample
 * One pass, no hyperparameters to tune — that is the whole point.
 */
export class SEVQ {
  prototypes: Prototype[] = []

  partialFit(s: Sample) {
    let best = -1
    let bestD = Infinity
    for (let i = 0; i < this.prototypes.length; i++) {
      const p = this.prototypes[i]
      const d = (p.x - s.x) ** 2 + (p.y - s.y) ** 2
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    if (best >= 0 && this.prototypes[best].label === s.label) {
      const p = this.prototypes[best]
      p.n += 1
      p.x += (s.x - p.x) / p.n
      p.y += (s.y - p.y) / p.n
    } else {
      this.prototypes.push({ x: s.x, y: s.y, label: s.label, n: 1 })
    }
  }

  predict(x: number, y: number): number {
    let label = -1
    let bestD = Infinity
    for (const p of this.prototypes) {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2
      if (d < bestD) {
        bestD = d
        label = p.label
      }
    }
    return label
  }

  reset() {
    this.prototypes = []
  }
}
