import * as THREE from 'three'

/** Unit cylinders (radius 1, height 1) aligned to each axis; scale to size. */
const cylY = new THREE.CylinderGeometry(1, 1, 1, 56)
const cylX = cylY.clone().rotateZ(-Math.PI / 2)
const cylZ = cylY.clone().rotateX(Math.PI / 2)
export const unitCylinder = { x: cylX, y: cylY, z: cylZ }

/** Hex-socket bolt head, axis along +Z, sitting on z = 0. */
export const boltGeometry = new THREE.CylinderGeometry(1, 1, 1, 6).rotateX(Math.PI / 2).translate(0, 0, 0.5)

/**
 * Outline of a tapered link: the convex hull of a circle of radius r1 at the
 * origin and a circle of radius r2 at (length, 0).
 */
export function linkShape(r1: number, r2: number, length: number) {
  const theta = Math.acos((r1 - r2) / length)
  const shape = new THREE.Shape()
  shape.absarc(0, 0, r1, theta, Math.PI * 2 - theta, false)
  shape.absarc(length, 0, r2, -theta, theta, false)
  shape.closePath()
  return shape
}

export function roundedRectShape(width: number, height: number, radius: number) {
  const w = width / 2
  const h = height / 2
  const shape = new THREE.Shape()
  shape.absarc(w - radius, h - radius, radius, 0, Math.PI / 2, false)
  shape.absarc(-w + radius, h - radius, radius, Math.PI / 2, Math.PI, false)
  shape.absarc(-w + radius, -h + radius, radius, Math.PI, Math.PI * 1.5, false)
  shape.absarc(w - radius, -h + radius, radius, Math.PI * 1.5, Math.PI * 2, false)
  shape.closePath()
  return shape
}

/** Extrude along Z with chamfered edges, total thickness `depth`, centred on z = 0. */
export function extrudeCentered(shape: THREE.Shape, depth: number, bevel = 0.006, curveSegments = 40) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 3,
    curveSegments,
  })
  geo.translate(0, 0, -(depth / 2 - bevel))
  return geo
}

/** Solid of revolution about the X axis from [radius, x] profile points. */
export function latheX(profile: [number, number][], segments = 56) {
  const pts = profile.map(([r, x]) => new THREE.Vector2(r, x))
  return new THREE.LatheGeometry(pts, segments).rotateZ(-Math.PI / 2)
}

/** Solid of revolution about the Y axis from [radius, y] profile points. */
export function latheY(profile: [number, number][], segments = 72) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments)
}

/** Raised ring of unit outer radius and unit height, axis +Z, sitting on z = 0. */
export const capRingGeometry = new THREE.LatheGeometry(
  [
    [0.7, 0],
    [1, 0],
    [1, 0.8],
    [0.965, 1],
    [0.735, 1],
    [0.7, 0.8],
    [0.7, 0],
  ].map(([r, y]) => new THREE.Vector2(r, y)),
  64,
).rotateX(Math.PI / 2)
