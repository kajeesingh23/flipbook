import { animated, useSpring } from '@react-spring/three'
import { useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { Vector3 } from 'three'
import type { Group } from 'three'
import { HOUSING_H, HOUSING_W, HOUSING_Z } from '../dimensions'
import { circleHole, slab } from '../geometry'
import { hover, LocalDrag } from '../interaction'
import { mat } from '../materials'
import { useConsole } from '../store'
import type { CartId } from '../store'
import { embossed, memoryLabel } from '../textures'

type Vec3 = [number, number, number]
type Props = { id: CartId; position: Vec3; axis: Vec3; travel: number; children: ReactNode }

const delta = new Vector3()
const THICK = 0.24

/**
 * A removable cartridge constrained to its slot axis. Click to eject / seat
 * it, or drag it along the slot; it always snaps to one of the two detents
 * and never leaves the slot.
 */
export function Cartridge({ id, position, axis, travel, children }: Props) {
  const root = useRef<Group>(null!)
  const drag = useMemo(() => new LocalDrag(), [])
  const startOffset = useRef(0)
  const inserted = useConsole((s) => s.carts[id])
  const setCart = useConsole((s) => s.setCart)
  const dir = useMemo(() => new Vector3(...axis), [axis])

  const [{ o }, api] = useSpring(() => ({ o: 0 }))

  // Settle into whichever detent the store says we're in.
  useEffect(() => {
    if (drag.active) return
    if (inserted) api.start({ o: 0, config: { tension: 520, friction: 20, mass: 0.8 } })
    else
      api.start({
        // Push-to-eject: a short press inward, then the latch throws it out.
        to: [
          { o: -0.035, config: { tension: 900, friction: 30 } },
          { o: travel, config: { tension: 300, friction: 14, mass: 0.8 } },
        ],
      })
  }, [inserted, travel, api, drag])

  return (
    <group ref={root} position={position}>
      <animated.group
        position-x={o.to((v) => v * dir.x)}
        position-y={o.to((v) => v * dir.y)}
        position-z={o.to((v) => v * dir.z)}
        {...hover('grab')}
        onPointerDown={(e) => {
          startOffset.current = o.get()
          drag.begin(e, root.current)
        }}
        onPointerMove={(e) => {
          const d = drag.delta(e, root.current, delta)
          if (!d || drag.travelled < 0.03) return
          const next = Math.max(-0.035, Math.min(travel, startOffset.current + d.dot(dir)))
          api.start({ o: next, immediate: true })
        }}
        onPointerUp={(e) => {
          const wasClick = drag.travelled < 0.03
          drag.end(e)
          const next = wasClick ? !inserted : o.get() < travel / 2
          if (next === inserted) api.start({ o: inserted ? 0 : travel, config: { tension: 420, friction: 20 } })
          else setCart(id, next)
        }}
        onPointerCancel={(e) => {
          drag.end(e)
          api.start({ o: inserted ? 0 : travel })
        }}
      >
        {children}
      </animated.group>
    </group>
  )
}

const TOP = { x: -0.62, w: 0.9, h: 1.3, out: 0.62 }
const SIDE = { y: 0.96, w: 1.15, h: 0.66, out: 0.42 }
const BOTTOM = { x: -0.72, w: 0.82, h: 0.95, out: 0.27 }

/** Yellow game cartridge in the top slot. Pulling it blanks the game. */
function TopCartridge() {
  const body = useMemo(() => slab(TOP.w, TOP.h, THICK, 0.15, 0.03, [circleHole(0, TOP.h / 2 - 0.15, 0.06)]), [])
  const rim = useMemo(() => slab(TOP.w - 0.12, 0.26, 0.03, 0.08, 0.012), [])
  const text = useMemo(() => embossed('fast', '#F4BB2F'), [])
  const top = HOUSING_H / 2
  return (
    <>
      <mesh position={[TOP.x, top, HOUSING_Z]} material={mat.slot}>
        <boxGeometry args={[TOP.w + 0.07, 0.012, THICK + 0.07]} />
      </mesh>
      <Cartridge id="top" position={[TOP.x, top + TOP.out - TOP.h / 2, HOUSING_Z]} axis={[0, 1, 0]} travel={0.32}>
        <mesh geometry={body} material={mat.cartYellow} castShadow receiveShadow />
        <group position={[0, TOP.h / 2 - 0.42, THICK / 2]}>
          <mesh geometry={rim} material={mat.cartYellow} position-z={0.006} />
          <mesh position-z={0.023}>
            <planeGeometry args={[0.72, 0.135]} />
            <meshStandardMaterial map={text} transparent roughness={0.45} depthWrite={false} />
          </mesh>
        </group>
      </Cartridge>
    </>
  )
}

/** Blue memory card in the right-hand slot. */
function MemoryCard() {
  const body = useMemo(() => slab(SIDE.w, SIDE.h, THICK, 0.06, 0.03), [])
  const label = useMemo(() => memoryLabel(), [])
  const right = HOUSING_W / 2
  return (
    <>
      <mesh position={[right, SIDE.y, HOUSING_Z]} material={mat.slot}>
        <boxGeometry args={[0.012, SIDE.h + 0.07, THICK + 0.07]} />
      </mesh>
      <Cartridge id="right" position={[right + SIDE.out - SIDE.w / 2, SIDE.y, HOUSING_Z]} axis={[1, 0, 0]} travel={0.26}>
        <mesh geometry={body} material={mat.cartBlue} castShadow receiveShadow />
        <mesh position={[SIDE.w / 2 - 0.12, 0, THICK / 2 + 0.002]}>
          <planeGeometry args={[0.13, 0.46]} />
          <meshStandardMaterial map={label} roughness={0.6} />
        </mesh>
      </Cartridge>
    </>
  )
}

/** Coral expansion cartridge in the bottom slot, with a moulded eject arrow. */
function BottomCartridge() {
  const body = useMemo(() => slab(BOTTOM.w, BOTTOM.h, THICK + 0.06, 0.16, 0.035), [])
  const stroke = useMemo(() => slab(0.2, 0.05, 0.03, 0.025, 0.01), [])
  const bottom = -HOUSING_H / 2
  return (
    <>
      <mesh position={[BOTTOM.x, bottom, HOUSING_Z]} material={mat.slot}>
        <boxGeometry args={[BOTTOM.w + 0.07, 0.012, THICK + 0.13]} />
      </mesh>
      <Cartridge id="bottom" position={[BOTTOM.x, bottom - BOTTOM.out + BOTTOM.h / 2, HOUSING_Z]} axis={[0, -1, 0]} travel={0.26}>
        <mesh geometry={body} material={mat.cartRed} castShadow receiveShadow />
        <group position={[0, -BOTTOM.h / 2 + 0.13, THICK / 2 + 0.035]}>
          <mesh geometry={stroke} material={mat.cartRed} position-x={-0.062} rotation-z={0.62} />
          <mesh geometry={stroke} material={mat.cartRed} position-x={0.062} rotation-z={-0.62} />
        </group>
      </Cartridge>
    </>
  )
}

export function Cartridges() {
  return (
    <>
      <TopCartridge />
      <MemoryCard />
      <BottomCartridge />
    </>
  )
}
