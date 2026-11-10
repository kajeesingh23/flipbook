import { create } from 'zustand'
import { blip } from './sfx'

export type ButtonId = 'a' | 'b' | 'c'
export type CartId = 'top' | 'right' | 'bottom'
export type GameEvent =
  | { type: 'button'; id: ButtonId }
  | { type: 'cart'; id: CartId; inserted: boolean }
  | { type: 'knob'; level: number }
  | { type: 'pause' }
  | { type: 'reset' }

/**
 * Continuous, per-frame values live outside React so dragging the stick or
 * knob never triggers a re-render.
 */
export const axes = {
  joyX: 0,
  joyY: 0,
  /** 0..1, driven by the side knob */
  brightness: 0.72,
  /** true while any control is being dragged; freezes camera parallax */
  dragging: false,
}

/** One-shot events consumed by the game each frame. */
export const events: GameEvent[] = []

type ConsoleState = {
  pressed: Record<ButtonId, boolean>
  pad: { x: number; y: number }
  carts: Record<CartId, boolean>
  power: boolean
  press: (id: ButtonId, down: boolean) => void
  setPad: (x: number, y: number) => void
  setCart: (id: CartId, inserted: boolean) => void
  togglePower: () => void
}

export const useConsole = create<ConsoleState>((set, get) => ({
  pressed: { a: false, b: false, c: false },
  pad: { x: 0, y: 0 },
  carts: { top: true, right: true, bottom: true },
  power: true,
  press: (id, down) => {
    if (get().pressed[id] === down) return
    set((s) => ({ pressed: { ...s.pressed, [id]: down } }))
    if (down) {
      events.push({ type: 'button', id })
      blip(id === 'a' ? 520 : id === 'b' ? 660 : 390, 0.05)
    }
  },
  setPad: (x, y) => {
    const p = get().pad
    if (p.x === x && p.y === y) return
    set({ pad: { x, y } })
    if (x || y) blip(240, 0.025, 'triangle')
  },
  setCart: (id, inserted) => {
    if (get().carts[id] === inserted) return
    set((s) => ({ carts: { ...s.carts, [id]: inserted } }))
    events.push({ type: 'cart', id, inserted })
    blip(inserted ? 180 : 130, 0.07, 'triangle', 0.06)
  },
  togglePower: () => {
    set((s) => ({ power: !s.power }))
    blip(get().power ? 300 : 110, 0.09, 'triangle', 0.06)
  },
}))
