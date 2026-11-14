import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { TABLET } from './config'
import { extrudeCentered, roundedRectShape } from './geometry'
import { materials } from './materials'

const SCREEN_TEXT = 'welcome'
/** Casing rim visible around the glass. */
const RIM = 0.006
/** Black bezel between the edge of the glass and the lit display. */
const BEZEL = 0.008

/** Draws the whole glass front: bezel, sensor and the lit display with its text. */
function createScreenTexture(glassW: number, glassH: number) {
  const pxPerM = 4600
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(glassW * pxPerM)
  canvas.height = Math.round(glassH * pxPerM)
  const ctx = canvas.getContext('2d')!
  const W = canvas.width
  const H = canvas.height
  const b = BEZEL * pxPerM

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)

  // display area
  const grad = ctx.createLinearGradient(0, b, 0, H - b)
  grad.addColorStop(0, '#15181d')
  grad.addColorStop(1, '#0d0f12')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(b, b, W - 2 * b, H - 2 * b, 0.006 * pxPerM)
  ctx.fill()

  // front sensor in the side bezel
  ctx.fillStyle = '#1d222a'
  ctx.beginPath()
  ctx.arc(b / 2, H / 2, 0.0016 * pxPerM, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#f5f6f7'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `500 ${Math.round(H * 0.25)}px Inter, "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif`
  // centre on the measured glyph box so the word is optically centred
  const m = ctx.measureText(SCREEN_TEXT)
  const x = W / 2 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2
  const y = H / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2
  ctx.fillText(SCREEN_TEXT, x, y)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 16
  return tex
}

/**
 * Slim industrial tablet. Local frame: width along X, height along Y, screen
 * facing +Z, origin at the centre of the body.
 */
export function TabletDisplay() {
  const { width, height, thickness } = TABLET
  const glassW = width - 2 * RIM
  const glassH = height - 2 * RIM

  const body = useMemo(() => extrudeCentered(roundedRectShape(width, height, 0.018), thickness, 0.003, 12), [width, height, thickness])
  const texture = useMemo(() => createScreenTexture(glassW, glassH), [glassW, glassH])
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#000000',
        metalness: 0,
        roughness: 0.16,
        clearcoat: 0.6,
        clearcoatRoughness: 0.08,
        envMapIntensity: 0.1,
        emissive: '#ffffff',
        emissiveMap: texture,
        emissiveIntensity: 1.15,
      }),
    [texture],
  )
  useEffect(
    () => () => {
      body.dispose()
      texture.dispose()
      glass.dispose()
    },
    [body, texture, glass],
  )

  return (
    <group name="tablet">
      <mesh geometry={body} material={materials.tabletCase} castShadow receiveShadow />
      <mesh material={glass} position={[0, 0, thickness / 2 + 0.0003]}>
        <planeGeometry args={[glassW, glassH]} />
      </mesh>
    </group>
  )
}
