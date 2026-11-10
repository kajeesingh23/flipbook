import { animated, useSpring } from '@react-spring/three'
import { useMemo, useState } from 'react'
import { capProfile, latheZ } from '../geometry'
import { capture, hover, release } from '../interaction'
import { mat } from '../materials'
import { blip } from '../sfx'
import { axes, events } from '../store'

const LIMIT = 2.3 // ± radians of travel between the end stops
const STEPS = 16 // detents across the range

/**
 * Knurled metal knob with hard end stops and detents. Drag across it to
 * turn; it drives the display backlight.
 */
export function RotaryKnob({ y }: { y: number }) {
  const [step, setStep] = useState(() => Math.round(axes.brightness * STEPS))
  const drag = useMemo(() => ({ active: false, startY: 0, startX: 0, startStep: 0 }), [])
  const head = useMemo(() => latheZ(capProfile(0.118, 0.04, 0.02)), [])
  const collar = useMemo(() => latheZ(capProfile(0.18, 0.03, 0.012)), [])
  const knurl = useMemo(() => {
    const m = mat.metal.clone()
    m.flatShading = true
    m.roughness = 0.34
    return m
  }, [])

  const angle = (step / STEPS) * 2 * LIMIT - LIMIT
  const { rot } = useSpring({ rot: angle, config: { tension: 700, friction: 22, mass: 0.4 } })

  return (
    <group position-y={y}>
      <mesh geometry={collar} material={mat.metalDark} receiveShadow />
      <animated.group
        rotation-z={rot}
        {...hover('ns-resize')}
        onPointerDown={(e) => {
          capture(e)
          axes.dragging = true
          Object.assign(drag, { active: true, startY: e.clientY, startX: e.clientX, startStep: step })
        }}
        onPointerMove={(e) => {
          if (!drag.active) return
          const travel = e.clientY - drag.startY + (e.clientX - drag.startX)
          const next = Math.max(0, Math.min(STEPS, drag.startStep + Math.round(travel / 9)))
          if (next === step) return
          setStep(next)
          axes.brightness = next / STEPS
          events.push({ type: 'knob', level: axes.brightness })
          blip(900, 0.012, 'square', 0.02)
        }}
        onPointerUp={(e) => {
          release(e)
          drag.active = false
          axes.dragging = false
        }}
        onPointerCancel={() => {
          drag.active = false
          axes.dragging = false
        }}
      >
        <mesh material={knurl} position-z={0.105} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.145, 0.145, 0.15, 30]} />
        </mesh>
        <mesh geometry={head} material={mat.metal} position-z={0.18} />
        {/* Index mark so the rotation reads */}
        <mesh position={[0, 0.075, 0.221]} material={mat.slot}>
          <boxGeometry args={[0.018, 0.06, 0.004]} />
        </mesh>
      </animated.group>
    </group>
  )
}
