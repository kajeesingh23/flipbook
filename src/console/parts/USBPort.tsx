import { useMemo } from 'react'
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import { HOUSING_H, HOUSING_Z, USB_X } from '../dimensions'
import { slab } from '../geometry'
import { mat } from '../materials'

const PLUG_END = 0.6 // distance below the housing where the cable leaves the plug

/** White cable that drops from the plug and sweeps away out of frame. */
export function ChargingCable() {
  const geometry = useMemo(() => {
    const y0 = -HOUSING_H / 2 - PLUG_END + 0.06
    const curve = new CatmullRomCurve3(
      [
        [USB_X, y0, HOUSING_Z],
        [USB_X, y0 - 0.4, HOUSING_Z],
        [USB_X + 0.1, y0 - 1.05, HOUSING_Z + 0.05],
        [USB_X + 0.6, y0 - 1.7, HOUSING_Z + 0.15],
        [USB_X + 1.6, y0 - 2.1, HOUSING_Z + 0.25],
        [USB_X + 2.9, y0 - 2.05, HOUSING_Z + 0.25],
        [USB_X + 4.6, y0 - 2.6, HOUSING_Z + 0.1],
        [USB_X + 9, y0 - 5, HOUSING_Z],
      ].map((p) => new Vector3(...p)),
      false,
      'catmullrom',
      0.5,
    )
    return new TubeGeometry(curve, 200, 0.043, 14)
  }, [])
  return <mesh geometry={geometry} material={mat.cable} castShadow />
}

/** USB-C receptacle on the bottom edge with a plugged-in connector. */
export function USBPort() {
  const port = useMemo(() => slab(0.34, 0.14, 0.02, 0.07, 0.004), [])
  const tip = useMemo(() => slab(0.25, 0.085, 0.12, 0.042, 0.008), [])
  const shell = useMemo(() => slab(0.31, 0.15, 0.36, 0.06, 0.03), [])
  return (
    <>
      {/* Local +Z points straight down out of the bottom edge */}
      <group position={[USB_X, -HOUSING_H / 2, HOUSING_Z]} rotation-x={Math.PI / 2}>
        <mesh geometry={port} material={mat.slot} position-z={0.002} />
        <mesh geometry={tip} material={mat.metal} position-z={0.04} />
        <mesh geometry={shell} material={mat.white} position-z={0.27} castShadow />
        <mesh material={mat.cable} position-z={0.5} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.046, 0.075, 0.14, 20]} />
        </mesh>
      </group>
      <ChargingCable />
    </>
  )
}
