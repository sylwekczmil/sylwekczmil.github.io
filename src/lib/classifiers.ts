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
  /** optional landmark points to overlay on the tile (SEVQ prototypes) */
  markers?(): Array<{ x: number; y: number; label: number }>
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
  markers() {
    return this.model.prototypes
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
  detail = 'gaussian · naturally incremental'
  incremental = true
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

/* -------------------------------------------------- Hoeffding Tree (VFDT) */

interface Welford {
  n: number
  mean: number
  m2: number
}
const newWelford = (): Welford => ({ n: 0, mean: 0, m2: 0 })
const wPush = (w: Welford, v: number) => {
  w.n += 1
  const d = v - w.mean
  w.mean += d / w.n
  w.m2 += d * (v - w.mean)
}
const wSd = (w: Welford) => Math.sqrt(w.n > 1 ? w.m2 / w.n : 0) + 1e-6

/** standard normal CDF (Abramowitz–Stegun approximation) */
function phi(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}

interface HNode {
  depth: number
  seen: number
  counts: Map<number, number>
  // per class, one Gaussian estimator per feature (x, y)
  stats: Map<number, [Welford, Welford]>
  fallback: number
  split?: { feat: 0 | 1; thr: number; left: HNode; right: HNode }
}

const newHNode = (depth: number, fallback: number): HNode => ({
  depth,
  seen: 0,
  counts: new Map(),
  stats: new Map(),
  fallback,
})

const entropy = (masses: number[]) => {
  const total = masses.reduce((a, b) => a + b, 0)
  if (total <= 0) return 0
  let h = 0
  for (const m of masses) {
    if (m <= 0) continue
    const p = m / total
    h -= p * Math.log2(p)
  }
  return h
}

/**
 * Hoeffding Tree (VFDT, Domingos & Hulten 2000): an incremental decision tree
 * that splits a leaf only once the Hoeffding bound guarantees the best split
 * beats the runner-up. Numeric attributes are summarized with per-class
 * Gaussian estimators; leaves predict naive-Bayes style (VFDT-NB).
 */
export class HoeffdingTreeClassifier implements Classifier {
  key = 'htree'
  name = 'Hoeffding Tree'
  detail = 'VFDT · incremental tree'
  incremental = true
  private root: HNode = newHNode(0, -1)
  private static GRACE = 30
  private static DELTA = 1e-7
  private static TIE = 0.05
  private static MAX_DEPTH = 6

  fit(train: Sample[]) {
    this.root = newHNode(0, -1)
    for (const s of train) this.partialFit(s)
  }
  // the tree is incremental by construction: same single pass either way
  fitStream(stream: Sample[]) {
    this.fit(stream)
  }

  private leafFor(x: number, y: number): HNode {
    let node = this.root
    while (node.split) {
      const v = node.split.feat === 0 ? x : y
      node = v <= node.split.thr ? node.split.left : node.split.right
    }
    return node
  }

  partialFit(s: Sample) {
    const leaf = this.leafFor(s.x, s.y)
    leaf.seen += 1
    leaf.counts.set(s.label, (leaf.counts.get(s.label) ?? 0) + 1)
    if (!leaf.stats.has(s.label)) leaf.stats.set(s.label, [newWelford(), newWelford()])
    const [fx, fy] = leaf.stats.get(s.label)!
    wPush(fx, s.x)
    wPush(fy, s.y)
    if (
      leaf.seen % HoeffdingTreeClassifier.GRACE === 0 &&
      leaf.counts.size > 1 &&
      leaf.depth < HoeffdingTreeClassifier.MAX_DEPTH
    ) {
      this.attemptSplit(leaf)
    }
  }

  /** info gain of splitting `leaf` at feature/threshold, from Gaussian summaries */
  private gainOf(leaf: HNode, feat: 0 | 1, thr: number): number {
    const parentMasses: number[] = []
    const leftMasses: number[] = []
    const rightMasses: number[] = []
    leaf.counts.forEach((count, label) => {
      const w = leaf.stats.get(label)![feat]
      const pLeft = phi((thr - w.mean) / wSd(w))
      parentMasses.push(count)
      leftMasses.push(count * pLeft)
      rightMasses.push(count * (1 - pLeft))
    })
    const total = parentMasses.reduce((a, b) => a + b, 0)
    const wl = leftMasses.reduce((a, b) => a + b, 0) / total
    return entropy(parentMasses) - (wl * entropy(leftMasses) + (1 - wl) * entropy(rightMasses))
  }

  private attemptSplit(leaf: HNode) {
    // candidate thresholds: class means and midpoints between them, per feature
    const candidates: Array<{ feat: 0 | 1; thr: number; gain: number }> = []
    for (const feat of [0, 1] as const) {
      const means = [...leaf.stats.values()].map((w) => w[feat].mean).sort((a, b) => a - b)
      const thrs = new Set<number>(means)
      for (let i = 1; i < means.length; i++) thrs.add((means[i - 1] + means[i]) / 2)
      thrs.forEach((thr) => candidates.push({ feat, thr, gain: this.gainOf(leaf, feat, thr) }))
    }
    candidates.sort((a, b) => b.gain - a.gain)
    const best = candidates[0]
    const second = candidates[1]
    if (!best || best.gain <= 0) return

    // Hoeffding bound: split only when the observed gain lead is significant
    const range = Math.max(1, Math.log2(leaf.counts.size))
    const eps = Math.sqrt(
      (range * range * Math.log(1 / HoeffdingTreeClassifier.DELTA)) / (2 * leaf.seen),
    )
    const lead = best.gain - (second?.gain ?? 0)
    if (lead > eps || eps < HoeffdingTreeClassifier.TIE) {
      let fallback = leaf.fallback
      let bestCount = -1
      leaf.counts.forEach((count, label) => {
        if (count > bestCount) {
          bestCount = count
          fallback = label
        }
      })
      leaf.split = {
        feat: best.feat,
        thr: best.thr,
        left: newHNode(leaf.depth + 1, fallback),
        right: newHNode(leaf.depth + 1, fallback),
      }
    }
  }

  predict(x: number, y: number) {
    const leaf = this.leafFor(x, y)
    if (leaf.counts.size === 0) return leaf.fallback
    // naive-Bayes leaf: class priors × per-feature Gaussian likelihoods
    let best = leaf.fallback
    let bestLp = -Infinity
    leaf.counts.forEach((count, label) => {
      const [fx, fy] = leaf.stats.get(label)!
      const sx = wSd(fx)
      const sy = wSd(fy)
      const lp =
        Math.log(count / leaf.seen) -
        Math.log(sx) -
        ((x - fx.mean) * (x - fx.mean)) / (2 * sx * sx) -
        Math.log(sy) -
        ((y - fy.mean) * (y - fy.mean)) / (2 * sy * sy)
      if (lp > bestLp) {
        bestLp = lp
        best = label
      }
    })
    return best
  }

  size() {
    let nodes = 0
    const walk = (n: HNode) => {
      nodes += 1
      if (n.split) {
        walk(n.split.left)
        walk(n.split.right)
      }
    }
    walk(this.root)
    return nodes === 1 ? '1 tree node' : `${nodes} tree nodes`
  }
}

export const makeArenaClassifiers = (): Classifier[] => [
  new SevqClassifier(),
  new HoeffdingTreeClassifier(),
  new KnnClassifier(),
  new GnbClassifier(),
]
