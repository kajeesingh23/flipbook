import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

/** Point the camera looks at, and the default viewing direction (front three-quarter). */
const TARGET = new THREE.Vector3(-0.28, 0.62, 0.3)
const DIRECTION = new THREE.Vector3(0.36, 0.2, 1).normalize()
/** Half-extents that must stay in frame around TARGET. */
const FRAME = { halfHeight: 0.84, halfWidth: 1.12 }

/** No one-finger camera gesture: one finger steers the arm, two orbit and zoom. */
const TOUCHES = { ONE: -1 as unknown as THREE.TOUCH, TWO: THREE.TOUCH.DOLLY_ROTATE }

function fitDistance(fov: number, aspect: number) {
  const t = Math.tan(THREE.MathUtils.degToRad(fov) / 2)
  return Math.max(FRAME.halfHeight / t, FRAME.halfWidth / (t * aspect))
}

/**
 * Orbit camera with limits. Drag orbits, scroll zooms; plain pointer movement
 * is left to the IK controller. Bumping `resetSignal` eases back to the
 * default framing, which is recomputed from the viewport aspect ratio.
 */
export function CameraController({ resetSignal }: { resetSignal: number }) {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const aspect = useThree((s) => s.size.width / s.size.height)
  const distance = useMemo(() => fitDistance(camera.fov, aspect), [camera.fov, aspect])
  const home = useMemo(() => TARGET.clone().addScaledVector(DIRECTION, distance), [distance])
  const resetting = useRef(false)

  // frame the robot on load and whenever the viewport shape changes
  useLayoutEffect(() => {
    camera.position.copy(home)
    controls.current?.target.copy(TARGET)
    controls.current?.update()
  }, [camera, home])

  useEffect(() => {
    if (resetSignal > 0) resetting.current = true
  }, [resetSignal])

  useFrame((_, dt) => {
    const c = controls.current
    if (!resetting.current || !c) return
    const k = 1 - Math.exp(-7 * Math.min(dt, 0.05))
    camera.position.lerp(home, k)
    c.target.lerp(TARGET, k)
    c.update()
    if (camera.position.distanceTo(home) < 0.004) {
      camera.position.copy(home)
      c.target.copy(TARGET)
      c.update()
      resetting.current = false
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.7}
      minDistance={distance * 0.5}
      maxDistance={distance * 1.8}
      minPolarAngle={0.85}
      maxPolarAngle={1.54}
      minAzimuthAngle={-0.8}
      maxAzimuthAngle={1.35}
      touches={TOUCHES}
      onStart={() => (resetting.current = false)}
    />
  )
}
