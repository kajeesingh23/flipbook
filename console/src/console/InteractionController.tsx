import { useEffect } from 'react'
import { useConsole } from './store'
import type { ButtonId } from './store'

const BUTTON_KEYS: Record<string, ButtonId> = { z: 'a', x: 'b', c: 'c', j: 'a', k: 'b', l: 'c', ' ': 'a' }
const DIR_KEYS: Record<string, [number, number]> = {
  arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, 1], arrowdown: [0, -1],
  a: [-1, 0], d: [1, 0], w: [0, 1], s: [0, -1],
}

/**
 * Keyboard bridge: arrows / WASD rock the D-pad and Z X C (or J K L) press
 * the action buttons, driving the same store the pointer interactions use so
 * the physical controls animate either way.
 */
export function InteractionController() {
  useEffect(() => {
    const held = new Set<string>()
    const syncPad = () => {
      let x = 0
      let y = 0
      for (const k of held) {
        const d = DIR_KEYS[k]
        if (d) {
          x += d[0]
          y += d[1]
        }
      }
      // The pad is a four-way rocker: horizontal wins on a diagonal.
      useConsole.getState().setPad(Math.sign(x), x ? 0 : Math.sign(y))
    }
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const down = e.type === 'keydown'
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (key in DIR_KEYS) {
        e.preventDefault()
        if (down) held.add(key)
        else held.delete(key)
        syncPad()
      } else if (key in BUTTON_KEYS) {
        e.preventDefault()
        useConsole.getState().press(BUTTON_KEYS[key], down)
      }
    }
    const onBlur = () => {
      held.clear()
      syncPad()
      const s = useConsole.getState()
      ;(['a', 'b', 'c'] as const).forEach((id) => s.press(id, false))
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
  return null
}
