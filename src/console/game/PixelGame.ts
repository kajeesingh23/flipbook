import { axes, events, useConsole } from '../store'
import { drawText, textWidth, TITLE_FONT } from './font'

export const GW = 192
export const GH = 128

const WORLD = 384 // background layers tile every WORLD pixels
const GROUND = 102 // top of the grass
const PLAYER_X = 78 // the hero stays here; the world scrolls past

type Ctx = CanvasRenderingContext2D
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string }

const mod = (n: number, m: number) => ((n % m) + m) % m
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

function rng(seed: number) {
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
}

function makeLayer(draw: (ctx: Ctx) => void) {
  const c = document.createElement('canvas')
  c.width = WORLD
  c.height = GH
  draw(c.getContext('2d')!)
  return c
}

function disc(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy))
    ctx.fillRect(cx - w, cy + dy, w * 2 + 1, 1)
  }
}

/** Run a draw call three times so shapes crossing the seam wrap cleanly. */
function tiled(fn: (offset: number) => void) {
  for (const o of [-WORLD, 0, WORLD]) fn(o)
}

// ── Static scenery layers ───────────────────────────────────────────────────

const clouds = () =>
  makeLayer((ctx) => {
    const r = rng(11)
    for (let i = 0; i < 7; i++) {
      const x = Math.floor((i * WORLD) / 7 + r() * 20)
      const y = Math.floor(8 + r() * 30)
      const w = Math.floor(18 + r() * 22)
      tiled((o) => {
        ctx.fillStyle = '#c9ecec'
        ctx.fillRect(x + o, y + 3, w, 3)
        ctx.fillStyle = '#f2fbf6'
        ctx.fillRect(x + o + 3, y, w - 8, 4)
        ctx.fillRect(x + o + 1, y + 2, w - 2, 2)
      })
    }
  })

const cliffs = () =>
  makeLayer((ctx) => {
    const ridge = (x: number, base: number, amp: number, phase: number) => {
      const t = (x / WORLD) * Math.PI * 2
      return base + amp * Math.sin(t * 2 + phase) + amp * 0.55 * Math.sin(t * 5 + phase * 3) + amp * 0.3 * Math.sin(t * 9)
    }
    // Hazy distant range
    for (let x = 0; x < WORLD; x += 2) {
      const top = Math.round((90 - ridge(x, 46, 12, 2.4)) / 2) * 2
      ctx.fillStyle = '#a5d6d2'
      ctx.fillRect(x, top, 2, 92 - top)
    }
    // Mossy cliff faces
    for (let x = 0; x < WORLD; x += 2) {
      const top = Math.round((90 - ridge(x, 30, 15, 0.6)) / 2) * 2
      ctx.fillStyle = '#5fa3a4'
      ctx.fillRect(x, top, 2, 92 - top)
      if ((x / 2) % 6 < 2) {
        ctx.fillStyle = '#4c8c93'
        ctx.fillRect(x, top + 8, 2, 92 - top)
      }
      ctx.fillStyle = '#74c07b'
      ctx.fillRect(x, top, 2, 4)
      ctx.fillStyle = '#a2dd84'
      ctx.fillRect(x, top, 2, 2)
      if ((x / 2) % 5 === 0) {
        ctx.fillStyle = '#74c07b'
        ctx.fillRect(x, top + 4, 2, 4) // hanging vines
      }
    }
    // Waterfall
    const fx = 236
    const top = Math.round((90 - ridge(fx, 30, 15, 0.6)) / 2) * 2 + 4
    ctx.fillStyle = '#e6faf6'
    ctx.fillRect(fx, top, 8, 92 - top)
    ctx.fillStyle = '#a8e2ea'
    ctx.fillRect(fx + 2, top, 1, 92 - top)
    ctx.fillRect(fx + 5, top + 3, 1, 92 - top)
  })

const forest = () =>
  makeLayer((ctx) => {
    const r = rng(7)
    for (let i = 0; i < 24; i++) {
      const x = Math.floor((i * WORLD) / 24 + r() * 8)
      const rad = Math.floor(6 + r() * 6)
      const y = Math.floor(84 - r() * 5)
      tiled((o) => {
        disc(ctx, x + o, y, rad, '#256b48')
        disc(ctx, x + o - 2, y - 2, rad - 2, '#3a8e55')
        disc(ctx, x + o - 3, y - 4, Math.max(rad - 5, 1), '#62b65c')
      })
    }
    ctx.fillStyle = '#1c5540'
    ctx.fillRect(0, 86, WORLD, 3)
  })

