import { animated, useSpring } from '@react-spring/three'
import { useMemo, useRef } from 'react'
import { Vector2, Vector3 } from 'three'
import type { Group } from 'three'
import { FRONT_Z, JOYSTICK } from '../dimensions'
import { capProfile, latheZ } from '../geometry'
import { hover, LocalDrag } from '../interaction'
import { mat } from '../materials'
import { blip } from '../sfx'
import { axes } from '../store'
import { smiley } from '../textures'

const MAX_TILT = 0.24
/** Drag distance (scene units) for full deflection */
const RANGE = 0.22
const delta = new Vector3()

/**
 * Oversized arcade stick. The whole head pivots on a ball joint at the panel
 * surface, the cap slides a little inside its ring, and everything springs
 * back to centre on release. Deflection is clamped to a unit circle.
 */
export function Joystick() {
  const R = JOYSTICK.r
  const root = useRef<Group>(null!)
  const drag = useMemo(() => new LocalDrag(), [])
  const face = useMemo(() => smiley(), [])

  const geo = useMemo(() => {
    const base = latheZ(capProfile(R, 0.34, 0.05))
    // White collar: a ring with a rounded outer shoulder
    const ring = latheZ([
      new Vector2(R * 0.74, 0),
      new Vector2(R * 0.93, 0),
      ...capProfile(R * 0.93, 0.07, 0.035).slice(1, -1),
      new Vector2(R * 0.74, 0.07),
    ])
    const well = latheZ([new Vector2(0, 0.02), new Vector2(R * 0.75, 0.02)])
    const cap = latheZ(capProfile(R * 0.66, 0.1, 0.035, 0.012))
    return { base, ring, well, cap }
  }, [R])

  const [{ x, y }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    onChange: ({ value }) => {
      axes.joyX = Math.max(-1, Math.min(1, value.x))
      axes.joyY = Math.max(-1, Math.min(1, value.y))
    },
  }))

  return (
    <group ref={root} position={[JOYSTICK.x, JOYSTICK.y, FRONT_Z]}>
      {/* Seat + ball joint that keeps the stick visually attached at any tilt */}
      <mesh position-z={0.001}>
        <circleGeometry args={[R + 0.04, 64]} />
        <meshStandardMaterial color="#cdc2bb" roughness={0.7} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <mesh material={mat.rubber} scale={[1, 1, 0.35]}>
        <sphereGeometry args={[R * 0.97, 40, 20]} />
      </mesh>

      <animated.group
        rotation-x={y.to((v) => -v * MAX_TILT)}
        rotation-y={x.to((v) => v * MAX_TILT)}
        rotation-z={x.to((v) => -v * 0.1)}
        {...hover('grab')}
        onPointerDown={(e) => {
          drag.begin(e, root.current)
          document.body.style.cursor = 'grabbing'
          blip(200, 0.02, 'triangle')
        }}
        onPointerMove={(e) => {
          const d = drag.delta(e, root.current, delta)
          if (!d) return
          let dx = d.x / RANGE
          let dy = d.y / RANGE
          const len = Math.hypot(dx, dy)
          if (len > 1) {
            dx /= len
            dy /= len
          }
          api.start({ x: dx, y: dy, config: { tension: 700, friction: 34 } })
        }}
        onPointerUp={(e) => {
          drag.end(e)
          document.body.style.cursor = ''
          api.start({ x: 0, y: 0, config: { tension: 420, friction: 11, mass: 0.7 } })
        }}
        onPointerCancel={(e) => {
          drag.end(e)
          api.start({ x: 0, y: 0 })
        }}
      >
        <mesh geometry={geo.base} material={mat.joyBase} position-z={0.02} castShadow receiveShadow />
        <mesh geometry={geo.ring} material={mat.white} position-z={0.355} castShadow />
        <mesh geometry={geo.well} material={mat.rubber} position-z={0.365} />
        {/* Cap slides slightly within the ring for extra travel */}
        <animated.group position-x={x.to((v) => v * 0.035)} position-y={y.to((v) => v * 0.035)} position-z={0.375}>
          <mesh geometry={geo.cap} material={mat.joyCap} castShadow />
          <mesh position-z={0.113}>
            <circleGeometry args={[R * 0.5, 48]} />
            <meshStandardMaterial map={face} transparent roughness={0.3} depthWrite={false} />
          </mesh>
        </animated.group>
      </animated.group>
    </group>
  )
}
