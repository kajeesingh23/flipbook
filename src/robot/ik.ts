import {
  FOREARM_LENGTH as L2,
  JOINT_LIMITS,
  MAX_HEIGHT,
  MIN_HEIGHT,
  MIN_RADIUS,
  REACH_MAX,
  REACH_MIN,
  SHOULDER,
  TOOL_LENGTH,
  UPPER_ARM_LENGTH as L1,
  WRIST_OFFSET,
} from './config'

export interface JointAngles {
  yaw: number
  shoulder: number
  elbow: number
  wristPitch: number
  wristYaw: number
}

export interface IKResult extends JointAngles {
  /** False when the target had to be pulled back inside the workspace. */
  reachable: boolean
}

interface Point3 {
  x: number
  y: number
  z: number
}

export const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v))

/** Wrist angles that keep the tool level and the tablet facing world +Z. */
export function wristCompensation(yaw: number, shoulder: number, elbow: number) {
  return {
    wristPitch: clamp(-(shoulder + elbow), JOINT_LIMITS.wristPitch),
    wristYaw: clamp(-yaw, JOINT_LIMITS.wristYaw),
  }
}

/**
 * Analytic IK. `target` is the desired world position of the tablet centre,
 * with the screen facing world +Z.
 *
 * 1. Step back along the tool axis to the wrist-yaw pivot.
 * 2. Base yaw points the arm plane at that pivot.
 * 3. Step back along the (level) wrist link to the wrist-pitch centre.
 * 4. Two-link, elbow-up solve for shoulder and elbow in the arm plane.
 * 5. Wrist pitch/yaw cancel the accumulated rotation.
 *
 * Unreachable targets are clamped to the nearest point of the workspace, so
 * the result is always finite and inside the joint limits.
 */
export function solveIK(target: Point3): IKResult {
  let reachable = true

  // 1. wrist-yaw pivot
  let px = target.x
  let pz = target.z - TOOL_LENGTH
  const py = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, target.y))
  if (py !== target.y) reachable = false

  let radius = Math.hypot(px, pz)
  if (radius < MIN_RADIUS) {
    // too close to the turret: push straight out
    if (radius < 1e-6) {
      px = 0
      pz = MIN_RADIUS
    } else {
      px *= MIN_RADIUS / radius
      pz *= MIN_RADIUS / radius
    }
    radius = MIN_RADIUS
    reachable = false
  }

  // 2. base yaw (0 = arm facing world +Z)
  const yawRaw = Math.atan2(px, pz)
  const yaw = clamp(yawRaw, JOINT_LIMITS.yaw)
  if (yaw !== yawRaw) reachable = false

  // 3. wrist-pitch centre relative to the shoulder, in the arm plane
  let dx = radius - WRIST_OFFSET - SHOULDER.r
  let dy = py - SHOULDER.y
  const dist = Math.hypot(dx, dy)
  const reach = Math.min(REACH_MAX, Math.max(REACH_MIN, dist))
  if (reach !== dist) {
    reachable = false
    if (dist < 1e-6) {
      dx = reach
      dy = 0
    } else {
      dx *= reach / dist
      dy *= reach / dist
    }
  }

  // 4. two-link solve, elbow above the shoulder-wrist line
  const cosShoulder = (L1 * L1 + reach * reach - L2 * L2) / (2 * L1 * reach)
  const alpha = Math.atan2(dy, dx) + Math.acos(Math.min(1, Math.max(-1, cosShoulder)))
  const shoulder = clamp(alpha, JOINT_LIMITS.shoulder)
  const ex = L1 * Math.cos(shoulder)
  const ey = L1 * Math.sin(shoulder)
  const forearmAngle = Math.atan2(dy - ey, dx - ex)
  const elbowRaw = forearmAngle - shoulder
  const elbow = clamp(elbowRaw, JOINT_LIMITS.elbow)
  if (shoulder !== alpha || elbow !== elbowRaw) reachable = false

  // 5. wrist
  return { yaw, shoulder, elbow, ...wristCompensation(yaw, shoulder, elbow), reachable }
}

/** Forward kinematics: world position of the tablet centre and its screen normal. */
export function forwardKinematics(q: JointAngles) {
  const a1 = q.shoulder
  const a2 = a1 + q.elbow
  const a3 = a2 + q.wristPitch
  const elbow = { r: SHOULDER.r + L1 * Math.cos(a1), y: SHOULDER.y + L1 * Math.sin(a1) }
  const wrist = { r: elbow.r + L2 * Math.cos(a2), y: elbow.y + L2 * Math.sin(a2) }
  const pivot = { r: wrist.r + WRIST_OFFSET * Math.cos(a3), y: wrist.y + WRIST_OFFSET * Math.sin(a3) }
  // tool axis: pitched by a3 in the arm plane, then turned by wristYaw about the wrist's own up axis
  const cy = Math.cos(q.wristYaw)
  const sy = Math.sin(q.wristYaw)
  // in the arm frame (r, y, lateral): tool = Rz(a3) * Ry(wristYaw) * (1,0,0)
  const tr = Math.cos(a3) * cy
  const ty = Math.sin(a3) * cy
  const tl = -sy
  const s1 = Math.sin(q.yaw)
  const c1 = Math.cos(q.yaw)
  // arm frame -> world: r axis = (s1, 0, c1), lateral axis = (-c1, 0, s1)
  const normal = { x: tr * s1 - tl * c1, y: ty, z: tr * c1 + tl * s1 }
  return {
    elbow,
    wrist,
    position: {
      x: pivot.r * s1 + TOOL_LENGTH * normal.x,
      y: pivot.y + TOOL_LENGTH * normal.y,
      z: pivot.r * c1 + TOOL_LENGTH * normal.z,
    },
    normal,
  }
}
