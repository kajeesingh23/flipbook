import * as THREE from 'three'

/** Fine directional streaks, used as a roughness/bump map for brushed metal. */
function createBrushedTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'rgb(226,226,226)'
  ctx.fillRect(0, 0, size, size)
  // deterministic pseudo-random so the look is stable between loads
  let seed = 7
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let i = 0; i < 2600; i++) {
    const y = rand() * size
    const x = rand() * size
    const len = 30 + rand() * 140
    const v = 190 + Math.floor(rand() * 65)
    ctx.strokeStyle = `rgba(${v},${v},${v},${0.18 + rand() * 0.3})`
    ctx.lineWidth = 0.5 + rand()
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + len, y)
    ctx.stroke()
    // wrap around so the texture tiles
    ctx.beginPath()
    ctx.moveTo(x - size, y)
    ctx.lineTo(x + len - size, y)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 3)
  tex.anisotropy = 4
  return tex
}

const brushed = createBrushedTexture()

function metal(color: string, metalness: number, roughness: number, brush = 0.0006) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    roughnessMap: brushed,
    bumpMap: brushed,
    bumpScale: brush * 1000,
  })
}

/** Shared materials: one instance each, reused by every part. */
export const materials = {
  /** main body housings */
  silver: metal('#d6d9dd', 0.88, 0.33),
  /** structural arm links */
  aluminium: metal('#c2c7cd', 0.9, 0.34),
  /** joint housings, base, gripper */
  graphite: metal('#2c2e32', 0.72, 0.46),
  /** joint recesses */
  charcoal: metal('#161719', 0.65, 0.52),
  /** polished joint details */
  polished: metal('#aab0b7', 0.95, 0.24, 0.0003),
  /** fasteners */
  steel: new THREE.MeshStandardMaterial({ color: '#3b3e43', metalness: 0.9, roughness: 0.32 }),
  /** gripper pads */
  rubber: new THREE.MeshStandardMaterial({ color: '#0d0d0e', metalness: 0, roughness: 0.92 }),
  /** tablet casing */
  tabletCase: new THREE.MeshStandardMaterial({ color: '#1b1c1f', metalness: 0.85, roughness: 0.42 }),
}

export function disposeMaterials() {
  brushed.dispose()
  Object.values(materials).forEach((m) => m.dispose())
}
