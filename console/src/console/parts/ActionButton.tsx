import { animated, useSpring } from '@react-spring/three'
import { useMemo } from 'react'
import { BUTTONS, FRONT_Z } from '../dimensions'
import { capProfile, latheZ } from '../geometry'
import { capture, hover, release } from '../interaction'
import { buttonMaterials, mat } from '../materials'
import { useConsole } from '../store'
import type { ButtonId } from '../store'

const TRAVEL = 0.055

type Props = { id: ButtonId; x: number; color: string; wall: string }

/**
 * Mechanical push button: a fixed darker collar with a glossy cap that
 * travels down into it and springs back.
 */
export function ActionButton({ id, x, color, wall }: Props) {
  const r = BUTTONS.r
  const materials = useMemo(() => buttonMaterials(color, wall), [color, wall])
  const collar = useMemo(() => latheZ(capProfile(r, 0.075, 0.02)), [r])
  const cap = useMemo(() => latheZ(capProfile(r * 0.94, 0.16, 0.05, 0.022)), [r])
  const pressed = useConsole((s) => s.pressed[id])
  const press = useConsole((s) => s.press)

  const { z, squash } = useSpring({
    z: pressed ? -TRAVEL : 0,
    squash: pressed ? 0.94 : 1,
    config: pressed ? { tension: 900, friction: 30 } : { tension: 520, friction: 13, mass: 0.6 },
  })

  return (
    <group position={[x, BUTTONS.y, FRONT_Z]}>
      {/* Shadowed seat ring */}
      <mesh position-z={0.001}>
        <circleGeometry args={[r + 0.025, 48]} />
        <meshStandardMaterial color="#cfc4bd" roughness={0.7} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <mesh geometry={collar} material={materials.wall} castShadow receiveShadow />
      <animated.mesh
        geometry={cap}
        material={materials.cap}
        position-z={z}
        scale-z={squash}
        castShadow
        {...hover('pointer')}
        onPointerDown={(e) => {
          capture(e)
          press(id, true)
        }}
        onPointerUp={(e) => {
          release(e)
          press(id, false)
        }}
        onPointerCancel={() => press(id, false)}
      />
      <mesh position-z={-0.01} material={mat.slot}>
        <circleGeometry args={[r * 0.9, 24]} />
      </mesh>
    </group>
  )
}

export function ActionButtons() {
  return (
    <>
      {BUTTONS.items.map((b) => (
        <ActionButton key={b.id} {...b} />
      ))}
    </>
  )
}
