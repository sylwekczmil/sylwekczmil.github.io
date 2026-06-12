export const CLASS_COLORS = ['#c6f430', '#3ee6d2', '#ffb454', '#ff6ac2']

/**
 * Uniform square mapping between data space [0,1]² and a (usually wider)
 * canvas: the data square is drawn at 1:1 scale, centered, so circles stay
 * circular and moons stay moon-shaped instead of being stretched to the
 * canvas aspect ratio. Decision regions still paint edge-to-edge — the
 * margins are simply data coordinates outside [0,1].
 */
export function squareTransform(width: number, height: number) {
  const s = Math.min(width, height)
  const ox = (width - s) / 2
  const oy = (height - s) / 2
  return {
    toPx: (x: number, y: number) => [ox + x * s, oy + y * s] as const,
    toData: (px: number, py: number) => [(px - ox) / s, (py - oy) / s] as const,
  }
}

const RGB = CLASS_COLORS.map((hex) => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
})

/**
 * Paint decision regions by evaluating `predict` on a coarse grid and
 * upscaling — crisp quantized pixels, very much on-theme.
 */
export function drawDecisionRegions(
  ctx: CanvasRenderingContext2D,
  predict: (x: number, y: number) => number,
  width: number,
  height: number,
  alpha = 42,
  cols = 132,
  rows = 88,
) {
  const off = document.createElement('canvas')
  off.width = cols
  off.height = rows
  const octx = off.getContext('2d')!
  const img = octx.createImageData(cols, rows)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const label = predict((c + 0.5) / cols, (r + 0.5) / rows)
      const i = (r * cols + c) * 4
      if (label >= 0) {
        const [cr, cg, cb] = RGB[label % RGB.length]
        img.data[i] = cr
        img.data[i + 1] = cg
        img.data[i + 2] = cb
        img.data[i + 3] = alpha
      }
    }
  }
  octx.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(off, 0, 0, width, height)
  ctx.imageSmoothingEnabled = true
}

export function drawSampleDot(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  label: number,
  r = 2.4,
  alpha = 0.9,
) {
  ctx.globalAlpha = alpha
  ctx.fillStyle = CLASS_COLORS[label % CLASS_COLORS.length]
  ctx.beginPath()
  ctx.arc(px, py, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}
