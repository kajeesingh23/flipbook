import { describe, expect, it } from 'vitest'
import { HOME_TARGET, INTERACTION_PLANE_Z, JOINT_LIMITS, WORKSPACE } from './config'
import { forwardKinematics, solveIK } from './ik'

const within = (v: number, [lo, hi]: readonly [number, number]) => v >= lo - 1e-9 && v <= hi + 1e-9

function* grid() {
  for (let x = WORKSPACE.xMin - 1; x <= WORKSPACE.xMax + 1; x += 0.07)
    for (let y = -0.5; y <= 2.6; y += 0.07) yield { x, y, z: INTERACTION_PLANE_Z }
}

describe('solveIK', () => {
  it('reaches the home target exactly', () => {
    const q = solveIK(HOME_TARGET)
    expect(q.reachable).toBe(true)
    const fk = forwardKinematics(q)
    expect(fk.position.x).toBeCloseTo(HOME_TARGET.x, 6)
    expect(fk.position.y).toBeCloseTo(HOME_TARGET.y, 6)
    expect(fk.position.z).toBeCloseTo(HOME_TARGET.z, 6)
  })

  it('hits every reachable target with the screen facing +Z', () => {
    let reachable = 0
    for (const t of grid()) {
      const q = solveIK(t)
      if (!q.reachable) continue
      reachable++
      const fk = forwardKinematics(q)
      expect(Math.hypot(fk.position.x - t.x, fk.position.y - t.y, fk.position.z - t.z)).toBeLessThan(1e-6)
      expect(fk.normal.z).toBeGreaterThan(0.999999)
    }
    expect(reachable).toBeGreaterThan(200)
  })

  it('stays finite, inside joint limits and above the floor for any target', () => {
    for (const t of grid()) {
      const q = solveIK(t)
      for (const k of ['yaw', 'shoulder', 'elbow', 'wristPitch', 'wristYaw'] as const) {
        expect(Number.isFinite(q[k])).toBe(true)
        expect(within(q[k], JOINT_LIMITS[k])).toBe(true)
      }
      const fk = forwardKinematics(q)
      expect(fk.elbow.y).toBeGreaterThan(0.3)
      expect(fk.wrist.y).toBeGreaterThan(0.25)
      expect(fk.position.y).toBeGreaterThan(0.3)
      // tablet always level and in front of the base
      expect(Math.abs(fk.normal.y)).toBeLessThan(1e-6)
      expect(fk.position.z).toBeGreaterThan(0.3)
    }
  })
})
