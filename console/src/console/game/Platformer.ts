import { drawText } from './font'
import { drawCoin, drawHeart, drawHero } from './sprites'
import { Backdrop } from './TitleScene'
import { GW } from './types'
import type { Ctx, GameInput, MiniGame } from './types'
import { panel } from './ui'

const T = 8 // tile size
const LW = 140 // level width in tiles
const FLAG_COL = 134
const LH = 16
const HERO_W = 6
const HERO_H = 11
const GRAVITY = 540
const JUMP = 196

type Enemy = { x: number; y: number; vx: number; min: number; max: number; alive: boolean }

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

/**
 * Builds the level procedurally so every span is easy to read and tune.
 * '#' ground, '=' floating platform, 'o' coin, '^' spikes, 'F' finish flag.
 */
function buildLevel() {
  const grid = Array.from({ length: LH }, () => Array<string>(LW).fill(' '))
  const enemies: Enemy[] = []
  const put = (x: number, y: number, c: string) => (grid[y][x] = c)
  const ground = (x0: number, x1: number, top = 13) => {
    for (let x = x0; x <= x1; x++) for (let y = top; y < LH; y++) put(x, y, '#')
  }
  const platform = (x0: number, x1: number, y: number) => {
    for (let x = x0; x <= x1; x++) put(x, y, '=')
  }
  const coins = (x0: number, x1: number, y: number, stride = 1) => {
    for (let x = x0; x <= x1; x += stride) put(x, y, 'o')
  }
  const enemy = (x: number, min: number, max: number, top = 13) =>
    enemies.push({ x: x * T, y: top * T - 6, vx: 22, min: min * T, max: (max + 1) * T - 8, alive: true })

  // 1. Gentle start
  ground(0, 21)
  coins(8, 12, 11, 2)
  // 2. First gap, a coin-lined ledge, spikes, then the first slime
  ground(25, 54)
  platform(28, 34, 9)
  coins(29, 33, 8)
  put(38, 12, '^')
  put(39, 12, '^')
  enemy(45, 43, 47)
  // 3. Raised plateau
  ground(58, 72, 11)
  coins(61, 65, 9, 2)
  put(66, 10, '^')
  // 4. Stepping stones over water
  platform(76, 78, 10)
  put(77, 8, 'o')
  platform(82, 85, 9)
  put(84, 7, 'o')
  // 5. Second slime and a staircase to the high coins
  ground(88, 110)
  enemy(93, 91, 95)
  platform(99, 101, 10)
  platform(104, 106, 7)
  coins(104, 106, 5)
  // 6. Final gap, last hazards and the flag
  ground(114, LW - 1)
  put(119, 12, '^')
  put(120, 12, '^')
  enemy(127, 125, 129)
  coins(124, 128, 11, 2)
  put(FLAG_COL, 12, 'F')

  const total = grid.flat().filter((c) => c === 'o').length
  return { grid, enemies, total }
}

/** Small side-scrolling run to the flag: gaps, spikes, slimes and coins. */
export class Platformer implements MiniGame {
  readonly title = 'ADVENTURE'
  readonly color = '#EC5536'
  readonly pauseButton = null

  private backdrop = new Backdrop()
  private grid: string[][] = []
  private enemies: Enemy[] = []
  private total = 0
  private state: 'playing' | 'dead' | 'over' | 'win' = 'playing'
  private x = 0
  private y = 0
  private vx = 0
  private vy = 0
  private onGround = false
  private facing = 1
  private coyote = 0
  private buffer = 0
  private lives = 3
  private coins = 0
  private cam = 0
  private deadT = 0
  private walk = 0
  private t = 0

  constructor() {
    this.reset()
  }

  get idle() {
    return this.state === 'over' || this.state === 'win'
  }

  reset() {
    Object.assign(this, buildLevel())
    this.lives = 3
    this.coins = 0
    this.cam = 0
    this.spawn()
  }

  private spawn() {
    this.x = 2 * T
    this.y = 13 * T - HERO_H
    this.vx = this.vy = 0
    this.facing = 1
    this.onGround = true
    this.buffer = this.coyote = 0
    this.state = 'playing'
  }

  private tile(tx: number, ty: number) {
    return ty < 0 || ty >= LH || tx < 0 || tx >= LW ? ' ' : this.grid[ty][tx]
  }

  private solid(tx: number, ty: number) {
    if (tx < 0 || tx >= LW) return true // level edges are walls
    const c = this.tile(tx, ty)
    return c === '#' || c === '='
  }

