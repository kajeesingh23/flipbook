import gsap from 'gsap'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { CanvasTexture } from 'three'
import type { Group } from 'three'
import { CameraController } from './CameraController'
import { InteractionController } from './InteractionController'
import { LightingRig } from './LightingRig'
import { ActionButtons } from './parts/ActionButton'
import { Cartridges } from './parts/Cartridge'
import { BackPanel } from './parts/BackPanel'
import { ConsoleBody } from './parts/ConsoleBody'
import { DirectionalPad } from './parts/DirectionalPad'
import { DisplayModule } from './parts/DisplayModule'
import { Joystick } from './parts/Joystick'
import { LanyardLoop, ScrewDetails } from './parts/ScrewDetails'
import { RotationController } from './RotationController'
import { SideControls } from './parts/SideControls'
import { USBPort } from './parts/USBPort'

/** Three-quarter product pose taken from the reference photograph. */
const POSE: [number, number, number] = [-0.34, 0.5, 0.13]

/** Soft, baked studio shadow on the backdrop behind the floating console. */
function BackdropShadow() {
  const texture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')!
    // Draw the caster off-canvas so only its blurred shadow lands in view.
    ctx.shadowColor = 'rgba(70, 66, 104, 1)'
    ctx.shadowBlur = 38
    ctx.shadowOffsetX = 600
    ctx.beginPath()
    ctx.roundRect(-600 + 78, 62, 100, 132, 22)
    ctx.fill()
    return new CanvasTexture(c)
  }, [])
  return (
    <mesh position={[0.55, -0.75, -2.2]} rotation-z={0.1} renderOrder={-1}>
      <planeGeometry args={[9.5, 9.5]} />
      <meshBasicMaterial map={texture} transparent opacity={0.2} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

function Console() {
  return (
    <>
      <ConsoleBody />
      <BackPanel />
      <DisplayModule />
      <ScrewDetails />
      <ActionButtons />
      <DirectionalPad />
      <Joystick />
      <Cartridges />
      <SideControls />
      <LanyardLoop />
      <USBPort />
    </>
  )
}

export function Scene({ reducedMotion, mobile }: { reducedMotion: boolean; mobile: boolean }) {
  const intro = useRef<Group>(null!)
  const float = useRef<Group>(null)

  // One-off reveal: the console eases up into its pose.
  useLayoutEffect(() => {
    if (reducedMotion) return
    const g = intro.current
    const tl = gsap.timeline({ defaults: { duration: 1.8, ease: 'power3.out' } })
    tl.from(g.position, { y: -1.1 }, 0).from(g.rotation, { y: -0.75, x: 0.25 }, 0).from(g.scale, { x: 0.9, y: 0.9, z: 0.9 }, 0)
    return () => {
      tl.progress(1).kill()
    }
  }, [reducedMotion])

  return (
    <>
      <color attach="background" args={['#DAD9E5']} />
      <CameraController parallax={!reducedMotion} />
      <RotationController target={float} pose={POSE} reducedMotion={reducedMotion} />
      <LightingRig shadowMapSize={mobile ? 1024 : 2048} />
      <group ref={intro}>
        <group ref={float} rotation={POSE}>
          <Console />
        </group>
      </group>
      <BackdropShadow />
      <InteractionController />
    </>
  )
}
