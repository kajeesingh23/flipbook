import { create } from 'zustand'
import { blip } from './sfx'

export type ButtonId = 'a' | 'b' | 'c'
export type CartId = 'top' | 'right' | 'bottom'
export type GameId = 'snake' | 'pong' | 'platformer'
/** Where an input came from, so the same control can be held by two sources. */
export type InputSource = 'pointer' | 'keys'

/** Each cartridge is one game: blue = Snake, yellow = Pong, coral = platformer. */
export const CART_GAME: Record<CartId, GameId> = { right: 'snake', top: 'pong', bottom: 'platformer' }

export type GameEvent =
  | { type: 'button'; id: ButtonId }
  /** A D-pad / arrow-key tap, latched so it registers even between frames */
  | { type: 'dir'; x: number; y: number }
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
  /** true while a control or the console itself is being dragged */
  dragging: false,
}

/** One-shot events consumed by the game system each frame. */
export const events: GameEvent[] = []

// Who is currently holding each control. A button only fires when its first
// holder arrives and only releases when the last one leaves, so pressing the
// 3D button while the matching key is down never double-triggers.
const holders: Record<ButtonId, Set<InputSource>> = { a: new Set(), b: new Set(), c: new Set() }
const padBySource: Record<InputSource, { x: number; y: number }> = { pointer: { x: 0, y: 0 }, keys: { x: 0, y: 0 } }

type ConsoleState = {
  pressed: Record<ButtonId, boolean>
  pad: { x: number; y: number }
  /** Which cartridges are seated in their slots */
  carts: Record<CartId, boolean>
  /** The cartridge whose game is running, or null for the title screen */
  activeCart: CartId | null
  power: boolean
  press: (id: ButtonId, down: boolean, source?: InputSource) => void
  setPad: (x: number, y: number, source?: InputSource) => void
  setCart: (id: CartId, inserted: boolean) => void
  loadCart: (id: CartId) => void
  togglePower: () => void
}

export const useConsole = create<ConsoleState>((set, get) => ({
  pressed: { a: false, b: false, c: false },
  pad: { x: 0, y: 0 },
  carts: { top: true, right: true, bottom: true },
  activeCart: null,
  power: true,
  press: (id, down, source = 'pointer') => {
    if (down) holders[id].add(source)
    else holders[id].delete(source)
    const held = holders[id].size > 0
    if (get().pressed[id] === held) return
    set((s) => ({ pressed: { ...s.pressed, [id]: held } }))
    if (held) {
      events.push({ type: 'button', id })
      blip(id === 'a' ? 520 : id === 'b' ? 660 : 390, 0.05)
    }
  },
  setPad: (x, y, source = 'pointer') => {
    padBySource[source] = { x, y }
    // Direct touch on the pad wins over the keyboard.
    const next = padBySource.pointer.x || padBySource.pointer.y ? padBySource.pointer : padBySource.keys
    const p = get().pad
    if (p.x === next.x && p.y === next.y) return
    set({ pad: { ...next } })
    if (next.x || next.y) {
      events.push({ type: 'dir', x: next.x, y: next.y })
      blip(240, 0.025, 'triangle')
    }
  },
  setCart: (id, inserted) => {
    const s = get()
    if (s.carts[id] === inserted) return
    set({
      carts: { ...s.carts, [id]: inserted },
      // Seating a cartridge boots it; pulling the running one returns to the title.
      activeCart: inserted ? id : s.activeCart === id ? null : s.activeCart,
    })
    blip(inserted ? 180 : 130, 0.07, 'triangle', 0.06)
  },
  loadCart: (id) => {
    if (!get().carts[id] || get().activeCart === id) return
    set({ activeCart: id })
    blip(180, 0.07, 'triangle', 0.06)
  },
  togglePower: () => {
    set((s) => ({ power: !s.power }))
    blip(get().power ? 300 : 110, 0.09, 'triangle', 0.06)
  },
}))
