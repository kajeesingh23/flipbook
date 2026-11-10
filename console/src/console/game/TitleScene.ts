import { drawText, textWidth, TITLE_FONT } from './font'
import { drawCoin, drawHero } from './sprites'
import { GH, GW } from './types'
import type { Ctx, GameInput } from './types'
import { blink, centerText } from './ui'

const WORLD = 384 // background layers tile every WORLD pixels
const GROUND = 102 // top of the grass
const PLAYER_X = 78 // the hero stays here; the world scrolls past

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

/** Sky, clouds, cliffs, forest and lake — shared by the title and the platformer. */
export class Backdrop {
  private layers = { clouds: clouds(), cliffs: cliffs(), forest: forest() }

  draw(ctx: Ctx, cam: number, t: number) {
    const sky = ['#58b4d6', '#69bfd9', '#7ccadc', '#90d5de', '#a6dfdf', '#bde8de', '#d2efdc', '#e4f5dc']
    sky.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.fillRect(0, i * 12, GW, 12)
    })
    blit(ctx, this.layers.clouds, cam + t * 12, 0.08)
    blit(ctx, this.layers.cliffs, cam, 0.25)
    blit(ctx, this.layers.forest, cam, 0.5)

    // Lake
    ctx.fillStyle = '#2f97c2'
    ctx.fillRect(0, 88, GW, GH - 88)
    ctx.fillStyle = '#55b5d6'
    ctx.fillRect(0, 88, GW, 2)
    ctx.fillStyle = '#b9eef0'
    for (let i = 0; i < 16; i++) {
      const wx = mod(i * 53 - cam * 0.7, GW + 20) - 10
      const wy = 91 + ((i * 5) % 9)
      const w = 3 + ((i + Math.floor(t * 2.5)) % 4)
      ctx.fillRect(Math.floor(wx), wy, w, 1)
    }
  }
}

function blit(ctx: Ctx, layer: HTMLCanvasElement, cam: number, factor: number) {
  const o = -Math.floor(mod(cam * factor, WORLD))
  ctx.drawImage(layer, o, 0)
  ctx.drawImage(layer, o + WORLD, 0)
}

// ── Title scene ─────────────────────────────────────────────────────────────

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

/**
 * The console's home screen: the ADVENTURE key art over a small free-roam
 * scene. It is what shows whenever no cartridge game is running.
 */
export class TitleScene {
  private backdrop = new Backdrop()
  private ground = ground()

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
  private score = 0
  private gems = GEMS.map((g) => ({ ...g, respawn: 0 }))
  private sparks: Spark[] = []

  reset() {
    this.score = 0
    this.px = 60
    this.py = 5
    this.nightTarget = 0
    this.idle = 99
    this.gems.forEach((g) => (g.respawn = 0))
  }

  private burst(x: number, y: number, colors: string[], count = 12) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const s = 25 + (i % 3) * 14
      this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 12, life: 0.55, color: colors[i % colors.length] })
    }
  }

  update(dt: number, input: GameInput) {
    this.t += dt
    const feetY = GROUND + 4 + this.py - this.z
    let active = false

    if (input.pressed.a && this.z === 0) this.vz = 105
    if (input.pressed.b) this.burst(PLAYER_X + this.facing * 6, feetY - 10, ['#fff08a', '#ffc233', '#ffffff'])
    if (input.pressed.c) this.nightTarget = this.nightTarget ? 0 : 1
    if (input.pressed.a || input.pressed.b || input.pressed.c) active = true

    this.night += (this.nightTarget - this.night) * Math.min(1, dt * 4)

    const mx = Math.abs(input.x) < 0.15 ? 0 : input.x
    const my = Math.abs(input.y) < 0.15 ? 0 : input.y
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
  }

  draw(ctx: Ctx) {
    const cam = this.px - PLAYER_X
    this.backdrop.draw(ctx, cam, this.t)
    ctx.fillStyle = '#1f7fae'
    ctx.fillRect(0, GROUND - 3, GW, 3)
    blit(ctx, this.ground, cam, 1)

    for (const g of this.gems) {
      if (g.respawn > 0) continue
      const dx = mod(g.x - this.px + WORLD / 2, WORLD) - WORLD / 2
      drawCoin(ctx, Math.floor(PLAYER_X + dx), Math.floor(GROUND + 2 - g.h + Math.sin(this.t * 3 + g.x) * 1.5))
    }

    // Hero with a ground shadow that shrinks while airborne
    const feet = Math.floor(GROUND + 4 + this.py)
    const sw = this.z > 10 ? 6 : 10
    ctx.fillStyle = 'rgba(30,40,20,0.35)'
    ctx.fillRect(PLAYER_X - sw / 2, feet, sw, 2)
    const step = this.moving && this.z === 0 ? Math.floor(this.walk) % 2 : 0
    drawHero(ctx, PLAYER_X, feet - Math.floor(this.z), this.facing, step, this.z > 0)

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

    // Coin counter fades in once the title is away
    if (this.titleT < 0.5) {
      drawCoin(ctx, 37, 9)
      const n = String(this.score).padStart(2, '0')
      drawText(ctx, n, 45, 7, '#3a1408')
      drawText(ctx, n, 44, 6, '#ffffff')
    }

    if (this.titleT > 0.01) this.drawTitle(ctx)

    // How to start a game: always present, kept quiet
    if (blink(this.t, 1.2)) {
      const msg = 'PRESS A CARTRIDGE TO PLAY'
      const w = textWidth(msg)
      ctx.fillStyle = 'rgba(10,14,24,0.72)'
      ctx.fillRect((GW - w) / 2 - 4, GH - 13, w + 8, 11)
      centerText(ctx, msg, GH - 11, '#ffffff')
    }
  }

  private drawTitle(ctx: Ctx) {
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
}
