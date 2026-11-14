import { useMemo } from 'react'
import { FOREARM_LENGTH } from './config'
import { latheX } from './geometry'
import { materials } from './materials'

/** Forearm link. Origin on the elbow axis, extends along +X to the wrist axis. */
export function Forearm() {
  const L = FOREARM_LENGTH
  const rear = useMemo(
    () =>
      latheX([
        [0.078, 0.04],
        [0.079, 0.13],
        [0.074, 0.2],
        [0.07, 0.285],
        [0.066, 0.29],
      ]),
    [],
  )
  // ribbed graphite collar
  const collar = useMemo(() => {
    const pts: [number, number][] = [[0.064, 0.288]]
    for (let i = 0; i < 4; i++) {
      const x = 0.292 + i * 0.016
      pts.push([0.072, x], [0.072, x + 0.01], [0.066, x + 0.012], [0.066, x + 0.016])
    }
    pts.push([0.064, 0.358])
    return latheX(pts)
  }, [])
  const front = useMemo(
    () =>
      latheX([
        [0.064, 0.354],
        [0.066, 0.36],
        [0.063, 0.42],
        [0.06, L - 0.085],
        [0.057, L - 0.08],
      ]),
    [L],
  )
  const wristCollar = useMemo(
    () =>
      latheX([
        [0.055, L - 0.084],
        [0.062, L - 0.08],
        [0.062, L - 0.062],
        [0.057, L - 0.058],
        [0.057, L - 0.02],
      ]),
    [L],
  )
  return (
    <group>
      <mesh geometry={rear} material={materials.aluminium} castShadow receiveShadow />
      <mesh geometry={collar} material={materials.graphite} castShadow receiveShadow />
      <mesh geometry={front} material={materials.aluminium} castShadow receiveShadow />
      <mesh geometry={wristCollar} material={materials.graphite} castShadow receiveShadow />
    </group>
  )
}
