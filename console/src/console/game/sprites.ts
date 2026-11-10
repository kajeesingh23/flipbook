import type { Ctx } from './types'

/**
 * The hero: dark hair, green top and the red backpack from the key art.
 * (x, feetY) is the point between the feet.
 */
export function drawHero(ctx: Ctx, x: number, feetY: number, facing: number, step: number, airborne: boolean) {
  const bob = !airborne && step ? 1 : 0
  ctx.save()
  ctx.translate(Math.floor(x), Math.floor(feetY))
  ctx.scale(facing, 1)
  const R = (c: string, rx: number, ry: number, w: number, h: number) => {
    ctx.fillStyle = c
    ctx.fillRect(rx, ry, w, h)
  }
  // Legs
  if (airborne) {
    R('#2b3a55', -3, -5, 3, 4)
    R('#2b3a55', 1, -5, 3, 3)
  } else if (step) {
    R('#2b3a55', -4, -5, 3, 5)
    R('#2b3a55', 2, -5, 3, 4)
  } else {
    R('#2b3a55', -3, -5, 3, 5)
    R('#2b3a55', 1, -5, 3, 5)
  }
  R('#5a3a24', airborne ? -3 : step ? -4 : -3, -1, 3, 1)
  // Backpack
  R('#a82a1c', -7, -13 + bob, 4, 8)
  R('#e74732', -7, -13 + bob, 3, 6)
  R('#f5bd35', -6, -9 + bob, 2, 1)
  // Torso and arm
  R('#2f8a63', -3, -13 + bob, 7, 8)
  R('#3fa878', -1, -13 + bob, 4, 5)
  R('#e9b58c', 3, -11 + bob, 2, 3)
  // Head
  R('#e9b58c', -2, -19 + bob, 6, 6)
  R('#2a1a16', -3, -20 + bob, 7, 3)
  R('#2a1a16', -3, -18 + bob, 3, 4)
  R('#2a1a16', 2, -16 + bob, 1, 1)
  ctx.restore()
}

/** Gold coin centred on (x, y). */
export function drawCoin(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#b8791c'
  ctx.fillRect(x - 2, y - 3, 5, 7)
  ctx.fillRect(x - 3, y - 2, 7, 5)
  ctx.fillStyle = '#ffd23f'
  ctx.fillRect(x - 2, y - 2, 5, 5)
  ctx.fillStyle = '#fff6b0'
  ctx.fillRect(x - 1, y - 2, 2, 2)
}

/** 7×6 pixel heart with its top-left at (x, y). */
export function drawHeart(ctx: Ctx, x: number, y: number, full: boolean) {
  ctx.fillStyle = full ? '#ff4d5e' : '#3a2a3a'
  ctx.fillRect(x + 1, y, 2, 1)
  ctx.fillRect(x + 4, y, 2, 1)
  ctx.fillRect(x, y + 1, 7, 2)
  ctx.fillRect(x + 1, y + 3, 5, 1)
  ctx.fillRect(x + 2, y + 4, 3, 1)
  ctx.fillRect(x + 3, y + 5, 1, 1)
  if (full) {
    ctx.fillStyle = '#ffc2c8'
    ctx.fillRect(x + 1, y + 1, 1, 1)
  }
}
