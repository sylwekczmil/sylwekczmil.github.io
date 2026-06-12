import type { Sample } from './datasets'
import { SEVQ } from './sevq'

export interface Classifier {
  key: string
  name: string
  detail: string
  incremental: boolean
  /** batch protocol: learn from the whole training set at once */
  fit(train: Sample[]): void
  /**
   * streaming protocol: one pass, sample by sample, bounded memory.
   * Lazy learners must respect WINDOW_BUDGET; parametric ones learn online.
   */
  fitStream(stream: Sample[]): void
  predict(x: number, y: number): number
  /** model memory shown on the leaderboard, e.g. "38 prototypes" */
  size(): string
}

/** max raw samples a lazy learner may keep in the streaming protocol */
export const WINDOW_BUDGET = 120

/* ------------------------------------------------ SEVQ (the PhD algorithm) */

export class SevqClassifier implements Classifier {
  key = 'sevq'
  name = 'SEVQ'
  detail = 'my algorithm · truly incremental'
  incremental = true
  private model = new SEVQ()

  fit(train: Sample[]) {
    this.model.reset()
    for (const s of train) this.model.partialFit(s)
  }
  // SEVQ is natively incremental — batch and stream are the same single pass
  fitStream(stream: Sample[]) {
    this.fit(stream)
  }
  predict(x: number, y: number) {
    return this.model.predict(x, y)
  }
  size() {
    return `${this.model.prototypes.length} prototypes`
  }
}

/* ----------------------------------------------------------------- 5-NN */

export class KnnClassifier implements Classifier {
  key = 'knn'
  name = '5-NN'
  detail = 'lazy learner · stores samples'
  incremental = false
  private train: Sample[] = []
  private windowed = false

  fit(train: Sample[]) {
    this.train = train
    this.windowed = false
  }
  // streaming: a lazy learner can only keep a sliding window of the stream
  fitStream(stream: Sample[]) {
    this.train = stream.slice(-WINDOW_BUDGET)
    this.windowed = true
  }
  predict(x: number, y: number) {
    const k = 5
    // partial selection of k nearest — fine at demo scale
    const dists = this.train.map((s) => ({ d: (s.x - x) ** 2 + (s.y - y) ** 2, label: s.label }))
    dists.sort((a, b) => a.d - b.d)
    const votes = new Map<number, number>()
    for (let i = 0; i < Math.min(k, dists.length); i++) {
      votes.set(dists[i].label, (votes.get(dists[i].label) ?? 0) + 1)
    }
    let best = -1
    let bestV = -1
    votes.forEach((v, label) => {
      if (v > bestV) {
        bestV = v
        best = label
      }
    })
    return best
  }
  size() {
    return this.windowed
      ? `${this.train.length} stored (window cap)`
      : `${this.train.length} stored samples`
  }
}

/* ------------------------------------------------- Gaussian Naive Bayes */

export class GnbClassifier implements Classifier {
  key = 'gnb'
  name = 'Naive Bayes'
  detail = 'gaussian · closed form'
  incremental = false
  private stats: Array<{ label: number; mx: number; my: number; vx: number; vy: number; prior: number }> = []

