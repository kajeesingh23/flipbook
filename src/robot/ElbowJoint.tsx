import { HOUSING_HALF_WIDTH } from './config'
import { materials } from './materials'
import { Cyl, JointCap } from './primitives'

export const ELBOW_RADIUS = 0.112

/** Elbow drive housing. Origin on the elbow axis; turns with the forearm. */
export function ElbowJoint() {
  return (
    <group>
      <Cyl axis="z" radius={ELBOW_RADIUS} length={HOUSING_HALF_WIDTH * 2} material={materials.silver} />
      {/* seam against the upper arm */}
      <Cyl axis="z" radius={ELBOW_RADIUS * 0.94} length={0.004} material={materials.charcoal} position={[0, 0, -HOUSING_HALF_WIDTH]} />
      <JointCap radius={ELBOW_RADIUS * 0.86} side={1} offset={HOUSING_HALF_WIDTH} center="light" bolts={10} />
    </group>
  )
}
