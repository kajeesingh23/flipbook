import { animated, useSpring } from '@react-spring/three'
import { useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import type { Group } from 'three'
import { DPAD, FRONT_Z } from '../dimensions'
import { slab } from '../geometry'
import { capture, hover, release } from '../interaction'
import { mat } from '../materials'
import { useConsole } from '../store'

const local = new Vector3()

/** Soft-blue four-way pad that rocks toward the pressed direction. */
export function DirectionalPad() {
  const arm = useMemo(() => slab(0.5, 0.215, 0.11, 0.1075, 0.035), [])
  const root = useRef<Group>(null!)
  const pad = useConsole((s) => s.pad)
  const setPad = useConsole((s) => s.setPad)

  const { rx, ry, z } = useSpring({
    rx: -pad.y * 0.17,
    ry: pad.x * 0.17,
    z: pad.x || pad.y ? -0.012 : 0,
    config: { tension: 600, friction: 18, mass: 0.5 },
  })

  return (
    <group ref={root} position={[DPAD.x, DPAD.y, FRONT_Z]}>
      <mesh position-z={0.001}>
        <circleGeometry args={[0.2, 40]} />
        <meshStandardMaterial color="#d6ccc5" roughness={0.7} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <animated.group
        rotation-x={rx}
        rotation-y={ry}
        position-z={z}
        {...hover('pointer')}
        onPointerDown={(e) => {
          capture(e)
          root.current.worldToLocal(local.copy(e.point))
          if (Math.abs(local.x) > Math.abs(local.y)) setPad(Math.sign(local.x), 0)
          else setPad(0, Math.sign(local.y))
        }}
        onPointerUp={(e) => {
          release(e)
          setPad(0, 0)
        }}
        onPointerCancel={() => setPad(0, 0)}
      >
        <mesh geometry={arm} material={mat.dpad} position-z={0.05} castShadow receiveShadow />
        <mesh geometry={arm} material={mat.dpad} position-z={0.05} rotation-z={Math.PI / 2} castShadow receiveShadow />
      </animated.group>
    </group>
  )
}
