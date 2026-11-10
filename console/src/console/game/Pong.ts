import { drawText, textWidth } from './font'
import { GH, GW } from './types'
import type { Ctx, GameInput, MiniGame } from './types'
import { blink, centerText, panel } from './ui'

const TOP = 18
const BOTTOM = GH - 3
const PADDLE_H = 22
const PADDLE_W = 4
const BALL = 4
const PLAYER_X = 8
const AI_X = GW - 8 - PADDLE_W
const WIN = 5
const MID = (TOP + BOTTOM) / 2

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

/** Two-paddle Pong against a beatable AI. First to five. */
export class Pong implements MiniGame {
  readonly title = 'PONG'
  readonly color = '#F4BB2F'
  readonly pauseButton = 'c' as const

  private state: 'serve' | 'playing' | 'over' = 'serve'
  private py = MID
  private ay = MID
  private bx = GW / 2
  private by = MID
  private vx = 0
  private vy = 0
  private speed = 0
  private serveDir = 1
  private serveT = 0
  private scoreP = 0
  private scoreA = 0
  private aiErr = 0
  private t = 0

  constructor() {
    this.reset()
  }

  get idle() {
    return this.state === 'over'
  }

  reset() {
    this.scoreP = this.scoreA = 0
    this.py = this.ay = MID
    this.serve(1)
  }

  private serve(dir: number) {
    this.bx = GW / 2
    this.by = MID
    this.vx = this.vy = 0
    this.serveDir = dir
    this.serveT = 0.9
    this.state = 'serve'
  }

  private bounce(paddleY: number, dir: number) {
    const off = clamp((this.by - paddleY) / (PADDLE_H / 2 + BALL / 2), -1, 1)
    this.speed = Math.min(this.speed + 8, 205)
    const angle = off * 0.95
    this.vx = Math.cos(angle) * this.speed * dir
    this.vy = Math.sin(angle) * this.speed
  }

  update(dt: number, input: GameInput) {
    this.t += dt
    if (this.state === 'over') {
      if (input.pressed.b || input.pressed.c) this.reset()
      return
    }

    // Player paddle: analog stick, D-pad or keys. Blue held = fast paddle.
    const lim = [TOP + PADDLE_H / 2 + 1, BOTTOM - PADDLE_H / 2 - 1] as const
    this.py = clamp(this.py - input.y * (input.held.a ? 185 : 130) * dt, lim[0], lim[1])

    if (this.state === 'serve') {
      this.serveT -= dt
      if (this.serveT <= 0 || input.pressed.b) {
        const a = (Math.random() - 0.5) * 0.7
        this.speed = 96
        this.vx = Math.cos(a) * this.speed * this.serveDir
        this.vy = Math.sin(a) * this.speed
        this.state = 'playing'
      }
      return
    }

    // AI tracks the ball with a capped speed and a little aiming error.
    const target = this.vx > 0 ? this.by + this.aiErr : MID
    const aiSpeed = (72 + this.scoreP * 7) * dt
    this.ay = clamp(this.ay + clamp(target - this.ay, -aiSpeed, aiSpeed), lim[0], lim[1])

    this.bx += this.vx * dt
    this.by += this.vy * dt

    if (this.by < TOP + BALL / 2 + 1) {
      this.by = TOP + BALL / 2 + 1
      this.vy = Math.abs(this.vy)
    } else if (this.by > BOTTOM - BALL / 2 - 1) {
      this.by = BOTTOM - BALL / 2 - 1
      this.vy = -Math.abs(this.vy)
    }

    const reach = PADDLE_H / 2 + BALL / 2
    const pFace = PLAYER_X + PADDLE_W + BALL / 2
    if (this.vx < 0 && this.bx <= pFace && this.bx >= PLAYER_X - 2 && Math.abs(this.by - this.py) <= reach) {
      this.bx = pFace
      this.bounce(this.py, 1)
      this.aiErr = (Math.random() - 0.5) * 30
    }
    const aFace = AI_X - BALL / 2
    if (this.vx > 0 && this.bx >= aFace && this.bx <= AI_X + PADDLE_W + 2 && Math.abs(this.by - this.ay) <= reach) {
      this.bx = aFace
      this.bounce(this.ay, -1)
    }

    if (this.bx < -8) this.point(false)
    else if (this.bx > GW + 8) this.point(true)
  }

  private point(player: boolean) {
    if (player) this.scoreP++
    else this.scoreA++
    if (this.scoreP >= WIN || this.scoreA >= WIN) this.state = 'over'
    else this.serve(player ? -1 : 1)
  }

  draw(ctx: Ctx) {
    const ink = '#ece7d6'
    ctx.fillStyle = '#0c1022'
    ctx.fillRect(0, 0, GW, GH)

    // Walls and dashed centre line
    ctx.fillStyle = ink
    ctx.fillRect(0, TOP - 1, GW, 1)
    ctx.fillRect(0, BOTTOM, GW, 1)
    for (let y = TOP + 3; y < BOTTOM - 2; y += 8) ctx.fillRect(GW / 2 - 1, y, 2, 4)

    // Scores
    const sp = String(this.scoreP)
    drawText(ctx, sp, GW / 2 - 14 - textWidth(sp, 2), 2, '#F4BB2F', 2)
    drawText(ctx, String(this.scoreA), GW / 2 + 14, 2, ink, 2)
    drawText(ctx, 'YOU', 5, 5, '#8a8fb0')
    drawText(ctx, 'CPU', GW - 5 - textWidth('CPU'), 5, '#8a8fb0')

    // Paddles and ball
    ctx.fillStyle = '#F4BB2F'
    ctx.fillRect(PLAYER_X, Math.round(this.py - PADDLE_H / 2), PADDLE_W, PADDLE_H)
    ctx.fillStyle = ink
    ctx.fillRect(AI_X, Math.round(this.ay - PADDLE_H / 2), PADDLE_W, PADDLE_H)
    if (this.state !== 'serve' || blink(this.t, 6))
      ctx.fillRect(Math.round(this.bx - BALL / 2), Math.round(this.by - BALL / 2), BALL, BALL)

    if (this.state === 'serve' && this.scoreP + this.scoreA === 0) centerText(ctx, 'FIRST TO ' + WIN, 100, '#8a8fb0')
    if (this.state === 'over') {
      const won = this.scoreP > this.scoreA
      panel(
        ctx,
        [
          { text: won ? 'YOU WIN!' : 'YOU LOSE', scale: 2, color: won ? '#F4BB2F' : '#ff7a5c' },
          { text: this.scoreP + ' - ' + this.scoreA },
          { text: 'YELLOW - REMATCH', color: '#ffe36e' },
        ],
        ink,
      )
    }
  }
}
