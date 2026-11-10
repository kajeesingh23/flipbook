import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils } from 'three'
import type { PerspectiveCamera } from 'three'
import { axes } from './store'

export const FOV = 24
/** Half-extents the framing must contain: body plus cartridges and plug. */
const FIT = { halfW: 2.3, halfH: 3.0 }
const TARGET_Y = -0.12

/**
 * Keeps the console framed at any aspect ratio and adds a gentle
 * cursor-driven parallax (suspended while a control is being dragged).
 */
export function CameraController({ parallax = true }: { parallax?: boolean }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const offset = useRef({ x: 0, y: 0 })

  useFrame((state, dt) => {
    const aspect = size.width / size.height
    const t = Math.tan(MathUtils.degToRad(FOV / 2))
    const dist = Math.max(FIT.halfH / t, FIT.halfW / (t * aspect))

    const o = offset.current
    const tx = parallax && !axes.dragging ? state.pointer.x * 0.7 : o.x
    const ty = parallax && !axes.dragging ? state.pointer.y * 0.45 : o.y
    const k = Math.min(1, dt * 2.5)
    o.x += (tx - o.x) * k
    o.y += (ty - o.y) * k

    camera.position.set(o.x, TARGET_Y + o.y, dist)
    camera.lookAt(0, TARGET_Y, 0)
  })

  return null
}
