import type { ButtonId } from '../store'

export const GW = 192
export const GH = 128

export type Ctx = CanvasRenderingContext2D

/** One frame of controller state, already merged across stick, pad and keys. */
export type GameInput = {
  /** Analog axes, -1..1, +y is up */
  x: number
  y: number
  /** Four-way digital direction (dominant axis only), +dy is up */
  dx: number
  dy: number
  /** Buttons currently held */
  held: Record<ButtonId, boolean>
  /** Buttons that went down this frame */
  pressed: Record<ButtonId, boolean>
}

/** A cartridge game. Logic lives in update(); draw() only renders state. */
export interface MiniGame {
  readonly title: string
  /** Accent colour of the cartridge this game ships on */
  readonly color: string
  /** Button that pauses this game, if any (the side button always can) */
  readonly pauseButton: ButtonId | null
  /** True whenever play is not in progress (ready, game over, cleared) */
  readonly idle: boolean
  reset(): void
  update(dt: number, input: GameInput): void
  draw(ctx: Ctx): void
}
