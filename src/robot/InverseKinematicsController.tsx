import { useEffect, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { HOME_TARGET, INTERACTION_PLANE_Z, WORKSPACE } from './config'
import { solveIK, wristCompensation } from './ik'

type JointRef = RefObject<THREE.Group | null>

interface Props {
  joints: { yaw: JointRef; shoulder: JointRef; elbow: JointRef; wristPitch: JointRef; wristYaw: JointRef }
  tablet: JointRef
}

/** Seconds without pointer input before the idle motion takes over. */
const IDLE_AFTER = 3.5
/** Response of the target itself (1/s). */
const TARGET_DAMPING = 6
/** Per-joint response (1/s) and speed limit (rad/s): heavy axes are slower. */
const DRIVES = {
  yaw: { damping: 5, maxSpeed: 2.0 },
  shoulder: { damping: 6.5, maxSpeed: 2.4 },
  elbow: { damping: 8, maxSpeed: 3.0 },
} as const

/** Critically-damped approach with a hard speed limit, like a servo drive. */
function drive(current: number, target: number, { damping, maxSpeed }: { damping: number; maxSpeed: number }, dt: number) {
  const next = THREE.MathUtils.damp(current, target, damping, dt)
  const maxStep = maxSpeed * dt
  return current + Math.min(maxStep, Math.max(-maxStep, next - current))
}

/**
 * Turns pointer movement into joint rotations.
 *
 * Pointer → ray → interaction plane → clamped target → analytic IK → damped,
 * rate-limited joint drives. The wrist is solved from the *current* arm pose
 * every frame, so the tablet stays level and facing the viewer even while
 * the heavier joints are still catching up.
 *
 * Everything lives in refs; pointer movement never triggers a React render.
 */
export function InverseKinematicsController({ joints, tablet }: Props) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)

  const goal = useRef(new THREE.Vector3(HOME_TARGET.x, HOME_TARGET.y, HOME_TARGET.z))
  const target = useRef(goal.current.clone())
  const lastInput = useRef(-Infinity)
  const clock = useRef(0)
  const q = useRef<{ yaw: number; shoulder: number; elbow: number } | null>(null)

  useEffect(() => {
    const el = gl.domElement
    const raycaster = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -INTERACTION_PLANE_Z)
    const ndc = new THREE.Vector2()
    const hit = new THREE.Vector3()
    const touches = new Set<number>()

    const steer = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      if (!raycaster.ray.intersectPlane(plane, hit)) return
      goal.current.set(
        THREE.MathUtils.clamp(hit.x, WORKSPACE.xMin, WORKSPACE.xMax),
        THREE.MathUtils.clamp(hit.y, WORKSPACE.yMin, WORKSPACE.yMax),
        INTERACTION_PLANE_Z,
      )
      lastInput.current = clock.current
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        // one finger steers the arm; two fingers belong to the camera
        if (touches.size === 1 && touches.has(e.pointerId)) steer(e)
      } else if (e.buttons === 0) {
        steer(e)
      } else {
        // dragging = orbiting: hold the arm where it is, but don't go idle
        lastInput.current = clock.current
      }
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      touches.add(e.pointerId)
      if (touches.size === 1) steer(e)
    }
    const onUp = (e: PointerEvent) => touches.delete(e.pointerId)
    const onLeave = (e: PointerEvent) => {
      touches.delete(e.pointerId)
      if (e.pointerType !== 'touch') lastInput.current = Math.min(lastInput.current, clock.current - IDLE_AFTER + 1)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [gl, camera])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    clock.current += dt
    const t = clock.current

    // idle: slow, small presentation sweep around the home position
    if (t - lastInput.current > IDLE_AFTER) {
      goal.current.set(
        HOME_TARGET.x + Math.sin(t * 0.33) * 0.14,
        HOME_TARGET.y + Math.sin(t * 0.47 + 1.2) * 0.06,
        HOME_TARGET.z,
      )
    }

    const p = target.current
    p.x = THREE.MathUtils.damp(p.x, goal.current.x, TARGET_DAMPING, dt)
    p.y = THREE.MathUtils.damp(p.y, goal.current.y, TARGET_DAMPING, dt)
    p.z = goal.current.z

    const solution = solveIK(p)
    if (!q.current) q.current = { yaw: solution.yaw, shoulder: solution.shoulder, elbow: solution.elbow }
    const cur = q.current
    cur.yaw = drive(cur.yaw, solution.yaw, DRIVES.yaw, dt)
    cur.shoulder = drive(cur.shoulder, solution.shoulder, DRIVES.shoulder, dt)
    cur.elbow = drive(cur.elbow, solution.elbow, DRIVES.elbow, dt)
    const wrist = wristCompensation(cur.yaw, cur.shoulder, cur.elbow)

    const j = joints
    if (j.yaw.current) j.yaw.current.rotation.y = cur.yaw
    if (j.shoulder.current) j.shoulder.current.rotation.z = cur.shoulder
    if (j.elbow.current) j.elbow.current.rotation.z = cur.elbow
    if (j.wristPitch.current) j.wristPitch.current.rotation.z = wrist.wristPitch
    if (j.wristYaw.current) j.wristYaw.current.rotation.y = wrist.wristYaw
  })

  // Dev-only probe so the pose can be checked against the real scene graph.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const w = window as unknown as { __robot?: () => unknown }
    w.__robot = () => {
      const obj = tablet.current
      if (!obj || !q.current) return null
      obj.updateWorldMatrix(true, false)
      const pos = new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld)
      const normal = new THREE.Vector3(0, 0, 1).transformDirection(obj.matrixWorld)
      const cur = q.current
      return {
        goal: goal.current.toArray(),
        tablet: pos.toArray(),
        normal: normal.toArray(),
        joints: { ...cur, ...wristCompensation(cur.yaw, cur.shoulder, cur.elbow) },
        reachable: solveIK(goal.current).reachable,
        camera: camera.position.toArray(),
      }
    }
    return () => {
      delete w.__robot
    }
  }, [tablet, camera])

  return null
}
