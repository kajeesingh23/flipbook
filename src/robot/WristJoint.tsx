import { RoundedBox } from '@react-three/drei'
import { WRIST_OFFSET } from './config'
import { materials } from './materials'
import { BoltRing, Cyl } from './primitives'

const PITCH_RADIUS = 0.06
const PITCH_HALF_WIDTH = 0.07
const YAW_RADIUS = 0.054
const YAW_HEIGHT = 0.13

/**
 * Wrist assembly. Origin on the wrist-pitch axis. Carries the pitch housing
 * and the wrist-yaw housing, whose axis sits WRIST_OFFSET further along +X.
 */
export function WristJoint() {
  return (
    <group>
      {/* pitch housing */}
      <Cyl axis="z" radius={PITCH_RADIUS} length={PITCH_HALF_WIDTH * 2} material={materials.graphite} />
      {[1, -1].map((s) => (
        <group key={s} position={[0, 0, s * PITCH_HALF_WIDTH]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
          <Cyl axis="z" radius={PITCH_RADIUS * 0.8} length={0.006} material={materials.polished} position={[0, 0, 0.003]} />
          <Cyl axis="z" radius={PITCH_RADIUS * 0.5} length={0.004} material={materials.charcoal} position={[0, 0, 0.007]} />
          <BoltRing count={6} radius={PITCH_RADIUS * 0.65} size={0.0035} height={0.002} position={[0, 0, 0.006]} />
        </group>
      ))}
      {/* link between the two wrist axes */}
      <RoundedBox args={[WRIST_OFFSET, 0.078, 0.084]} radius={0.01} smoothness={3} position={[WRIST_OFFSET / 2, 0, 0]} material={materials.graphite} castShadow />
      {/* yaw housing */}
      <Cyl radius={YAW_RADIUS} length={YAW_HEIGHT} material={materials.graphite} position={[WRIST_OFFSET, 0, 0]} />
      {[1, -1].map((s) => (
        <Cyl key={s} radius={YAW_RADIUS * 0.78} length={0.006} material={materials.polished} position={[WRIST_OFFSET, s * (YAW_HEIGHT / 2 + 0.003), 0]} />
      ))}
    </group>
  )
}
