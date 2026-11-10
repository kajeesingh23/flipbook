import { useMemo } from 'react'
import { FRONT_Z, HOUSING_H, HOUSING_Z, SCREWS } from '../dimensions'
import { capProfile, latheZ } from '../geometry'
import { mat } from '../materials'

/** One countersunk Phillips screw sitting on a surface that faces local +Z. */
export function Screw({ x, y, angle = 0 }: { x: number; y: number; angle?: number }) {
  const head = useMemo(() => latheZ(capProfile(0.05, 0.016, 0.012), 28), [])
  return (
    <group position={[x, y, 0]} rotation-z={angle}>
      <mesh position-z={0.001}>
        <circleGeometry args={[0.068, 32]} />
        <meshStandardMaterial color="#b9aea8" roughness={0.8} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <mesh geometry={head} material={mat.metal} />
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} position-z={0.0165} rotation-z={r} material={mat.slot}>
          <boxGeometry args={[0.06, 0.013, 0.002]} />
        </mesh>
      ))}
    </group>
  )
}

/** Screws at the corners of the front panel. */
export function ScrewDetails() {
  return (
    <group position-z={FRONT_Z}>
      {SCREWS.map(([x, y], i) => (
        <Screw key={i} x={x} y={y} angle={i * 1.1 + 0.4} />
      ))}
    </group>
  )
}

/** Small steel lanyard loop on the top edge. */
export function LanyardLoop() {
  return (
    <group position={[0.72, HOUSING_H / 2, HOUSING_Z]}>
      <mesh material={mat.metalDark} position-y={0.02}>
        <cylinderGeometry args={[0.05, 0.06, 0.05, 20]} />
      </mesh>
      <mesh material={mat.metal} position-y={0.13} rotation-z={Math.PI / 2} castShadow>
        <torusGeometry args={[0.105, 0.014, 10, 3]} />
      </mesh>
    </group>
  )
}
