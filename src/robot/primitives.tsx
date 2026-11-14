import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { boltGeometry, capRingGeometry, unitCylinder } from './geometry'
import { materials } from './materials'

type Axis = 'x' | 'y' | 'z'

interface CylProps {
  axis?: Axis
  radius: number
  length: number
  material: THREE.Material
  position?: [number, number, number]
}

/** Cylinder built from a shared unit geometry. */
export function Cyl({ axis = 'y', radius, length, material, position }: CylProps) {
  const scale: [number, number, number] =
    axis === 'x' ? [length, radius, radius] : axis === 'y' ? [radius, length, radius] : [radius, radius, length]
  return (
    <mesh geometry={unitCylinder[axis]} material={material} scale={scale} position={position} castShadow receiveShadow />
  )
}

interface BoltRingProps {
  count: number
  /** radius of the bolt circle */
  radius: number
  /** radius of each bolt head */
  size: number
  height?: number
  phase?: number
}

/** Ring of bolt heads in the XY plane, heads pointing +Z. One draw call. */
export function BoltRing({ count, radius, size, height = 0.004, phase = 0, ...props }: BoltRingProps & ThreeElements['group']) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current!
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3(size, size, height)
    const p = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      const a = phase + (i / count) * Math.PI * 2
      p.set(Math.cos(a) * radius, Math.sin(a) * radius, 0)
      m.compose(p, q, s)
      mesh.setMatrixAt(i, m)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [count, radius, size, height, phase])
  return (
    <group {...props}>
      <instancedMesh ref={ref} args={[boltGeometry, materials.steel, count]} castShadow />
    </group>
  )
}

interface JointCapProps {
  radius: number
  /** 'dark' = charcoal recess, 'light' = polished centre plate */
  center?: 'dark' | 'light'
  bolts?: number
  /** which way the cap faces along the joint axis */
  side?: 1 | -1
  /** distance of the mounting face from the joint centre along the axis */
  offset: number
}

/**
 * Circular joint cover, on the Z axis of the parent joint: graphite bolt
 * ring, recessed plate, centre boss and perimeter fasteners.
 */
export function JointCap({ radius, center = 'dark', bolts = 10, side = 1, offset }: JointCapProps) {
  const ringH = Math.max(0.008, radius * 0.1)
  const rotation = useMemo<[number, number, number]>(() => [0, side === 1 ? 0 : Math.PI, 0], [side])
  return (
    <group position={[0, 0, side * offset]} rotation={rotation}>
      {/* seam between housing and cover */}
      <Cyl axis="z" radius={radius * 0.985} length={0.003} material={materials.charcoal} position={[0, 0, 0.0015]} />
      <mesh
        geometry={capRingGeometry}
        material={materials.graphite}
        scale={[radius * 0.96, radius * 0.96, ringH]}
        position={[0, 0, 0.003]}
        castShadow
      />
      {/* recessed plate */}
      <Cyl
        axis="z"
        radius={radius * 0.68}
        length={ringH * 0.5}
        material={center === 'light' ? materials.polished : materials.charcoal}
        position={[0, 0, 0.003 + ringH * 0.25]}
      />
      {/* centre boss */}
      <Cyl
        axis="z"
        radius={radius * 0.2}
        length={ringH * 0.75}
        material={center === 'light' ? materials.graphite : materials.graphite}
        position={[0, 0, 0.003 + ringH * 0.375]}
      />
      <BoltRing count={bolts} radius={radius * 0.82} size={radius * 0.05} height={ringH * 0.25} position={[0, 0, 0.003 + ringH]} />
    </group>
  )
}
