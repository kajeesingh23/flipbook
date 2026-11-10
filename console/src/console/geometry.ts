import { ExtrudeGeometry, LatheGeometry, Path, Shape, Vector2 } from 'three'

/** Trace a rounded rectangle centred on (cx, cy) into a Shape or Path. */
export function roundedRect<T extends Path>(target: T, w: number, h: number, r: number, cx = 0, cy = 0): T {
  const x = cx - w / 2
  const y = cy - h / 2
  r = Math.min(r, w / 2, h / 2)
  target.moveTo(x + r, y)
  target.lineTo(x + w - r, y)
  target.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  target.lineTo(x + w, y + h - r)
  target.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  target.lineTo(x + r, y + h)
  target.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  target.lineTo(x, y + r)
  target.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return target
}

/**
 * Bevelled rounded slab lying in the XY plane, centred on the origin.
 * w/h/d are the outer dimensions including the bevel.
 */
export function slab(w: number, h: number, d: number, r: number, bevel = 0.03, holes: Path[] = []) {
  const shape = roundedRect(new Shape(), w - bevel * 2, h - bevel * 2, Math.max(r - bevel, 0.001))
  shape.holes.push(...holes)
  const depth = Math.max(d - bevel * 2, 0.0001)
  const geo = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 20,
  })
  geo.translate(0, 0, -depth / 2)
  return geo
}

export function circleHole(x: number, y: number, r: number) {
  const p = new Path()
  p.absarc(x, y, r, 0, Math.PI * 2, true)
  return p
}

/**
 * Profile for a moulded round part (button cap, knob, collar): straight wall,
 * rounded shoulder, optionally domed top. Returned bottom → top.
 */
export function capProfile(r: number, h: number, round: number, dome = 0, steps = 8) {
  const pts: Vector2[] = [new Vector2(r, 0)]
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    pts.push(new Vector2(r - round + round * Math.cos(a), h - round + round * Math.sin(a)))
  }
  if (dome > 0) {
    const inner = r - round
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      pts.push(new Vector2(inner * (1 - t), h + dome * (1 - (1 - t) * (1 - t))))
    }
  } else {
    pts.push(new Vector2(0, h))
  }
  return pts
}

/** Lathe a profile so its axis is +Z (pointing out of the surface it sits on). */
export function latheZ(points: Vector2[], segments = 56) {
  const geo = new LatheGeometry(points, segments)
  geo.rotateX(Math.PI / 2)
  return geo
}
