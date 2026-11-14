import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

export const BACKGROUND = '#eceae6'

/** Ground plane: a soft pool of light that fades into the backdrop, plus cast shadows. */
export function StudioFloor() {
  const texture = useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, '#f8f7f5')
    g.addColorStop(0.35, '#f3f2ef')
    g.addColorStop(1, BACKGROUND)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <circleGeometry args={[14, 64]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.001]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.1} />
      </mesh>
    </group>
  )
}