const ground = () =>
  makeLayer((ctx) => {
    const r = rng(23)
    // Standing trees on the near bank
    for (const x of [36, 148, 262, 338]) {
      tiled((o) => {
        ctx.fillStyle = '#6b4226'
        ctx.fillRect(x + o - 2, GROUND - 20, 5, 24)
        ctx.fillStyle = '#8a5a35'
        ctx.fillRect(x + o - 2, GROUND - 20, 2, 24)
        disc(ctx, x + o, GROUND - 28, 13, '#1f6a3c')
        disc(ctx, x + o + 8, GROUND - 22, 8, '#1f6a3c')
        disc(ctx, x + o - 9, GROUND - 23, 8, '#1f6a3c')
        disc(ctx, x + o - 2, GROUND - 31, 10, '#3d9a48')
        disc(ctx, x + o - 5, GROUND - 34, 6, '#7ccf4c')
      })
    }
    for (let x = 0; x < WORLD; x++) {
      const lip = r() > 0.7 ? 1 : 0
      ctx.fillStyle = '#86d651'
      ctx.fillRect(x, GROUND - lip, 1, 2 + lip)
      ctx.fillStyle = '#4fa53e'
      ctx.fillRect(x, GROUND + 2, 1, 5)
      ctx.fillStyle = '#3a8a36'
      ctx.fillRect(x, GROUND + 7, 1, r() > 0.5 ? 2 : 1)
    }
    // Sunlit dirt path
    ctx.fillStyle = '#9a6a43'
    ctx.fillRect(0, GROUND + 8, WORLD, GH)
    ctx.fillStyle = '#7b4e30'
    ctx.fillRect(0, GROUND + 20, WORLD, GH)
    for (let i = 0; i < 260; i++) {
      const x = Math.floor(r() * WORLD)
      const y = GROUND + 9 + Math.floor(r() * 17)
      ctx.fillStyle = r() > 0.5 ? '#b98556' : '#6a4128'
      ctx.fillRect(x, y, r() > 0.6 ? 2 : 1, 1)
    }
    // Grass tufts and flowers along the lip
    for (let i = 0; i < 46; i++) {
      const x = Math.floor(r() * WORLD)
      ctx.fillStyle = '#86d651'
      ctx.fillRect(x, GROUND - 3, 1, 3)
      ctx.fillRect(x + 2, GROUND - 2, 1, 2)
      if (r() > 0.6) {
        ctx.fillStyle = r() > 0.5 ? '#ffe36e' : '#ff8fa3'
        ctx.fillRect(x + 1, GROUND - 4, 2, 2)
      }
    }
  })

// ── Game ────────────────────────────────────────────────────────────────────

const GEMS = [
  { x: 30, h: 8 },
  { x: 96, h: 27 },
  { x: 158, h: 10 },
  { x: 214, h: 30 },
  { x: 288, h: 8 },
  { x: 350, h: 25 },
]

const TITLE = 'ADVENTURE'
const TITLE_RAMP = ['#fff08a', '#ffdc4a', '#ffc233', '#ff9f2e', '#f6792b', '#e7532b', '#cf342c']

export class PixelGame {
  readonly canvas = document.createElement('canvas')
  private ctx: Ctx
  private layers = { clouds: clouds(), cliffs: cliffs(), forest: forest(), ground: ground() }

  private t = 0
  private px = 60
  private py = 5
  private z = 0
  private vz = 0
  private facing = 1
  private walk = 0
  private moving = false
  private idle = 99
  private titleT = 1
  private night = 0
  private nightTarget = 0
  private paused = false
  private score = 0
  private gems = GEMS.map((g) => ({ ...g, respawn: 0 }))
  private sparks: Spark[] = []
  private toast = { text: '', t: 0 }
  private flash = 0

  constructor() {
    this.canvas.width = GW
    this.canvas.height = GH
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false
    this.draw(true)
  }

  private say(text: string, t = 1.6) {
    this.toast = { text, t }
  }

