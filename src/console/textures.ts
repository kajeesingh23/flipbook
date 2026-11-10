import { CanvasTexture, NearestFilter, SRGBColorSpace } from 'three'
import { drawText, textWidth } from './game/font'

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function finish(c: HTMLCanvasElement, pixelated = false) {
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  if (pixelated) tex.magFilter = NearestFilter
  return tex
}

/** Small technical label set in the 5×7 bitmap font. */
export function bitmapLabel(text: string, color: string) {
  const scale = 4
  const [c, ctx] = canvas(textWidth(text, scale) + scale * 2, 9 * scale)
  drawText(ctx, text, scale, scale, color, scale)
  return { texture: finish(c, true), aspect: c.width / c.height }
}

/** "Play" sticker: white interior, coral-pink outline, thin white die-cut edge. */
export function playSticker() {
  const [c, ctx] = canvas(640, 320)
  ctx.font = '700 230px Fredoka, "Arial Rounded MT Bold", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  const draw = (stroke: string, width: number) => {
    ctx.strokeStyle = stroke
    ctx.lineWidth = width
    ctx.strokeText('Play', 320, 165)
  }
  draw('#fbf7f4', 46)
  draw('#F0708A', 30)
  ctx.fillStyle = '#ffffff'
  ctx.fillText('Play', 320, 165)
  return finish(c)
}

/** Text that reads as moulded into the surface: highlight above, shadow below. */
export function embossed(text: string, base = '#F0E7E2', weight = 700) {
  const [c, ctx] = canvas(512, 96)
  ctx.font = `${weight} 58px Fredoka, "Arial Rounded MT Bold", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText(text, 256, 46)
  ctx.fillStyle = 'rgba(40,25,20,0.7)'
  ctx.fillText(text, 256, 51)
  ctx.fillStyle = base
  ctx.fillText(text, 256, 48.5)
  return finish(c)
}

export function smiley() {
  const [c, ctx] = canvas(256, 256)
  ctx.strokeStyle = ctx.fillStyle = '#141414'
  ctx.lineCap = 'round'
  ctx.lineWidth = 13
  for (const x of [98, 158]) {
    ctx.beginPath()
    ctx.ellipse(x, 104, 9, 15, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(128, 122, 58, Math.PI * 0.16, Math.PI * 0.84)
  ctx.stroke()
  return finish(c)
}

/** White paper label for the memory card, text running along its length. */
export function memoryLabel() {
  const [c, ctx] = canvas(96, 320)
  ctx.fillStyle = '#fbfaf8'
  ctx.fillRect(0, 0, 96, 320)
  ctx.translate(48, 160)
  ctx.rotate(Math.PI / 2)
  ctx.font = '700 34px Fredoka, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#2b2f3a'
  ctx.fillText('Memory Card', 0, 2)
  return finish(c)
}
