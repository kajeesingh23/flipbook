import { axes, CART_GAME, events, useConsole } from '../store'
import type { ButtonId, GameId } from '../store'
import { drawText, textWidth } from './font'
import { Platformer } from './Platformer'
import { Pong } from './Pong'
import { Snake } from './Snake'
import { TitleScene } from './TitleScene'
import { GH, GW } from './types'
import type { Ctx, GameInput, MiniGame } from './types'
import { blink, centerText } from './ui'

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const LOAD_TIME = 0.95
const DISSOLVE_TIME = 0.35
const BLOCK = 8

/**
 * The console's "firmware". Owns the display canvas, merges every physical
 * control into one GameInput per frame, runs whichever cartridge is seated
 * and handles the transitions between title, loading, play and pause.
 * It knows nothing about Three.js: the display just samples its canvas.
 */
export class GameSystem {
  readonly canvas = document.createElement('canvas')
  private ctx: Ctx
  /** Last frame of the outgoing screen, dissolved away block by block */
  private snapshot = document.createElement('canvas')
  private snapCtx: Ctx

  private title = new TitleScene()
  private games: Record<GameId, MiniGame> = { snake: new Snake(), pong: new Pong(), platformer: new Platformer() }

  private current: GameId | null = null
  private phase: 'title' | 'loading' | 'game' = 'title'
  private phaseT = 0
  private paused = false
  private dissolve = 0
  private flash = 0
  private toast = { text: '', t: 0 }
  private t = 0

  constructor() {
    for (const c of [this.canvas, this.snapshot]) {
      c.width = GW
      c.height = GH
    }
    // Keep both canvases CPU-backed: the display is uploaded to a texture every
    // frame, which is far cheaper from a software canvas than a GPU one.
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
    this.snapCtx = this.snapshot.getContext('2d', { willReadFrequently: true })!
    this.ctx.imageSmoothingEnabled = false
    this.title.draw(this.ctx)
  }

  /** Freeze the current picture so the next one can dissolve in over it. */
  private cut() {
    this.snapCtx.drawImage(this.canvas, 0, 0)
    this.dissolve = 1
    this.flash = 0.5
  }

  private readInput(pressed: Record<ButtonId, boolean>, tap: { x: number; y: number } | null): GameInput {
    const s = useConsole.getState()
    const x = clamp(axes.joyX + s.pad.x, -1, 1)
    const y = clamp(axes.joyY + s.pad.y, -1, 1)
    let dx = 0
    let dy = 0
    if (Math.abs(x) > 0.45 || Math.abs(y) > 0.45) {
      if (Math.abs(x) >= Math.abs(y)) dx = Math.sign(x)
      else dy = Math.sign(y)
    } else if (tap) {
      // A tap shorter than one frame still counts as a direction press.
      dx = tap.x
      dy = tap.y
    }
    return { x, y, dx, dy, held: s.pressed, pressed }
  }

  update(dt: number) {
    dt = Math.min(dt, 0.05)
    const s = useConsole.getState()
    this.t += dt
    this.phaseT += dt

    // Controls → one input snapshot. Events are always drained so nothing
    // queues up while the display is off.
    const pressed = { a: false, b: false, c: false }
    let sidePause = false
    let sideReset = false
    let tap: { x: number; y: number } | null = null
    for (const e of events.splice(0)) {
      if (e.type === 'button') pressed[e.id] = true
      else if (e.type === 'dir') tap = e
      else if (e.type === 'pause') sidePause = true
      else if (e.type === 'reset') sideReset = true
      else {
        const n = Math.round(e.level * 8)
        this.toast = { text: 'LIGHT ' + '#'.repeat(n) + '_'.repeat(8 - n), t: 1.1 }
      }
    }
    if (!s.power) return
    const input = this.readInput(pressed, tap)

    // Cartridge slot → which game should be running
    const wanted = s.activeCart ? CART_GAME[s.activeCart] : null
    if (wanted !== this.current) {
      this.cut()
      this.current = wanted
      this.paused = false
      this.phase = wanted ? 'loading' : 'title'
      this.phaseT = 0
      if (wanted) this.games[wanted].reset()
    }

    const game = this.current ? this.games[this.current] : null
    if (this.phase === 'loading' && this.phaseT > LOAD_TIME) {
      this.cut()
      this.phase = 'game'
      this.phaseT = 0
    } else if (this.phase === 'game' && game) {
      if (sideReset) {
        this.cut()
        game.reset()
        this.paused = false
      }
      const key = game.pauseButton
      const wantsPause = sidePause || (key !== null && pressed[key] && (this.paused || !game.idle))
      if (wantsPause && (this.paused || !game.idle)) {
        this.paused = !this.paused
        if (key) pressed[key] = false // the press was spent on pausing
      }
      if (!this.paused) game.update(dt, input)
    } else if (this.phase === 'title') {
      if (sideReset) this.title.reset()
      this.title.update(dt, input)
    }

    this.toast.t = Math.max(0, this.toast.t - dt)
    this.flash = Math.max(0, this.flash - dt * 4)
    this.dissolve = Math.max(0, this.dissolve - dt / DISSOLVE_TIME)
    this.draw(game, Object.values(s.carts).some(Boolean))
  }