  private burst(x: number, y: number, colors: string[], count = 12) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const s = 25 + (i % 3) * 14
      this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 12, life: 0.55, color: colors[i % colors.length] })
    }
  }

  update(dt: number) {
    dt = Math.min(dt, 0.05)
    const s = useConsole.getState()
    const hasCart = s.carts.top
    this.t += dt

    let active = false
    for (const e of events.splice(0)) {
      active = true
      if (e.type === 'cart') {
        if (e.id === 'top') this.say(e.inserted ? 'GAME LOADED' : '')
        else if (e.id === 'right') this.say(e.inserted ? 'MEMORY CARD OK' : 'NO MEMORY CARD')
        else this.say(e.inserted ? 'EXPANSION OK' : 'EXPANSION OUT')
        if (e.inserted) this.flash = 1
      } else if (e.type === 'knob') {
        const n = Math.round(e.level * 8)
        this.say('LIGHT ' + '#'.repeat(n) + '_'.repeat(8 - n), 1.1)
      } else if (e.type === 'pause') {
        this.paused = !this.paused
      } else if (e.type === 'reset') {
        this.score = 0
        this.px = 60
        this.py = 5
        this.nightTarget = 0
        this.paused = false
        this.idle = 99
        this.gems.forEach((g) => (g.respawn = 0))
        this.flash = 1
      } else if (hasCart && !this.paused) {
        const feetY = GROUND + 4 + this.py - this.z
        if (e.id === 'a' && this.z === 0) this.vz = 105
        if (e.id === 'b') this.burst(PLAYER_X + this.facing * 6, feetY - 10, ['#fff08a', '#ffc233', '#ffffff'])
        if (e.id === 'c') {
          this.nightTarget = this.nightTarget ? 0 : 1
          this.flash = 0.6
        }
      }
    }

    this.toast.t = Math.max(0, this.toast.t - dt)
    this.flash = Math.max(0, this.flash - dt * 3)
    this.night += (this.nightTarget - this.night) * Math.min(1, dt * 4)

    if (s.power && hasCart && !this.paused) {
      let mx = clamp(axes.joyX + s.pad.x, -1, 1)
      let my = clamp(axes.joyY + s.pad.y, -1, 1)
      if (Math.abs(mx) < 0.15) mx = 0
      if (Math.abs(my) < 0.15) my = 0
      this.moving = mx !== 0 || my !== 0
      if (this.moving) active = true
      if (mx) this.facing = Math.sign(mx)
      this.px += mx * 52 * dt
      this.py = clamp(this.py - my * 26 * dt, 0, 15)
      this.walk += (Math.abs(mx) + Math.abs(my) * 0.6) * dt * 9

      if (this.z > 0 || this.vz > 0) {
        this.vz -= 330 * dt
        this.z = Math.max(0, this.z + this.vz * dt)
        if (this.z === 0) this.vz = 0
      }

      for (const g of this.gems) {
        if (g.respawn > 0) {
          g.respawn -= dt
          continue
        }
        const dx = mod(g.x - this.px + WORLD / 2, WORLD) - WORLD / 2
        if (Math.abs(dx) < 8 && Math.abs(this.z + 9 - g.h) < 11) {
          g.respawn = 7
          this.score++
          this.burst(PLAYER_X + dx, GROUND + 4 + this.py - g.h - 4, ['#fff08a', '#ffffff'], 8)
        }
      }
    }

    for (const p of this.sparks) {
      p.life -= dt
      p.vy += 90 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
    }
    this.sparks = this.sparks.filter((p) => p.life > 0)

    // The title card returns after a few seconds without input.
    this.idle = active ? 0 : this.idle + dt
    const titleTarget = this.idle > 6 ? 1 : 0
    this.titleT += (titleTarget - this.titleT) * Math.min(1, dt * 5)

    this.draw(hasCart)
  }

  private blit(layer: HTMLCanvasElement, cam: number, factor: number) {
    const o = -Math.floor(mod(cam * factor, WORLD))
    this.ctx.drawImage(layer, o, 0)
    this.ctx.drawImage(layer, o + WORLD, 0)
  }

  private draw(hasCart: boolean) {
    const { ctx } = this
    if (!hasCart) return this.drawNoCart()

    const cam = this.px - PLAYER_X

    // Sky
    const sky = ['#58b4d6', '#69bfd9', '#7ccadc', '#90d5de', '#a6dfdf', '#bde8de', '#d2efdc', '#e4f5dc']
    sky.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.fillRect(0, i * 12, GW, 12)
    })
    this.blit(this.layers.clouds, cam + this.t * 12, 0.08)
    this.blit(this.layers.cliffs, cam, 0.25)
    this.blit(this.layers.forest, cam, 0.5)

    // Lake
    ctx.fillStyle = '#2f97c2'
    ctx.fillRect(0, 88, GW, GROUND - 88)
    ctx.fillStyle = '#55b5d6'
    ctx.fillRect(0, 88, GW, 2)
    ctx.fillStyle = '#1f7fae'
    ctx.fillRect(0, GROUND - 3, GW, 3)
    ctx.fillStyle = '#b9eef0'
    for (let i = 0; i < 16; i++) {
      const wx = mod(i * 53 - cam * 0.7, GW + 20) - 10
      const wy = 91 + ((i * 5) % 9)
      const w = 3 + ((i + Math.floor(this.t * 2.5)) % 4)
      ctx.fillRect(Math.floor(wx), wy, w, 1)
    }

    this.blit(this.layers.ground, cam, 1)

    // Gems
    for (const g of this.gems) {
      if (g.respawn > 0) continue
      const dx = mod(g.x - this.px + WORLD / 2, WORLD) - WORLD / 2
      const x = Math.floor(PLAYER_X + dx)
      const y = Math.floor(GROUND + 2 - g.h + Math.sin(this.t * 3 + g.x) * 1.5)
      ctx.fillStyle = '#b8791c'
      ctx.fillRect(x - 2, y - 3, 5, 7)
      ctx.fillRect(x - 3, y - 2, 7, 5)
      ctx.fillStyle = '#ffd23f'
      ctx.fillRect(x - 2, y - 2, 5, 5)
      ctx.fillStyle = '#fff6b0'
      ctx.fillRect(x - 1, y - 2, 2, 2)
    }

    this.drawHero()

    // Dark canopy framing the corners, like the reference key art
    for (const [x, y, r] of [[4, 2, 16], [22, -4, 12], [-2, 22, 9], [188, 0, 17], [168, -5, 11], [194, 22, 8]] as const)
      disc(ctx, x, y, r, '#17493a')
    for (const [x, y, r] of [[8, 4, 9], [26, 0, 5], [184, 3, 10], [166, -2, 5]] as const) disc(ctx, x, y, r, '#226247')

    // Dusk tint
    if (this.night > 0.01) {
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = this.night
      ctx.fillStyle = '#5a5fc0'
      ctx.fillRect(0, 0, GW, GH)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#fff6c8'
      for (let i = 0; i < 18; i++) if ((i + Math.floor(this.t * 2)) % 5) ctx.fillRect((i * 47) % GW, (i * 23) % 46, 1, 1)
      ctx.globalAlpha = 1
    }

    for (const p of this.sparks) {
      ctx.fillStyle = p.color
      const sz = p.life > 0.25 ? 2 : 1
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), sz, sz)
    }

    // HUD fades in once the title is away
    if (this.titleT < 0.5) {
      ctx.fillStyle = '#3a1408'
      ctx.fillRect(34, 5, 7, 9)
      ctx.fillStyle = '#ffd23f'
      ctx.fillRect(35, 6, 5, 7)
      ctx.fillStyle = '#fff6b0'
      ctx.fillRect(36, 7, 2, 2)
      const n = String(this.score).padStart(2, '0')
      drawText(ctx, n, 45, 7, '#3a1408')
      drawText(ctx, n, 44, 6, '#ffffff')
    }

    if (this.titleT > 0.01) this.drawTitle()

    if (this.paused) {
      ctx.fillStyle = 'rgba(10,12,30,0.55)'
      ctx.fillRect(0, 0, GW, GH)
      if (Math.floor(this.t * 2) % 2) drawText(ctx, 'PAUSE', (GW - textWidth('PAUSE', 2)) / 2, 54, '#ffffff', 2)
    }

    this.drawToast()

    if (this.flash > 0) {
      ctx.globalAlpha = this.flash
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, GW, GH)
      ctx.globalAlpha = 1
    }
  }

  private drawHero() {
    const { ctx } = this
    const feet = Math.floor(GROUND + 4 + this.py)
    const y = feet - Math.floor(this.z)
    const step = this.moving && this.z === 0 ? Math.floor(this.walk) % 2 : 0
    const bob = this.moving && this.z === 0 && step ? 1 : 0

    // Ground shadow shrinks while airborne
    ctx.fillStyle = 'rgba(30,40,20,0.35)'
    const sw = this.z > 10 ? 6 : 10
    ctx.fillRect(PLAYER_X - sw / 2, feet, sw, 2)

    ctx.save()
    ctx.translate(PLAYER_X, y)
    ctx.scale(this.facing, 1)
    const R = (c: string, x: number, yy: number, w: number, h: number) => {
      ctx.fillStyle = c
      ctx.fillRect(x, yy, w, h)
    }
    // Legs
    if (this.z > 0) {
      R('#2b3a55', -3, -5, 3, 4)
      R('#2b3a55', 1, -5, 3, 3)
    } else if (step) {
      R('#2b3a55', -4, -5, 3, 5)
      R('#2b3a55', 2, -5, 3, 4)
    } else {
      R('#2b3a55', -3, -5, 3, 5)
      R('#2b3a55', 1, -5, 3, 5)
    }
    R('#5a3a24', this.z > 0 ? -3 : step ? -4 : -3, -1, 3, 1)
    // Backpack (the reference hero's signature red pack)
    R('#a82a1c', -7, -13 + bob, 4, 8)
    R('#e74732', -7, -13 + bob, 3, 6)
    R('#f5bd35', -6, -9 + bob, 2, 1)
    // Torso
    R('#2f8a63', -3, -13 + bob, 7, 8)
    R('#3fa878', -1, -13 + bob, 4, 5)
    R('#e9b58c', 3, -11 + bob, 2, 3) // arm
    // Head
    R('#e9b58c', -2, -19 + bob, 6, 6)
    R('#2a1a16', -3, -20 + bob, 7, 3)
    R('#2a1a16', -3, -18 + bob, 3, 4)
    R('#2a1a16', 2, -16 + bob, 1, 1) // eye
    ctx.restore()
  }

  private drawTitle() {
    const { ctx } = this
    const ease = this.titleT * this.titleT * (3 - 2 * this.titleT)
    const sx = 2
    const sy = 3
    const gw = 7 * sx
    const gap = 2
    const total = TITLE.length * (gw + gap) - gap
    const x0 = Math.floor((GW - total) / 2)
    const y0 = Math.floor(58 - (1 - ease) * 96 + Math.sin(this.t * 1.6) * 1)

    const each = (fn: (x: number, y: number, row: number) => void) => {
      ;[...TITLE].forEach((ch, i) => {
        const glyph = TITLE_FONT[ch]
        for (let r = 0; r < 7; r++)
          for (let c = 0; c < 7; c++) if (glyph[r][c] === '1') fn(x0 + i * (gw + gap) + c * sx, y0 + r * sy, r)
      })
    }

    // Drop shadow, dark outline, then the yellow→red face
    ctx.fillStyle = '#1b0905'
    each((x, y) => ctx.fillRect(x - 1, y + 1, sx + 3, sy + 3))
    ctx.fillStyle = '#4a1a0a'
    each((x, y) => ctx.fillRect(x - 1, y - 1, sx + 2, sy + 2))
    each((x, y, r) => {
      ctx.fillStyle = TITLE_RAMP[r]
      ctx.fillRect(x, y, sx, sy)
    })
    ctx.fillStyle = '#fffbe0'
    each((x, y, r) => {
      if (r === 0) ctx.fillRect(x, y, sx, 1)
    })

    // Dashed rule under the title
    const ry = y0 + 7 * sy + 5
    for (let x = x0; x < x0 + total; x += 6) {
      ctx.fillStyle = '#4a1a0a'
      ctx.fillRect(x, ry + 1, 4, 1)
      ctx.fillStyle = '#ffe9a8'
      ctx.fillRect(x, ry, 4, 1)
    }
  }

  private drawToast() {
    const { ctx } = this
    const { text, t } = this.toast
    if (!text || t <= 0) return
    const w = textWidth(text)
    const x = Math.floor((GW - w) / 2)
    ctx.fillStyle = '#10131c'
    ctx.fillRect(x - 5, GH - 20, w + 10, 13)
    ctx.fillStyle = '#ffe36e'
    ctx.fillRect(x - 5, GH - 20, w + 10, 1)
    drawText(ctx, text, x, GH - 16, '#ffffff')
  }

  private drawNoCart() {
    const { ctx } = this
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, GW, GH)
    for (let i = 0; i < 420; i++) {
      const v = 40 + Math.floor(Math.random() * 90)
      ctx.fillStyle = `rgb(${v},${v},${v + 12})`
      ctx.fillRect(Math.floor(Math.random() * GW), Math.floor(Math.random() * GH), 2, 1)
    }
    if (Math.floor(this.t * 2) % 2) drawText(ctx, 'NO CART', (GW - textWidth('NO CART', 2)) / 2, 48, '#ffffff', 2)
    drawText(ctx, 'INSERT GAME', (GW - textWidth('INSERT GAME')) / 2, 72, '#ffc233')
    this.drawToast()
  }
}
