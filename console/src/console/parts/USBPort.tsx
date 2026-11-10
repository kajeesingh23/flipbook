import { useMemo } from 'react'
import { HOUSING_H, HOUSING_Z, USB_X } from '../dimensions'
import { capProfile, latheZ, slab } from '../geometry'
import { mat } from '../materials'

/**
 * Bottom-edge details. Local +Z points straight down out of the edge:
 * an empty USB-C receptacle with its contact tongue, two case screws and a
 * microphone pinhole.
 */
export function USBPort() {
  const shroud = useMemo(() => slab(0.38, 0.17, 0.02, 0.085, 0.006), [])
  const opening = useMemo(() => slab(0.3, 0.1, 0.02, 0.05, 0.004), [])
  const tongue = useMemo(() => slab(0.2, 0.022, 0.02, 0.008, 0.003), [])
  const screw = useMemo(() => latheZ(capProfile(0.04, 0.012, 0.008), 20), [])
  return (
    <group position={[0, -HOUSING_H / 2, HOUSING_Z]} rotation-x={Math.PI / 2}>
      <group position-x={USB_X}>
        <mesh geometry={shroud} material={mat.metalDark} position-z={0.002} />
        <mesh geometry={opening} material={mat.slot} position-z={0.006} />
        <mesh geometry={tongue} material={mat.metal} position-z={0.008} />
      </group>
      {[0.95, 1.22].map((x, i) => (
        <group key={x} position-x={x} rotation-z={i * 0.9 + 0.3}>
          <mesh geometry={screw} material={mat.metal} />
          <mesh position-z={0.0125} material={mat.slot}>
            <boxGeometry args={[0.05, 0.011, 0.002]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.02, 0, 0.002]} material={mat.slot}>
        <circleGeometry args={[0.02, 16]} />
      </mesh>
    </group>
  )
}
