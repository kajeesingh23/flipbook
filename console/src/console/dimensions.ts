// All measurements are in scene units; the console is ~3 units wide.
// Origin is the centre of the body, +X right, +Y up, +Z out of the front face.

export const W = 3
export const H = 4.1
export const D = 0.8
export const CORNER = 0.24

/** Ivory front plate */
export const PLATE_T = 0.14
export const FRONT_Z = D / 2

/** Ivory rear shell */
export const BACK_T = 0.1
export const BACK_Z = -D / 2

/** Blue-grey mid frame sandwiched between the shells (inset so the seams read) */
export const HOUSING_W = W - 0.06
export const HOUSING_H = H - 0.06
export const HOUSING_D = D - PLATE_T - BACK_T
export const HOUSING_Z = (BACK_Z + BACK_T + FRONT_Z - PLATE_T) / 2

/** Recessed display opening */
export const SCREEN = { w: 2.62, h: 2.0, x: 0, y: 0.86, r: 0.17, recess: 0.035 }
/** Lit picture area inside the bezel (3:2, matches the game canvas) */
export const PICTURE = { w: 2.37, h: 1.58, y: 0.09 }

export const BUTTONS = {
  y: -1.13,
  r: 0.2,
  items: [
    { id: 'a', x: -0.9, color: '#0759DE', wall: '#053C9C' },
    { id: 'b', x: -0.42, color: '#F5BD35', wall: '#C48A12' },
    { id: 'c', x: 0.06, color: '#E74732', wall: '#A92A1B' },
  ],
} as const

export const JOYSTICK = { x: 0.9, y: -1.19, r: 0.42 }
export const DPAD = { x: 1.08, y: -0.57 }
export const PLAY = { x: -0.84, y: -0.55 }
export const LED = { x: 0, y: -0.37 }
export const BRAND = { x: 0, y: -1.845 }

export const SCREWS: [number, number][] = [
  [-1.36, 1.93],
  [1.36, 1.93],
  [-1.3, -1.87],
  [1.36, -1.87],
]

export const BACK_SCREWS: [number, number][] = [
  [-1.3, 1.85],
  [1.3, 1.85],
  [-1.3, 0.02],
  [1.3, 0.02],
  [-1.3, -1.85],
  [1.3, -1.85],
]

export const USB_X = 0.42
