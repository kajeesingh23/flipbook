import { useMemo } from 'react'
import { BASE_HEIGHT } from './config'
import { latheY } from './geometry'
import { materials } from './materials'
import { BoltRing, Cyl } from './primitives'

/** Fixed mounting base: floor plinth, stepped riser and the bearing pedestal. */
export function RobotBase() {
  const plinth = useMemo(
    () =>
      latheY([
        [0, 0],
        [0.3, 0],
        [0.3, 0.034],
        [0.288, 0.046],
        [0.205, 0.046],
        [0.205, 0.05],
      ]),
    [],
  )
  const riser = useMemo(
    () =>
      latheY([
        [0, 0.046],
        [0.2, 0.046],
        [0.2, 0.082],
        [0.19, 0.092],
        [0.168, 0.092],
        [0.168, BASE_HEIGHT - 0.012],
        [0.16, BASE_HEIGHT - 0.004],
        [0, BASE_HEIGHT - 0.004],
      ]),
    [],
  )
  return (
    <group>
      <mesh geometry={plinth} material={materials.graphite} castShadow receiveShadow />
      <mesh geometry={riser} material={materials.graphite} castShadow receiveShadow />
      {/* machined seam under the pedestal */}
      <Cyl radius={0.171} length={0.004} material={materials.steel} position={[0, 0.1, 0]} />
      {/* bearing race between the fixed base and the turret */}
      <Cyl radius={0.15} length={0.004} material={materials.charcoal} position={[0, BASE_HEIGHT - 0.002, 0]} />
      {/* floor anchor bolts */}
      <BoltRing count={8} radius={0.248} size={0.011} height={0.006} position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      {/* connector port */}
      <Cyl axis="z" radius={0.008} length={0.004} material={materials.charcoal} position={[0.05, 0.068, 0.2]} />
    </group>
  )
}
