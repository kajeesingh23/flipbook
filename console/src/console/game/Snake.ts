import { drawText, textWidth } from './font'
import { GH, GW } from './types'
import type { Ctx, GameInput, MiniGame } from './types'
import { blink, panel } from './ui'

const CELL = 8
const COLS = GW / CELL // 24
const TOP = 16 // HUD strip
const ROWS = (GH - TOP) / CELL // 14

type P = { x: number; y: number }

/** Classic Snake on a 24×14 grid. Speeds up with every bite. */
export class Snake implements MiniGame {
  readonly title = 'SNAKE'
  readonly color = '#3F63E0'
  readonly pauseButton = 'c' as const

  private state: 'ready' | 'playing' | 'over' = 'ready'
  private body: P[] = []
  private dir: P = { x: 1, y: 0 }
  private queue: P[] = []
  private food: P = { x: 0, y: 0 }
  private score = 0
  private best = 0
  private acc = 0
  private t = 0

  constructor() {
    this.reset()
  }

  get idle() {
    return this.state !== 'playing'
  }

  reset() {
    this.body = [
      { x: 12, y: 7 },
      { x: 11, y: 7 },
      { x: 10, y: 7 },
    ]
    this.dir = { x: 1, y: 0 }
    this.queue = []
    this.score = 0
    this.acc = 0
    this.state = 'ready'
    this.placeFood()
  }

  private placeFood() {
    const free: P[] = []
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) if (!this.body.some((b) => b.x === x && b.y === y)) free.push({ x, y })
    this.food = free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
  }

  update(dt: number, input: GameInput) {
    this.t += dt
    if (this.state === 'over') {
      if (input.pressed.b || input.pressed.c) this.reset()
      return
    }

    if (input.dx || input.dy) {
      const want = { x: input.dx, y: -input.dy }
      const last = this.queue[this.queue.length - 1] ?? this.dir
      const same = want.x === last.x && want.y === last.y
      const reverse = want.x === -last.x && want.y === -last.y
      if (!same && !reverse && this.queue.length < 2) this.queue.push(want)
      if (this.state === 'ready' && !reverse) this.state = 'playing'
    }
    if (this.state !== 'playing') return

    // Blue held = turbo
    const interval = Math.max(0.07, 0.16 - this.score * 0.004) / (input.held.a ? 1.8 : 1)
    this.acc += dt
    while (this.acc >= interval && this.state === 'playing') {
      this.acc -= interval
      this.step()
    }
  }

  private step() {
    if (this.queue.length) this.dir = this.queue.shift()!
    const head = { x: this.body[0].x + this.dir.x, y: this.body[0].y + this.dir.y }
    const eating = head.x === this.food.x && head.y === this.food.y
    // The tail cell frees up this step unless we're growing.
    const solid = eating ? this.body : this.body.slice(0, -1)
    const dead =
      head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || solid.some((b) => b.x === head.x && b.y === head.y)
    if (dead) {
      this.state = 'over'
      this.best = Math.max(this.best, this.score)
      return
    }
    this.body.unshift(head)
    if (eating) {
      this.score++
      this.placeFood()
    } else this.body.pop()
  }

  draw(ctx: Ctx) {
    // Field
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#12301f' : '#153823'
        ctx.fillRect(x * CELL, TOP + y * CELL, CELL, CELL)
      }

    // HUD
    ctx.fillStyle = '#0a1a12'
    ctx.fillRect(0, 0, GW, TOP)
    ctx.fillStyle = '#7ddc4a'
    ctx.fillRect(0, TOP - 1, GW, 1)
    drawText(ctx, 'SCORE ' + String(this.score).padStart(3, '0'), 5, 4, '#c8f76a')
    const best = 'BEST ' + String(this.best).padStart(3, '0')
    drawText(ctx, best, GW - 5 - textWidth(best), 4, '#5fae6a')

    // Food
    const fx = this.food.x * CELL
    const fy = TOP + this.food.y * CELL
    const pulse = blink(this.t, 4) ? 0 : 1
    ctx.fillStyle = '#ff5a3c'
    ctx.fillRect(fx + 1 + pulse, fy + 1 + pulse, 6 - pulse * 2, 6 - pulse * 2)
    ctx.fillStyle = '#ffd23f'
    ctx.fillRect(fx + 2, fy + 2, 2, 2)
    ctx.fillStyle = '#7ddc4a'
    ctx.fillRect(fx + 4, fy, 2, 1)

    // Snake
    this.body.forEach((b, i) => {
      ctx.fillStyle = i === 0 ? '#d4fb7a' : i % 2 ? '#7ddc4a' : '#69c93f'
      ctx.fillRect(b.x * CELL + 1, TOP + b.y * CELL + 1, CELL - 1, CELL - 1)
    })
    const h = this.body[0]
    ctx.fillStyle = '#0a1a12'
    const ex = h.x * CELL + 1
    const ey = TOP + h.y * CELL + 1
    if (this.dir.x) {
      ctx.fillRect(ex + (this.dir.x > 0 ? 4 : 1), ey + 1, 2, 2)
      ctx.fillRect(ex + (this.dir.x > 0 ? 4 : 1), ey + 4, 2, 2)
    } else {
      ctx.fillRect(ex + 1, ey + (this.dir.y > 0 ? 4 : 1), 2, 2)
      ctx.fillRect(ex + 4, ey + (this.dir.y > 0 ? 4 : 1), 2, 2)
    }

    if (this.state === 'ready' && blink(this.t, 2)) {
      const msg = 'MOVE TO START'
      const w = textWidth(msg)
      ctx.fillStyle = 'rgba(8,16,12,0.8)'
      ctx.fillRect((GW - w) / 2 - 5, 86, w + 10, 13)
      drawText(ctx, msg, (GW - w) / 2, 89, '#ffffff')
    }
    if (this.state === 'over')
      panel(
        ctx,
        [
          { text: 'GAME OVER', scale: 2, color: '#ff7a5c' },
          { text: 'SCORE ' + this.score },
          { text: 'YELLOW - RETRY', color: '#ffe36e' },
        ],
        '#7ddc4a',
      )
  }
}
