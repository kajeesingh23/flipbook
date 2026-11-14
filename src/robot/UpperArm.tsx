import { useMemo } from 'react'
import { HOUSING_HALF_WIDTH, UPPER_ARM_LENGTH, UPPER_ARM_THICKNESS } from './config'
import { extrudeCentered, linkShape } from './geometry'
import { materials } from './materials'
import { JointCap } from './primitives'

const R_SHOULDER = 0.128
const R_ELBOW = 0.104
/** The link runs beside the housings, on the -Z side of the arm plane. */
const Z = -(HOUSING_HALF_WIDTH + UPPER_ARM_THICKNESS / 2)
const OUTER = HOUSING_HALF_WIDTH + UPPER_ARM_THICKNESS

/** Upper-arm link. Origin on the shoulder axis, extends along +X to the elbow axis. */
export function UpperArm() {
  const body = useMemo(
    () => extrudeCentered(linkShape(R_SHOULDER, R_ELBOW, UPPER_ARM_LENGTH), UPPER_ARM_THICKNESS, 0.012),
    [],
  )
  // recessed graphite service panel along the outer face
  const panel = useMemo(() => extrudeCentered(linkShape(0.05, 0.04, 0.2), 0.006, 0.002, 24), [])
  const groove = useMemo(() => extrudeCentered(linkShape(0.058, 0.048, 0.2), 0.003, 0.001, 24), [])
  return (
    <group>
      <mesh geometry={body} material={materials.aluminium} position={[0, 0, Z]} castShadow receiveShadow />
      <mesh geometry={groove} material={materials.charcoal} position={[0.215, 0, -OUTER]} />
      <mesh geometry={panel} material={materials.graphite} position={[0.215, 0, -OUTER - 0.002]} castShadow />
      <JointCap radius={R_SHOULDER * 0.88} side={-1} offset={OUTER} center="dark" bolts={12} />
      <group position={[UPPER_ARM_LENGTH, 0, 0]}>
        <JointCap radius={R_ELBOW * 0.88} side={-1} offset={OUTER} center="light" bolts={10} />
      </group>
    </group>
  )
}
