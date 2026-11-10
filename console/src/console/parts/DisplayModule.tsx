import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { CanvasTexture, NearestFilter, ShaderMaterial, ShapeGeometry, Shape, SRGBColorSpace, Vector2 } from 'three'
import { FRONT_Z, PICTURE, SCREEN } from '../dimensions'
import { crtFragment, crtVertex } from '../game/crtShader'
import { GameSystem } from '../game/GameSystem'
import { GH, GW } from '../game/types'
import { roundedRect, slab } from '../geometry'
import { solid } from '../interaction'
import { mat } from '../materials'
import { axes, useConsole } from '../store'
import { bitmapLabel } from '../textures'

/** The lit picture: the game system's canvas pushed through the CRT shader. */
export function GameScreen() {
  const { game, texture, material } = useMemo(() => {
    const game = new GameSystem()
    const texture = new CanvasTexture(game.canvas)
    texture.colorSpace = SRGBColorSpace
    texture.magFilter = texture.minFilter = NearestFilter
    texture.generateMipmaps = false
    const material = new ShaderMaterial({
      vertexShader: crtVertex,
      fragmentShader: crtFragment,
      toneMapped: false,
      uniforms: {
        map: { value: texture },
        resolution: { value: new Vector2(GW, GH) },
        time: { value: 0 },
        brightness: { value: axes.brightness },
        power: { value: 1 },
        aspect: { value: PICTURE.w / PICTURE.h },
      },
    })
    return { game, texture, material }
  }, [])

  useEffect(
    () => () => {
      texture.dispose()
      material.dispose()
    },
    [texture, material],
  )

  useFrame((_, dt) => {
    const u = material.uniforms
    const on = useConsole.getState().power
    game.update(dt)
    texture.needsUpdate = true
    u.time.value += dt
    u.brightness.value += (axes.brightness - u.brightness.value) * Math.min(1, dt * 10)
    u.power.value = Math.min(1, Math.max(0, u.power.value + (on ? dt * 2.2 : -dt * 3.5)))
  })

  return (
    <mesh material={material} position-y={PICTURE.y}>
      <planeGeometry args={[PICTURE.w, PICTURE.h]} />
    </mesh>
  )
}

/** Recessed display: bezel, picture, printed label and a reflective glass sheet. */
export function DisplayModule() {
  const bezel = useMemo(() => slab(SCREEN.w + 0.03, SCREEN.h + 0.03, 0.1, SCREEN.r, 0.01), [])
  const glass = useMemo(() => new ShapeGeometry(roundedRect(new Shape(), SCREEN.w - 0.03, SCREEN.h - 0.03, SCREEN.r - 0.015), 16), [])
  const label = useMemo(() => bitmapLabel('MOTION DESIGN 2024', '#c9cdd6'), [])
  const labelH = 0.062
  const z = FRONT_Z - SCREEN.recess

  return (
    <group position={[SCREEN.x, SCREEN.y, z]}>
      <mesh geometry={bezel} material={mat.bezel} position-z={-0.05} receiveShadow {...solid} />
      <group position-z={0.002}>
        <GameScreen />
      </group>
      <mesh position={[SCREEN.w / 2 - 0.16 - (labelH * label.aspect) / 2, -SCREEN.h / 2 + 0.14, 0.003]}>
        <planeGeometry args={[labelH * label.aspect, labelH]} />
        <meshBasicMaterial map={label.texture} transparent opacity={0.8} toneMapped={false} />
      </mesh>
      <mesh geometry={glass} material={mat.glass} position-z={0.012} />
    </group>
  )
}