  private draw(game: MiniGame | null, anyCart: boolean) {
    const { ctx } = this

    if (this.phase === 'title') {
      if (anyCart) this.title.draw(ctx)
      else this.drawNoCart()
    } else if (game && this.phase === 'loading') this.drawLoading(game)
    else if (game) {
      game.draw(ctx)
      if (this.paused) {
        ctx.fillStyle = 'rgba(8,10,24,0.6)'
        ctx.fillRect(0, 0, GW, GH)
        if (blink(this.t, 2)) centerText(ctx, 'PAUSE', 50, '#ffffff', 2)
      }
      // Quiet reminder of the way back, whenever play isn't in progress
      if (this.paused || game.idle || this.phaseT < 4) {
        const msg = 'EJECT CART - MENU'
        const w = textWidth(msg)
        ctx.fillStyle = 'rgba(8,10,24,0.7)'
        ctx.fillRect(GW - w - 8, GH - 11, w + 8, 11)
        drawText(ctx, msg, GW - w - 4, GH - 9, '#aeb4c8')
      }
    }

    const { text, t } = this.toast
    if (text && t > 0) {
      const w = textWidth(text)
      const x = Math.floor((GW - w) / 2)
      ctx.fillStyle = '#10131c'
      ctx.fillRect(x - 5, 16, w + 10, 13)
      ctx.fillStyle = '#ffe36e'
      ctx.fillRect(x - 5, 16, w + 10, 1)
      drawText(ctx, text, x, 20, '#ffffff')
    }

    // Pixel dissolve from the previous screen
    if (this.dissolve > 0) {
      for (let by = 0; by < GH; by += BLOCK)
        for (let bx = 0; bx < GW; bx += BLOCK) {
          const h = (Math.sin(bx * 12.9898 + by * 78.233) * 43758.5453) % 1
          if (Math.abs(h) < this.dissolve) ctx.drawImage(this.snapshot, bx, by, BLOCK, BLOCK, bx, by, BLOCK, BLOCK)
        }
    }
    // Brief CRT flicker on every cut
    if (this.flash > 0) {
      ctx.globalAlpha = this.flash * 0.6
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, GW, GH)
      ctx.globalAlpha = 1
    }
  }

  private drawLoading(game: MiniGame) {
    const { ctx } = this
    const p = clamp(this.phaseT / (LOAD_TIME - 0.15), 0, 1)
    ctx.fillStyle = '#0b0d16'
    ctx.fillRect(0, 0, GW, GH)

    // Cartridge icon in the game's colour
    const cx = GW / 2 - 13
    ctx.fillStyle = game.color
    ctx.fillRect(cx, 22, 26, 22)
    ctx.fillRect(cx + 3, 44, 20, 4)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillRect(cx + 4, 26, 18, 9)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    for (let i = 0; i < 4; i++) ctx.fillRect(cx + 5 + i * 5, 45, 3, 3)

    centerText(ctx, game.title, 58, '#ffffff', 2)
    centerText(ctx, 'LOADING', 82, '#8a8fb0')
    const cells = 12
    const bx = GW / 2 - (cells * 6) / 2
    for (let i = 0; i < cells; i++) {
      ctx.fillStyle = i < Math.round(p * cells) ? game.color : '#262b3d'
      ctx.fillRect(bx + i * 6, 95, 5, 5)
    }
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
    if (blink(this.t, 2)) centerText(ctx, 'NO CART', 48, '#ffffff', 2)
    centerText(ctx, 'INSERT GAME', 72, '#ffc233')
  }
}
