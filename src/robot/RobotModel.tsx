import { useRef } from 'react'
import type { Group } from 'three'
import { BASE_HEIGHT, FOREARM_LENGTH, SHOULDER, UPPER_ARM_LENGTH, WRIST_OFFSET } from './config'
import { ElbowJoint } from './ElbowJoint'
import { EndEffector } from './EndEffector'
import { Forearm } from './Forearm'
import { InverseKinematicsController } from './InverseKinematicsController'
import { RobotBase } from './RobotBase'
import { ShoulderJoint } from './ShoulderJoint'
import { TabletDisplay } from './TabletDisplay'
import { UpperArm } from './UpperArm'
import { WristJoint } from './WristJoint'

/**
 * Articulated robot. Each joint is its own group whose origin lies on the
 * joint axis, so the controller only ever writes one rotation per joint:
 *
 *   Base (fixed)
 *   └─ yaw          rotation.y
 *      └─ shoulder  rotation.z
 *         └─ elbow  rotation.z
 *            └─ wristPitch  rotation.z
 *               └─ wristYaw rotation.y
 *                  └─ EndEffector → gripper → tablet
 *
 * The arm is modelled in its own plane (reach along +X, joint axes along Z);
 * the fixed -90° wrapper turns that plane so yaw 0 faces world +Z.
 */
export function RobotModel() {
  const yaw = useRef<Group>(null)
  const shoulder = useRef<Group>(null)
  const elbow = useRef<Group>(null)
  const wristPitch = useRef<Group>(null)
  const wristYaw = useRef<Group>(null)
  const tablet = useRef<Group>(null)

  return (
    <group>
      <RobotBase />
      <group position={[0, BASE_HEIGHT, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <group ref={yaw}>
          <ShoulderJoint />
          <group ref={shoulder} position={[SHOULDER.r, SHOULDER.y - BASE_HEIGHT, 0]}>
            <UpperArm />
            <group ref={elbow} position={[UPPER_ARM_LENGTH, 0, 0]}>
              <ElbowJoint />
              <Forearm />
              <group ref={wristPitch} position={[FOREARM_LENGTH, 0, 0]}>
                <WristJoint />
                <group ref={wristYaw} position={[WRIST_OFFSET, 0, 0]}>
                  <EndEffector>
                    <group ref={tablet}>
                      <TabletDisplay />
                    </group>
                  </EndEffector>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
      <InverseKinematicsController joints={{ yaw, shoulder, elbow, wristPitch, wristYaw }} tablet={tablet} />
    </group>
  )
}
