import { useMemo } from 'react'
import { BASE_HEIGHT, HOUSING_HALF_WIDTH, SHOULDER } from './config'
import { extrudeCentered, linkShape } from './geometry'
import { materials } from './materials'
import { Cyl, JointCap } from './primitives'

/** Lower drive housing, in turret coordinates (origin on the base axis, top of the base). */
const LOWER = { x: 0.045, y: 0.175, radius: 0.125 }
const SHOULDER_RADIUS = 0.14

/**
 * Rotating turret: collar, lower drive housing and the shoulder housing that
 * carries the upper arm. Everything here turns with the base yaw joint.
 */
export function ShoulderJoint() {
  const sx = SHOULDER.r
  const sy = SHOULDER.y - BASE_HEIGHT
  const body = useMemo(() => {
    const dx = sx - LOWER.x
    const dy = sy - LOWER.y
    const geo = extrudeCentered(linkShape(LOWER.radius, SHOULDER_RADIUS, Math.hypot(dx, dy)), HOUSING_HALF_WIDTH * 2, 0.01)
    geo.rotateZ(Math.atan2(dy, dx))
    geo.translate(LOWER.x, LOWER.y, 0)
    return geo
  }, [sx, sy])

  return (
    <group>
      {/* rotating collar on the bearing */}
      <Cyl radius={0.148} length={0.03} material={materials.graphite} position={[0, 0.015, 0]} />
      <Cyl radius={0.128} length={0.012} material={materials.polished} position={[0, 0.036, 0]} />
      <Cyl radius={0.078} length={0.09} material={materials.silver} position={[0, 0.08, 0]} />

      <mesh geometry={body} material={materials.silver} castShadow receiveShadow />

      <group position={[LOWER.x, LOWER.y, 0]}>
        <JointCap radius={LOWER.radius * 0.8} side={1} offset={HOUSING_HALF_WIDTH} center="dark" bolts={8} />
        <JointCap radius={LOWER.radius * 0.8} side={-1} offset={HOUSING_HALF_WIDTH} center="dark" bolts={8} />
      </group>
      <group position={[sx, sy, 0]}>
        <JointCap radius={SHOULDER_RADIUS * 0.86} side={1} offset={HOUSING_HALF_WIDTH} center="dark" bolts={12} />
      </group>
    </group>
  )
}