  private blocked(x: number, y: number) {
    const x0 = Math.floor(x / T)
    const x1 = Math.floor((x + HERO_W - 0.01) / T)
    const y0 = Math.floor(y / T)
    const y1 = Math.floor((y + HERO_H - 0.01) / T)
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solid(tx, ty)) return true
    return false
  }

  private die() {
    if (this.state !== 'playing') return
    this.lives--
    this.state = 'dead'
    this.deadT = 0.9
    this.vy = -150
  }

  update(dt: number, input: GameInput) {
    this.t += dt
    if (this.state === 'over' || this.state === 'win') {
      if (input.pressed.b || input.pressed.c) this.reset()
      return
    }
    if (this.state === 'dead') {
      this.deadT -= dt
      this.vy += GRAVITY * dt
      this.y += this.vy * dt
      if (this.deadT <= 0) {
        if (this.lives <= 0) this.state = 'over'
        else this.spawn()
      }
      return
    }

    // Run: stick / pad / keys. Blue held = sprint.
    const ax = Math.abs(input.x) > 0.2 ? input.x : 0
    this.vx = ax * (input.held.a ? 96 : 66)
    if (ax) this.facing = Math.sign(ax)
    this.walk += Math.abs(this.vx) * dt * 0.16

    // Jump on yellow or red, with a little input buffering and coyote time.
    this.buffer = input.pressed.b || input.pressed.c ? 0.12 : this.buffer - dt
    this.coyote = this.onGround ? 0.09 : this.coyote - dt
    if (this.buffer > 0 && this.coyote > 0) {
      this.vy = -JUMP
      this.buffer = this.coyote = 0
      this.onGround = false
    }
    // Releasing early cuts the jump short.
    if (this.vy < 0 && !input.held.b && !input.held.c) this.vy += GRAVITY * dt * 1.4
    this.vy = Math.min(this.vy + GRAVITY * dt, 270)

    // Horizontal move and resolve
    let nx = this.x + this.vx * dt
    if (this.blocked(nx, this.y)) {
      nx = this.vx > 0 ? Math.floor((nx + HERO_W - 0.01) / T) * T - HERO_W : (Math.floor(nx / T) + 1) * T
      this.vx = 0
    }
    this.x = nx

    // Vertical move and resolve
    let ny = this.y + this.vy * dt
    this.onGround = false
    if (this.blocked(this.x, ny)) {
      if (this.vy > 0) {
        ny = Math.floor((ny + HERO_H - 0.01) / T) * T - HERO_H
        this.onGround = true
      } else ny = (Math.floor(ny / T) + 1) * T
      this.vy = 0
    }
    this.y = ny

    if (this.y > LH * T + 12) return this.die()

    // Tiles the hero overlaps: coins, spikes, flag
    const x0 = Math.floor(this.x / T)
    const x1 = Math.floor((this.x + HERO_W - 0.01) / T)
    const y0 = Math.floor(this.y / T)
    const y1 = Math.floor((this.y + HERO_H - 0.01) / T)
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        const c = this.tile(tx, ty)
        if (c === 'o') {
          this.grid[ty][tx] = ' '
          this.coins++
        } else if (c === '^') {
          // Forgiving hitbox: only the lower, inner part of the spike tile
          if (this.x + HERO_W > tx * T + 2 && this.x < tx * T + 6 && this.y + HERO_H > ty * T + 4) return this.die()
        } else if (c === 'F') this.state = 'win'
      }

    // Slimes patrol their span; stomp them from above, otherwise they hurt.
    for (const e of this.enemies) {
      if (!e.alive) continue
      e.x += e.vx * dt
      if (e.x < e.min) {
        e.x = e.min
        e.vx = Math.abs(e.vx)
      } else if (e.x > e.max) {
        e.x = e.max
        e.vx = -Math.abs(e.vx)
      }
      const hit = this.x < e.x + 8 && this.x + HERO_W > e.x && this.y < e.y + 6 && this.y + HERO_H > e.y
      if (!hit) continue
      if (this.vy > 0 && this.y + HERO_H - e.y < 6) {
        e.alive = false
        this.vy = -150
      } else return this.die()
    }

    const target = clamp(this.x - 76 + this.facing * 10, 0, LW * T - GW)
    this.cam += (target - this.cam) * Math.min(1, dt * 6)
  }

  draw(ctx: Ctx) {
    const cam = Math.floor(this.cam)
    this.backdrop.draw(ctx, cam, this.t)

    const tx0 = Math.floor(cam / T)
    for (let ty = 0; ty < LH; ty++)
      for (let tx = tx0; tx <= tx0 + GW / T; tx++) {
        const c = this.tile(tx, ty)
        if (c === ' ') continue
        const x = tx * T - cam
        const y = ty * T
        if (c === '#') {
          ctx.fillStyle = ty > 13 ? '#7b4e30' : '#9a6a43'
          ctx.fillRect(x, y, T, T)
          if ((tx * 7 + ty * 13) % 5 === 0) {
            ctx.fillStyle = '#b98556'
            ctx.fillRect(x + 2, y + 4, 2, 1)
          }
          if (this.tile(tx, ty - 1) !== '#') {
            ctx.fillStyle = '#4fa53e'
            ctx.fillRect(x, y, T, 4)
            ctx.fillStyle = '#86d651'
            ctx.fillRect(x, y, T, 2)
            if ((tx * 5) % 3 === 0) ctx.fillRect(x + 3, y - 2, 1, 2)
          }
        } else if (c === '=') {
          ctx.fillStyle = '#8a5a35'
          ctx.fillRect(x, y, T, 6)
          ctx.fillStyle = '#c98a4b'
          ctx.fillRect(x, y, T, 4)
          ctx.fillStyle = '#86d651'
          ctx.fillRect(x, y, T, 2)
          ctx.fillStyle = '#6b4226'
          if (tx % 2) ctx.fillRect(x, y + 3, 1, 3)
        } else if (c === 'o') {
          drawCoin(ctx, x + 4, y + 4 + Math.round(Math.sin(this.t * 4 + tx) * 1))
        } else if (c === '^') {
          ctx.fillStyle = '#5c6470'
          ctx.fillRect(x, y + 6, T, 2)
          ctx.fillStyle = '#eef1f4'
          for (const sx of [0, 4]) {
            ctx.fillRect(x + sx + 1, y + 2, 2, 4)
            ctx.fillRect(x + sx, y + 4, 4, 2)
          }
        } else if (c === 'F') {
          ctx.fillStyle = '#eef1f4'
          ctx.fillRect(x + 3, y - 24, 2, 32)
          ctx.fillStyle = '#ffd23f'
          ctx.fillRect(x + 2, y - 26, 4, 3)
          const wave = Math.round(Math.sin(this.t * 5) * 1)
          ctx.fillStyle = '#e74732'
          ctx.fillRect(x + 5, y - 23 + wave, 9, 7)
          ctx.fillStyle = '#ff8a6a'
          ctx.fillRect(x + 5, y - 23 + wave, 9, 2)
        }
      }

    for (const e of this.enemies) {
      if (!e.alive) continue
      const x = Math.floor(e.x - cam)
      if (x < -8 || x > GW) continue
      const squish = Math.floor(this.t * 4) % 2
      ctx.fillStyle = '#b8366e'
      ctx.fillRect(x, e.y + 1 + squish, 8, 5 - squish)
      ctx.fillStyle = '#e25590'
      ctx.fillRect(x + 1, e.y + squish, 6, 4 - squish)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + 1, e.y + 2, 2, 2)
      ctx.fillRect(x + 5, e.y + 2, 2, 2)
      ctx.fillStyle = '#2a1a16'
      const look = e.vx > 0 ? 1 : 0
      ctx.fillRect(x + 1 + look, e.y + 3, 1, 1)
      ctx.fillRect(x + 5 + look, e.y + 3, 1, 1)
    }

    // Hero (blinks while the death hop plays)
    if (this.state !== 'dead' || Math.floor(this.t * 14) % 2) {
      const step = this.onGround && this.vx ? Math.floor(this.walk) % 2 : 0
      drawHero(ctx, this.x - cam + HERO_W / 2, this.y + HERO_H, this.facing, step, !this.onGround)
    }

    // HUD
    ctx.fillStyle = 'rgba(10,14,24,0.6)'
    ctx.fillRect(0, 0, GW, 13)
    drawCoin(ctx, 8, 6)
    drawText(ctx, `${String(this.coins).padStart(2, '0')}-${this.total}`, 15, 3, '#ffffff')
    for (let i = 0; i < 3; i++) drawHeart(ctx, GW - 30 + i * 9, 3, i < this.lives)
    // Progress to the flag
    const bar = 60
    const bx = (GW - bar) / 2
    ctx.fillStyle = '#3a4258'
    ctx.fillRect(bx, 6, bar, 1)
    ctx.fillStyle = '#ffe36e'
    ctx.fillRect(bx + Math.round(Math.min(1, this.x / (FLAG_COL * T)) * (bar - 2)), 5, 2, 3)
    ctx.fillStyle = '#e74732'
    ctx.fillRect(bx + bar, 4, 2, 4)

    if (this.state === 'over')
      panel(ctx, [
        { text: 'GAME OVER', scale: 2, color: '#ff7a5c' },
        { text: `COINS ${this.coins}-${this.total}` },
        { text: 'YELLOW - RETRY', color: '#ffe36e' },
      ])
    if (this.state === 'win') {
      const all = this.coins === this.total
      const msg = all ? 'ALL COINS FOUND!' : `COINS ${this.coins}-${this.total}`
      panel(ctx, [
        { text: 'LEVEL CLEAR!', scale: 2, color: '#ffe36e' },
        { text: msg },
        { text: 'YELLOW - PLAY AGAIN', color: '#ffe36e' },
      ])
    }
  }
}
