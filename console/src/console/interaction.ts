import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { Plane, Vector3 } from 'three'
import type { Object3D } from 'three'
import { axes } from './store'

/**
 * Set by any control that takes a pointer-down. The rotation controller
 * checks it so pressing a button or dragging the stick never spins the body.
 */
export const pointerClaim = { claimed: false }

const normal = new Vector3()
const hit = new Vector3()

/**
 * Tracks a pointer drag in the local space of `space`, on the plane through
 * the initial hit point that faces along the object's local +Z.
 */
export class LocalDrag {
  private plane = new Plane()
  private start = new Vector3()
  active = false
  /** Largest distance travelled, to tell a click from a drag */
  travelled = 0

  begin(e: ThreeEvent<PointerEvent>, space: Object3D) {
    normal.set(0, 0, 1).transformDirection(space.matrixWorld)
    this.plane.setFromNormalAndCoplanarPoint(normal, e.point)
    this.start.copy(space.worldToLocal(hit.copy(e.point)))
    this.active = true
    this.travelled = 0
    axes.dragging = true
    capture(e)
  }

  /** Local-space offset from where the drag began, or null if not dragging. */
  delta(e: ThreeEvent<PointerEvent>, space: Object3D, out: Vector3) {
    if (!this.active || !e.ray.intersectPlane(this.plane, hit)) return null
    out.copy(space.worldToLocal(hit)).sub(this.start)
    this.travelled = Math.max(this.travelled, out.length())
    return out
  }

  end(e: ThreeEvent<PointerEvent>) {
    this.active = false
    axes.dragging = false
    release(e)
  }
}

/** Claim a pointer-down for a control without capturing it (simple clicks). */
export function claim(e: ThreeEvent<PointerEvent>) {
  e.stopPropagation()
  pointerClaim.claimed = true
}

export function capture(e: ThreeEvent<PointerEvent>) {
  claim(e)
  ;(e.target as Element).setPointerCapture(e.pointerId)
}

export function release(e: ThreeEvent<PointerEvent>) {
  const el = e.target as Element
  if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId)
}

/** Cursor affordance for interactive parts. */
export const hover = (cursor: string) => ({
  onPointerOver: (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!axes.dragging) document.body.style.cursor = cursor
  },
  onPointerOut: () => {
    if (!axes.dragging) document.body.style.cursor = ''
  },
})

/**
 * The shell itself: it occludes the controls behind it, and because it does
 * not claim the pointer, a drag that starts here rotates the console.
 */
export const solid = {
  onPointerDown: (e: ThreeEvent<PointerEvent>) => e.stopPropagation(),
  onPointerOver: (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!axes.dragging) document.body.style.cursor = 'grab'
  },
  onPointerOut: () => {
    if (!axes.dragging) document.body.style.cursor = ''
  },
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}