  fit(train: Sample[]) {
    const byLabel = new Map<number, Sample[]>()
    train.forEach((s) => {
      if (!byLabel.has(s.label)) byLabel.set(s.label, [])
      byLabel.get(s.label)!.push(s)
    })
    this.stats = []
    byLabel.forEach((samples, label) => {
      const n = samples.length
      const mx = samples.reduce((a, s) => a + s.x, 0) / n
      const my = samples.reduce((a, s) => a + s.y, 0) / n
      const vx = samples.reduce((a, s) => a + (s.x - mx) ** 2, 0) / n + 1e-4
      const vy = samples.reduce((a, s) => a + (s.y - my) ** 2, 0) / n + 1e-4
      this.stats.push({ label, mx, my, vx, vy, prior: n / train.length })
    })
  }
  // gaussian stats accumulate exactly one sample at a time (Welford),
  // so the streaming pass yields the same model as the batch fit
  fitStream(stream: Sample[]) {
    const acc = new Map<number, { n: number; mx: number; my: number; m2x: number; m2y: number }>()
    for (const s of stream) {
      if (!acc.has(s.label)) acc.set(s.label, { n: 0, mx: 0, my: 0, m2x: 0, m2y: 0 })
      const a = acc.get(s.label)!
      a.n += 1
      const dx = s.x - a.mx
      a.mx += dx / a.n
      a.m2x += dx * (s.x - a.mx)
      const dy = s.y - a.my
      a.my += dy / a.n
      a.m2y += dy * (s.y - a.my)
    }
    this.stats = []
    acc.forEach((a, label) => {
      this.stats.push({
        label,
        mx: a.mx,
        my: a.my,
        vx: a.m2x / a.n + 1e-4,
        vy: a.m2y / a.n + 1e-4,
        prior: a.n / stream.length,
      })
    })
  }
  predict(x: number, y: number) {
    let best = -1
    let bestLp = -Infinity
    for (const st of this.stats) {
      const lp =
        Math.log(st.prior) -
        0.5 * (Math.log(2 * Math.PI * st.vx) + (x - st.mx) ** 2 / st.vx) -
        0.5 * (Math.log(2 * Math.PI * st.vy) + (y - st.my) ** 2 / st.vy)
      if (lp > bestLp) {
        bestLp = lp
        best = st.label
      }
    }
    return best
  }
  size() {
    return `${this.stats.length * 5} parameters`
  }
}

/* -------------------------------- Softmax regression on quadratic features */

export class LogRegClassifier implements Classifier {
  key = 'logreg'
  name = 'Logistic Reg.'
  detail = 'softmax · poly² features'
  incremental = false
  private W: number[][] = [] // [class][feature]
  private classes: number[] = []

  private feats(x: number, y: number) {
    const cx = x - 0.5
    const cy = y - 0.5
    return [1, cx, cy, cx * cx, cy * cy, cx * cy]
  }

  private sgd(samples: Sample[], epochs: number, lr: number) {
    const F = 6
    for (let e = 0; e < epochs; e++) {
      for (const s of samples) {
        const f = this.feats(s.x, s.y)
        const logits = this.W.map((w) => w.reduce((a, wi, i) => a + wi * f[i], 0))
        const mx = Math.max(...logits)
        const exps = logits.map((l) => Math.exp(l - mx))
        const Z = exps.reduce((a, b) => a + b, 0)
        for (let c = 0; c < this.classes.length; c++) {
          const p = exps[c] / Z
          const target = this.classes[c] === s.label ? 1 : 0
          const g = p - target
          for (let i = 0; i < F; i++) this.W[c][i] -= lr * g * f[i]
        }
      }
    }
  }

  fit(train: Sample[]) {
    this.classes = [...new Set(train.map((s) => s.label))].sort()
    this.W = this.classes.map(() => new Array(6).fill(0))
    this.sgd(train, 220, 0.6)
  }
  // streaming: each sample is seen exactly once (online SGD)
  fitStream(stream: Sample[]) {
    this.classes = [...new Set(stream.map((s) => s.label))].sort()
    this.W = this.classes.map(() => new Array(6).fill(0))
    this.sgd(stream, 1, 0.5)
  }
  predict(x: number, y: number) {
    const f = this.feats(x, y)
    let best = -1
    let bestL = -Infinity
    for (let c = 0; c < this.classes.length; c++) {
      const l = this.W[c].reduce((a, wi, i) => a + wi * f[i], 0)
      if (l > bestL) {
        bestL = l
        best = this.classes[c]
      }
    }
    return best
  }
  size() {
    return `${this.classes.length * 6} weights`
  }
}

export const makeArenaClassifiers = (): Classifier[] => [
  new SevqClassifier(),
  new KnnClassifier(),
  new GnbClassifier(),
  new LogRegClassifier(),
]
