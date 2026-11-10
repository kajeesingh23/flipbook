import { animated, useSpring } from '@react-spring/three'
import { useMemo, useState } from 'react'
import { HOUSING_W, HOUSING_Z } from '../dimensions'
import { slab } from '../geometry'
import { capture, claim, hover, release } from '../interaction'
import { mat } from '../materials'
import { blip } from '../sfx'
import { events, useConsole } from '../store'
import { RotaryKnob } from './RotaryKnob'

/** Row of moulded ventilation slots over the speaker. */
export function SpeakerGrill({ y }: { y: number }) {
  const slot = useMemo(() => slab(0.4, 0.042, 0.02, 0.021, 0.004), [])
  return (
    <group position-y={y}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} geometry={slot} material={mat.slot} position={[0, (2.5 - i) * 0.09, 0.002]} />
      ))}
    </group>
  )
}

/** Red slide switch: powers the display on and off. */
function PowerSwitch({ y }: { y: number }) {
  const track = useMemo(() => slab(0.15, 0.42, 0.02, 0.075, 0.004), [])
  const nub = useMemo(() => slab(0.11, 0.18, 0.09, 0.05, 0.02), [])
  const power = useConsole((s) => s.power)
  const toggle = useConsole((s) => s.togglePower)
  const { pos } = useSpring({ pos: power ? 0.1 : -0.1, config: { tension: 700, friction: 24 } })
  return (
    <group position-y={y}>
      <mesh geometry={track} material={mat.slot} position-z={0.002} />
      <animated.mesh
        geometry={nub}
        material={mat.red}
        position-y={pos}
        position-z={0.03}
        castShadow
        {...hover('pointer')}
        onPointerDown={(e) => {
          claim(e)
          toggle()
        }}
      />
    </group>
  )
}

/** Magenta side button with a short spring-loaded stroke. */
function SideButton({ y, length, onPress }: { y: number; length: number; onPress: () => void }) {
  const [down, setDown] = useState(false)
  const geo = useMemo(() => slab(0.12, length, 0.08, 0.06, 0.02), [length])
  const seat = useMemo(() => slab(0.16, length + 0.04, 0.02, 0.08, 0.004), [length])
  const { z } = useSpring({ z: down ? 0.004 : 0.03, config: { tension: 800, friction: 20, mass: 0.5 } })
  return (
    <group position-y={y}>
      <mesh geometry={seat} material={mat.housingDark} position-z={0.002} />
      <animated.mesh
        geometry={geo}
        material={mat.magenta}
        position-z={z}
        castShadow
        {...hover('pointer')}
        onPointerDown={(e) => {
          capture(e)
          setDown(true)
          blip(300, 0.03, 'triangle')
          onPress()
        }}
        onPointerUp={(e) => {
          release(e)
          setDown(false)
        }}
        onPointerCancel={() => setDown(false)}
      />
    </group>
  )
}

/**
 * Everything mounted on the left edge. The group is turned so local +Z points
 * out of the side wall and local +X runs toward the front of the console.
 */
export function SideControls() {
  return (
    <>
      <group position={[-HOUSING_W / 2, 0, HOUSING_Z]} rotation-y={-Math.PI / 2}>
        <PowerSwitch y={1.5} />
        <SpeakerGrill y={0.42} />
        <RotaryKnob y={-0.52} />
        <SideButton y={-1.12} length={0.36} onPress={() => events.push({ type: 'pause' })} />
        <SideButton y={-1.5} length={0.12} onPress={() => events.push({ type: 'reset' })} />
      </group>
      {/* Right edge: second speaker below the memory-card slot */}
      <group position={[HOUSING_W / 2, 0, HOUSING_Z]} rotation-y={Math.PI / 2}>
        <SpeakerGrill y={-0.55} />
      </group>
    </>
  )
}
