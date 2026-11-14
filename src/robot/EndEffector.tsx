import type { ReactNode } from 'react'
import { RoundedBox } from '@react-three/drei'
import { TABLET, TOOL_LENGTH } from './config'
import { materials } from './materials'
import { BoltRing, Cyl } from './primitives'

/** X position of the tablet's back face, measured from the wrist-yaw axis. */
const BACK = TOOL_LENGTH - TABLET.thickness / 2
const FRONT = TOOL_LENGTH + TABLET.thickness / 2
const HALF_H = TABLET.height / 2
const JAW_WIDTH = 0.2
const JAW_THICKNESS = 0.022
const LIP = 0.007

/**
 * Tool flange and parallel-jaw gripper. Origin on the wrist-yaw axis, tool
 * axis along +X. The jaws clamp the tablet's long edges; `children` (the
 * tablet) is mounted at the tool centre point so it moves rigidly with the
 * gripper.
 */
export function EndEffector({ children }: { children?: ReactNode }) {
  return (
    <group>
      {/* tool flange */}
      <Cyl axis="x" radius={0.036} length={0.03} material={materials.graphite} position={[0.062, 0, 0]} />
      <Cyl axis="x" radius={0.046} length={0.012} material={materials.polished} position={[0.078, 0, 0]} />
      <BoltRing count={6} radius={0.037} size={0.004} height={0.003} position={[0.072, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* gripper body and vertical slide rail */}
      <RoundedBox args={[0.046, 0.13, 0.11]} radius={0.008} smoothness={3} position={[0.105, 0, 0]} material={materials.graphite} castShadow />
      <RoundedBox args={[0.026, HALF_H * 2 + 0.03, 0.05]} radius={0.005} smoothness={3} position={[0.132, 0, 0]} material={materials.charcoal} castShadow />
      {/* rubber rests against the back of the tablet */}
      {[0.085, -0.085].map((y) => (
        <RoundedBox key={y} args={[BACK - 0.143, 0.05, 0.09]} radius={0.003} smoothness={2} position={[(BACK + 0.143) / 2, y, 0]} material={materials.rubber} />
      ))}

      {/* upper and lower jaws: carriage, finger bar, rubber liner and retaining lip */}
      {[1, -1].map((s) => (
        <group key={s} scale={[1, s, 1]}>
          <RoundedBox args={[0.04, 0.036, 0.07]} radius={0.005} smoothness={2} position={[0.128, HALF_H + 0.002, 0]} material={materials.graphite} castShadow />
          <RoundedBox
            args={[FRONT + LIP - 0.118, JAW_THICKNESS, JAW_WIDTH]}
            radius={0.004}
            smoothness={3}
            position={[(FRONT + LIP + 0.118) / 2, HALF_H + 0.002 + JAW_THICKNESS / 2, 0]}
            material={materials.graphite}
            castShadow
          />
          {/* liner touching the tablet edge */}
          <mesh position={[TOOL_LENGTH, HALF_H + 0.001, 0]} material={materials.rubber}>
            <boxGeometry args={[TABLET.thickness + 0.002, 0.002, JAW_WIDTH - 0.012]} />
          </mesh>
          {/* lip over the bezel */}
          <RoundedBox
            args={[LIP, 0.012, JAW_WIDTH]}
            radius={0.002}
            smoothness={2}
            position={[FRONT + LIP / 2, HALF_H - 0.002, 0]}
            material={materials.graphite}
            castShadow
          />
          {[0.07, -0.07].map((z) => (
            <mesh key={z} position={[0.15, HALF_H + 0.002 + JAW_THICKNESS, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.0045, 0.0045, 0.002]}>
              <cylinderGeometry args={[1, 1, 1, 6]} />
              <primitive object={materials.steel} attach="material" />
            </mesh>
          ))}
        </group>
      ))}

      {/* tool centre point: +Z of this group is the tool axis */}
      <group position={[TOOL_LENGTH, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {children}
      </group>
    </group>
  )
}
