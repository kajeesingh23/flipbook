import { Environment, Lightformer } from '@react-three/drei'

/**
 * Studio product lighting: a large softbox key from the upper left, a broad
 * fill from the right and a rim from behind. The softboxes also live in the
 * environment map so glossy parts pick up clean rectangular highlights.
 */
export function LightingRig({ shadowMapSize = 2048 }: { shadowMapSize?: number }) {
  return (
    <>
      <hemisphereLight args={['#ffffff', '#c9c6d8', 0.55]} />
      <directionalLight
        position={[-4.5, 6.5, 8]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={5}
      >
        <orthographicCamera attach="shadow-camera" args={[-4.5, 4.5, 5, -5, 1, 30]} />
      </directionalLight>
      <directionalLight position={[6, 0.5, 5]} intensity={0.45} color="#eef0ff" />
      <directionalLight position={[3, 5, -6]} intensity={1.1} />

      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#b9b8c6']} />
        <Lightformer form="rect" intensity={3.2} position={[-5, 6, 6]} scale={[9, 7, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.1} color="#eef0ff" position={[8, 0, 4]} scale={[5, 9, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.4} position={[2, 6, -7]} scale={[10, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.7} position={[0, -7, 3]} scale={[10, 4, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  )
}
