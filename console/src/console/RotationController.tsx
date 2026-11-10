import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import type { RefObject } from 'react'
import type { Group } from 'three'
import { pointerClaim } from './interaction'
import { axes } from './store'

type Vec3 = [number, number, number]
type Props = { target: RefObject<Group | null>; pose: Vec3; reducedMotion: boolean }

/** Keep the device from flipping over the poles */
const PITCH_LIMIT = 1.3
const MAX_SPIN = 9 // rad/s
const FRICTION = 3.4

/**
 * Grab-and-turn control for the whole console.
 *
 * It owns the console group's rotation: user yaw/pitch with inertia, plus the
 * ambient idle float, which is faded out while the user is turning the device
 * and eased back in afterwards. A drag only starts here when no control
 * claimed the pointer-down, so buttons, stick, knob and cartridges never spin
 * the body. Double-click or double-tap empty space to return to the home pose.
 */
export function RotationController({ target, pose, reducedMotion }: Props) {
  const gl = useThree((s) => s.gl)
  const state = useMemo(
    () => ({ yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, pointer: -1, x: 0, y: 0, time: 0, ambient: 1, homing: false }),
    [],
  )

  useEffect(() => {
    const el = gl.domElement
    const clampPitch = (p: number) => Math.max(-PITCH_LIMIT - pose[0], Math.min(PITCH_LIMIT - pose[0], p))
    // Radians per pixel: roughly one full turn per 1.6 short-sides of drag.
    const sensitivity = () => Math.max(0.0045, Math.min(0.012, 4 / Math.min(el.clientWidth, el.clientHeight)))

    // Runs before any control handler sees the event.
    const resetClaim = () => (pointerClaim.claimed = false)

    // Runs after the 3D controls have had their chance to claim it.
    const down = (e: PointerEvent) => {
      if (e.target !== el || pointerClaim.claimed || state.pointer !== -1) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      Object.assign(state, { pointer: e.pointerId, x: e.clientX, y: e.clientY, time: performance.now(), vYaw: 0, vPitch: 0, homing: false })
      axes.dragging = true
      el.setPointerCapture(e.pointerId)
      document.body.style.cursor = 'grabbing'
    }

    const move = (e: PointerEvent) => {
      if (e.pointerId !== state.pointer) return
      const now = performance.now()
      const dt = Math.max(1, now - state.time) / 1000
      const k = sensitivity()
      const dYaw = (e.clientX - state.x) * k
      const dPitch = (e.clientY - state.y) * k
      state.yaw += dYaw
      state.pitch = clampPitch(state.pitch + dPitch)
      // Smoothed release velocity
      state.vYaw += (dYaw / dt - state.vYaw) * 0.45
      state.vPitch += (dPitch / dt - state.vPitch) * 0.45
      Object.assign(state, { x: e.clientX, y: e.clientY, time: now })
    }

    const up = (e: PointerEvent) => {
      if (e.pointerId !== state.pointer) return
      state.pointer = -1
      axes.dragging = false
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
      document.body.style.cursor = ''
      // A pause before letting go means "put it down", not "throw it".
      const still = performance.now() - state.time > 90
      const clamp = (v: number) => Math.max(-MAX_SPIN, Math.min(MAX_SPIN, v))
      state.vYaw = still || reducedMotion ? 0 : clamp(state.vYaw)
      state.vPitch = still || reducedMotion ? 0 : clamp(state.vPitch)
    }

    const home = (e: MouseEvent) => {
      if (e.target !== el || pointerClaim.claimed) return
      // Unwind to the nearest front-facing turn rather than spinning all the way back.
      state.yaw -= Math.round(state.yaw / (Math.PI * 2)) * Math.PI * 2
      Object.assign(state, { homing: true, vYaw: 0, vPitch: 0 })
    }

    window.addEventListener('pointerdown', resetClaim, true)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    el.addEventListener('dblclick', home)
    return () => {
      window.removeEventListener('pointerdown', resetClaim, true)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.removeEventListener('dblclick', home)
      axes.dragging = false
    }
  }, [gl, pose, reducedMotion, state])

  useFrame(({ clock }, rawDt) => {
    const g = target.current
    if (!g) return
    const dt = Math.min(rawDt, 0.05)
    const held = state.pointer !== -1

    if (!held) {
      // Inertia: coast on the release velocity and bleed it off smoothly.
      state.yaw += state.vYaw * dt
      const pitch = state.pitch + state.vPitch * dt
      state.pitch = Math.max(-PITCH_LIMIT - pose[0], Math.min(PITCH_LIMIT - pose[0], pitch))
      if (state.pitch !== pitch) state.vPitch = 0
      const decay = Math.exp(-FRICTION * dt)
      state.vYaw *= decay
      state.vPitch *= decay
      if (state.homing) {
        const k = Math.min(1, dt * 5)
        state.yaw += (0 - state.yaw) * k
        state.pitch += (0 - state.pitch) * k
        if (Math.abs(state.yaw) + Math.abs(state.pitch) < 0.002) state.homing = false
      }
    }

    // Ambient float steps aside for manual input, then eases back.
    const busy = held || Math.abs(state.vYaw) + Math.abs(state.vPitch) > 0.05
    const wanted = reducedMotion || busy ? 0 : 1
    state.ambient += (wanted - state.ambient) * Math.min(1, dt * (busy ? 8 : 1.2))
    const a = state.ambient
    const t = clock.elapsedTime

    g.position.y = Math.sin(t * 0.8) * 0.045 * a
    g.rotation.set(
      pose[0] + state.pitch + Math.sin(t * 0.6) * 0.018 * a,
      pose[1] + state.yaw + Math.sin(t * 0.45 + 1) * 0.035 * a,
      pose[2] + Math.sin(t * 0.5 + 2) * 0.008 * a,
    )
  })

  return null
}
