import { ContactShadows, Environment, Lightformer } from '@react-three/drei'

/**
 * Studio lighting. The reflection environment is built from light panels in
 * code, so nothing is fetched at runtime.
 */
export function LightingSetup() {
  return (
    <>
      <hemisphereLight args={['#ffffff', '#cfcdc9', 0.35]} />
      <directionalLight
        position={[2.6, 4.2, 3.4]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-2.4, 2.4, 2.4, -2.4, 0.5, 12]} />
      </directionalLight>
      <directionalLight position={[-3, 2, 2]} intensity={0.45} />

      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#8e9093']} />
        {/* overhead softbox */}
        <Lightformer form="rect" intensity={3.2} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[9, 9, 1]} />
        {/* side strips give the cylinders their long highlights */}
        <Lightformer form="rect" intensity={2.4} position={[-5, 2, 1.5]} rotation-y={Math.PI / 2} scale={[7, 2.4, 1]} />
        <Lightformer form="rect" intensity={1.8} position={[5, 2.2, 1]} rotation-y={-Math.PI / 2} scale={[7, 2.4, 1]} />
        <Lightformer form="rect" intensity={1.1} position={[0, 2.5, 6]} rotation-y={Math.PI} scale={[9, 3, 1]} />
        {/* dark cards for contrast in the metal */}
        <Lightformer form="rect" color="#3a3c40" intensity={1} position={[0, 1, -6]} scale={[12, 3, 1]} />
        <Lightformer form="rect" color="#55575b" intensity={1} position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[12, 12, 1]} />
      </Environment>

      <ContactShadows position={[0, 0.002, 0]} scale={5} far={1.9} resolution={512} blur={2.6} opacity={0.42} color="#1a1a1c" />
    </>
  )
}
