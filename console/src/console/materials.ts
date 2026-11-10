import { CanvasTexture, Color, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping } from 'three'

/** Fine moulding grain so the plastics don't read as perfectly smooth CG. */
function grainTexture() {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + Math.random() * 20
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  const tex = new CanvasTexture(c)
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.repeat.set(5, 5)
  return tex
}

const grain = grainTexture()

const plastic = (color: string, opts: Partial<ConstructorParameters<typeof MeshPhysicalMaterial>[0]> = {}) =>
  new MeshPhysicalMaterial({ color, roughness: 0.4, metalness: 0, ...opts })

export const mat = {
  /** Warm ivory injection-moulded front shell */
  ivory: plastic('#F0E7E2', {
    roughness: 0.46,
    clearcoat: 0.25,
    clearcoatRoughness: 0.45,
    bumpMap: grain,
    bumpScale: 0.35,
    sheen: 0.2,
    sheenColor: new Color('#ffe9de'),
  }),
  /** Satin blue-grey side housing */
  housing: plastic('#8D99AE', { roughness: 0.52, bumpMap: grain, bumpScale: 0.3, clearcoat: 0.1, clearcoatRoughness: 0.6 }),
  housingDark: plastic('#566074', { roughness: 0.6 }),
  slot: new MeshStandardMaterial({ color: '#1b1e26', roughness: 0.85 }),
  bezel: plastic('#0b0c0f', { roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
  glass: new MeshPhysicalMaterial({
    color: '#05070a',
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.3,
    depthWrite: false,
  }),
  metal: new MeshPhysicalMaterial({ color: '#c9ccd2', roughness: 0.28, metalness: 1 }),
  metalDark: new MeshPhysicalMaterial({ color: '#6d7078', roughness: 0.4, metalness: 1 }),
  joyBase: plastic('#1b1b1f', { roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2 }),
  rubber: plastic('#0d0d10', { roughness: 0.75 }),
  foot: plastic('#4a4a52', { roughness: 0.9 }),
  seam: new MeshStandardMaterial({ color: '#a89d97', roughness: 0.85 }),
  white: plastic('#F6F4F1', { roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
  dpad: plastic('#A9D3EE', { roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.25 }),
  magenta: plastic('#D6457F', { roughness: 0.35, clearcoat: 0.4 }),
  red: plastic('#E74732', { roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
  cartYellow: plastic('#F4BB2F', { roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.3, bumpMap: grain, bumpScale: 0.2 }),
  cartBlue: plastic('#3F63E0', { roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
  cartRed: plastic('#EC5536', { roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
  joyCap: plastic('#F7C531', { roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.12 }),
}

/** Glossy cap + darker sidewall pair for an action button. */
export function buttonMaterials(color: string, wall: string) {
  return {
    cap: plastic(color, { roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 }),
    wall: plastic(wall, { roughness: 0.38, clearcoat: 0.3 }),
  }
}
