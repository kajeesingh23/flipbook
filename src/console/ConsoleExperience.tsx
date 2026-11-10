import { Canvas } from '@react-three/fiber'
import { NeutralToneMapping, PCFShadowMap } from 'three'
import { FOV } from './CameraController'
import { useReducedMotion } from './interaction'
import { Scene } from './Scene'

/** Single shared WebGL scene containing the whole interactive console. */
export function ConsoleExperience() {
  const reducedMotion = useReducedMotion()
  const mobile = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600

  return (
    <Canvas
      shadows={{ type: PCFShadowMap }}
      dpr={[1, mobile ? 1.75 : 2]}
      camera={{ fov: FOV, near: 1, far: 80, position: [0, 0, 16] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = NeutralToneMapping
        gl.toneMappingExposure = 1
      }}
      role="img"
      aria-label="Interactive 3D retro handheld game console. Drag the joystick, press the buttons, pull the cartridges and turn the side knob. Keyboard: arrow keys to move, Z X C for the action buttons."
    >
      <Scene reducedMotion={reducedMotion} mobile={mobile} />
    </Canvas>
  )
}
