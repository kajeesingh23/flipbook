import { useMemo } from 'react'
import { BACK_SCREWS, BACK_T, BACK_Z, CORNER, H, W } from '../dimensions'
import { capProfile, latheZ, slab } from '../geometry'
import { solid } from '../interaction'
import { mat } from '../materials'
import { bitmapLabel, embossed } from '../textures'
import { Screw } from './ScrewDetails'

const COVER = { w: 1.86, h: 1.22, y: -0.78 }

/** Moulded bitmap marking printed on the rear shell. */
function Marking({ text, y, height = 0.062 }: { text: string; y: number; height?: number }) {
  const label = useMemo(() => bitmapLabel(text, '#8f8580'), [text])
  return (
    <mesh position={[0, y, 0.002]}>
      <planeGeometry args={[height * label.aspect, height]} />
      <meshStandardMaterial map={label.texture} transparent roughness={0.6} depthWrite={false} />
    </mesh>
  )
}

/** Removable battery door with a seam, a ribbed latch and a moulded arrow. */
function BatteryCover() {
  const seam = useMemo(() => slab(COVER.w + 0.05, COVER.h + 0.05, 0.01, 0.13, 0.002), [])
  const door = useMemo(() => slab(COVER.w, COVER.h, 0.04, 0.11, 0.016), [])
  const latch = useMemo(() => slab(0.56, 0.2, 0.02, 0.06, 0.006), [])
  const rib = useMemo(() => slab(0.42, 0.024, 0.02, 0.012, 0.006), [])
  const stroke = useMemo(() => slab(0.13, 0.034, 0.016, 0.017, 0.006), [])
  return (
    <group position-y={COVER.y}>
      <mesh geometry={seam} material={mat.seam} position-z={0.003} />
      <mesh geometry={door} material={mat.ivory} position-z={0.018} castShadow receiveShadow {...solid} />
      <group position={[0, COVER.h / 2 - 0.2, 0.038]}>
        <mesh geometry={latch} material={mat.seam} position-z={0.002} />
        {[-0.05, 0, 0.05].map((y) => (
          <mesh key={y} geometry={rib} material={mat.ivory} position={[0, y, 0.014]} />
        ))}
      </group>
      {/* Slide-to-open arrow */}
      <group position={[0, COVER.h / 2 - 0.44, 0.042]}>
        <mesh geometry={stroke} material={mat.ivory} position-x={-0.04} rotation-z={-0.62} />
        <mesh geometry={stroke} material={mat.ivory} position-x={0.04} rotation-z={0.62} />
      </group>
      <group position-z={0.038}>
        <Marking text="2 X AA   1.5V" y={-COVER.h / 2 + 0.16} height={0.055} />
      </group>
    </group>
  )
}

/**
 * Rear of the console: ivory shell, case screws, embossed brand, regulatory
 * markings, a mould seam, the battery door and four rubber feet. The group is
 * turned so local +Z points out of the back.
 */
export function BackPanel() {
  const shell = useMemo(() => slab(W, H, BACK_T, CORNER, 0.035), [])
  const brand = useMemo(() => embossed('Fast Cartridge'), [])
  const groove = useMemo(() => slab(W - 0.7, 0.016, 0.01, 0.008, 0.002), [])
  const foot = useMemo(() => latheZ(capProfile(0.12, 0.03, 0.02), 32), [])
  const grip = useMemo(() => slab(0.05, 0.5, 0.02, 0.025, 0.008), [])

  return (
    <group>
      <mesh geometry={shell} material={mat.ivory} position-z={BACK_Z + BACK_T / 2} castShadow receiveShadow {...solid} />
      <group position-z={BACK_Z} rotation-y={Math.PI}>
        {BACK_SCREWS.map(([x, y], i) => (
          <Screw key={i} x={x} y={y} angle={i * 0.8 + 0.2} />
        ))}

        {/* Brand and technical markings */}
        <mesh position={[0, 1.3, 0.002]}>
          <planeGeometry args={[1.5, 0.28]} />
          <meshStandardMaterial map={brand} transparent roughness={0.5} depthWrite={false} />
        </mesh>
        <Marking text="MODEL FC-01" y={1.0} />
        <Marking text="DC 5V 1.5A   USB-C" y={0.88} height={0.05} />

        {/* Mould seam between the upper shell and the battery section */}
        <mesh geometry={groove} material={mat.seam} position={[0, 0.02, 0.002]} />

        {/* Ribbed finger grips either side */}
        {[-1, 1].map((side) =>
          [0, 1, 2].map((i) => (
            <mesh key={`${side}${i}`} geometry={grip} material={mat.ivory} position={[side * (1.02 + i * 0.1), 0.72, 0.006]} />
          )),
        )}

        <BatteryCover />

        {/* Rubber feet */}
        {[
          [-0.95, 1.62],
          [0.95, 1.62],
          [-0.95, -1.66],
          [0.95, -1.66],
        ].map(([x, y]) => (
          <mesh key={`${x}${y}`} geometry={foot} material={mat.foot} position={[x, y, 0]} castShadow />
        ))}
      </group>
    </group>
  )
}
