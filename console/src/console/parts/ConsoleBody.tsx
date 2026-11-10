import { useMemo } from 'react'
import { Path } from 'three'
import {
  BRAND, CORNER, FRONT_Z, H, HOUSING_D, HOUSING_H, HOUSING_W, HOUSING_Z, LED, PLATE_T, PLAY, SCREEN, W,
} from '../dimensions'
import { roundedRect, slab } from '../geometry'
import { solid } from '../interaction'
import { mat } from '../materials'
import { useConsole } from '../store'
import { embossed, playSticker } from '../textures'

/** Ivory front shell with the display opening cut through it. */
export function FrontPanel() {
  const geometry = useMemo(() => {
    const hole = roundedRect(new Path(), SCREEN.w, SCREEN.h, SCREEN.r, SCREEN.x, SCREEN.y)
    return slab(W, H, PLATE_T, CORNER, 0.035, [hole])
  }, [])
  const play = useMemo(() => playSticker(), [])
  const brand = useMemo(() => embossed('Fast Cartridge'), [])
  const brandPlate = useMemo(() => slab(0.62, 0.15, 0.03, 0.075, 0.012), [])
  const ledGeo = useMemo(() => slab(0.5, 0.105, 0.03, 0.0525, 0.012), [])
  const power = useConsole((s) => s.power)
  const surface = FRONT_Z + 0.001

  return (
    <group>
      <mesh geometry={geometry} material={mat.ivory} position-z={FRONT_Z - PLATE_T / 2} castShadow receiveShadow {...solid} />

      {/* "Play" sticker */}
      <mesh position={[PLAY.x, PLAY.y, surface]} rotation-z={0.2}>
        <planeGeometry args={[0.84, 0.42]} />
        <meshStandardMaterial map={play} transparent roughness={0.35} polygonOffset polygonOffsetFactor={-2} depthWrite={false} />
      </mesh>

      {/* Status light bar */}
      <mesh geometry={ledGeo} position={[LED.x, LED.y, FRONT_Z + 0.004]} receiveShadow>
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.25}
          clearcoat={0.6}
          emissive="#fff7ee"
          emissiveIntensity={power ? 0.55 : 0}
        />
      </mesh>

      {/* Embossed brand plate */}
      <group position={[BRAND.x, BRAND.y, FRONT_Z]}>
        <mesh geometry={brandPlate} material={mat.ivory} position-z={0.006} castShadow receiveShadow />
        <mesh position-z={0.023}>
          <planeGeometry args={[0.54, 0.1]} />
          <meshStandardMaterial map={brand} transparent roughness={0.5} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}

/** Blue-grey housing that gives the console its thickness. */
export function SidePanel() {
  const geometry = useMemo(() => slab(HOUSING_W, HOUSING_H, HOUSING_D, CORNER - 0.03, 0.04), [])
  return <mesh geometry={geometry} material={mat.housing} position-z={HOUSING_Z} castShadow receiveShadow {...solid} />
}

export function ConsoleBody() {
  return (
    <group>
      <SidePanel />
      <FrontPanel />
    </group>
  )
}
