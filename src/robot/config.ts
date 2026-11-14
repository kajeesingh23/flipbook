/**
 * Robot dimensions, joint limits and workspace. Units are metres.
 *
 * Kinematic chain (see RobotModel):
 *   q1 base yaw      – about world Y
 *   q2 shoulder      – pitch, in the arm plane
 *   q3 elbow         – pitch, in the arm plane
 *   q4 wrist pitch   – keeps the tool flange level
 *   q5 wrist yaw     – turns the tablet back towards the viewer
 *
 * "Arm plane" coordinates are (r, y): r is the horizontal distance from the
 * base axis along the direction the arm is facing, y is height above the floor.
 */
const deg = (d: number) => (d * Math.PI) / 180

/** Height at which the rotating turret starts (top of the fixed base). */
export const BASE_HEIGHT = 0.15

/** Shoulder pivot in arm-plane coordinates. It sits behind the base axis. */
export const SHOULDER = { r: -0.2, y: 0.45 }

export const UPPER_ARM_LENGTH = 0.62
export const FOREARM_LENGTH = 0.56
/** Distance from the wrist-pitch axis to the wrist-yaw axis. */
export const WRIST_OFFSET = 0.085
/** Distance from the wrist-yaw axis to the centre of the tablet. */
export const TOOL_LENGTH = 0.167

export const TABLET = { width: 0.46, height: 0.3, thickness: 0.014 }

export const JOINT_LIMITS = {
  yaw: [deg(-115), deg(115)],
  shoulder: [deg(-15), deg(150)],
  elbow: [deg(-150), deg(-15)],
  wristPitch: [deg(-125), deg(125)],
  wristYaw: [deg(-105), deg(105)],
} as const

/** Shoulder-to-wrist distance limits: keeps the elbow from locking or folding. */
export const REACH_MIN = 0.36
export const REACH_MAX = UPPER_ARM_LENGTH + FOREARM_LENGTH - 0.02

/** Wrist-yaw pivot keep-out: stay clear of the turret and the floor. */
export const MIN_RADIUS = 0.56
export const MIN_HEIGHT = 0.34
export const MAX_HEIGHT = 1.8

/** The pointer is projected onto the vertical plane z = INTERACTION_PLANE_Z. */
export const INTERACTION_PLANE_Z = 0.78
export const WORKSPACE = { xMin: -1.4, xMax: 1.4, yMin: MIN_HEIGHT, yMax: MAX_HEIGHT }

/** Resting position of the tablet centre. */
export const HOME_TARGET = { x: -0.52, y: 0.88, z: INTERACTION_PLANE_Z }

/** Lateral layout of the links (arm-local z). */
export const HOUSING_HALF_WIDTH = 0.085
export const UPPER_ARM_THICKNESS = 0.08
