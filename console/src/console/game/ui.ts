import { drawText, textWidth } from './font'
import { GH, GW } from './types'
import type { Ctx } from './types'

export function centerText(ctx: Ctx, text: string, y: number, color: string, scale = 1) {
  drawText(ctx, text, Math.floor((GW - textWidth(text, scale)) / 2), y, color, scale)
}

type Line = { text: string; color?: string; scale?: number }

/** Centred message box used for ready / game-over / cleared screens. */
export function panel(ctx: Ctx, lines: Line[], accent = '#ffe36e') {
  const gap = 5
  const heights = lines.map((l) => 7 * (l.scale ?? 1))
  const h = heights.reduce((a, b) => a + b, 0) + gap * (lines.length - 1) + 16
  const w = Math.max(...lines.map((l) => textWidth(l.text, l.scale ?? 1))) + 20
  const x = Math.floor((GW - w) / 2)
  const y = Math.floor((GH - h) / 2)
  ctx.fillStyle = 'rgba(8,10,20,0.88)'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = accent
  ctx.fillRect(x, y, w, 1)
  ctx.fillRect(x, y + h - 1, w, 1)
  let cy = y + 8
  lines.forEach((l, i) => {
    centerText(ctx, l.text, cy, l.color ?? '#ffffff', l.scale ?? 1)
    cy += heights[i] + gap
  })
}

export const blink = (t: number, rate = 2) => Math.floor(t * rate) % 2 === 0
