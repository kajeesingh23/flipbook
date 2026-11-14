import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { disposeMaterials } from '../robot/materials'
import { RobotModel } from '../robot/RobotModel'
import { CameraController } from './CameraController'
import { LightingSetup } from './LightingSetup'
import { BACKGROUND, StudioFloor } from './StudioFloor'

export function RobotScene({ resetSignal }: { resetSignal: number }) {
  useEffect(() => {
    // shared materials outlive individual meshes; release them on full page teardown only
    window.addEventListener('pagehide', disposeMaterials)
    return () => window.removeEventListener('pagehide', disposeMaterials)
  }, [])

  return (
    <Canvas shadows="percentage" dpr={[1, 2]} camera={{ fov: 30, near: 0.1, far: 60, position: [1.5, 1.6, 4.6] }} gl={{ antialias: true }}>
      <color attach="background" args={[BACKGROUND]} />
      <LightingSetup />
      <StudioFloor />
      <RobotModel />
      <CameraController resetSignal={resetSignal} />
    </Canvas>
  )
}
