# flipbook

Flipbook for artwork.

## Interactive retro handheld console

A real-time 3D recreation of a retro-futuristic handheld game console, built as one shared
Three.js scene with React Three Fiber. Every control is real geometry and can be operated.

The app lives in [`console/`](console).

```bash
cd console
npm install
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
```

### Controls

| Part | Pointer / touch | Keyboard | Effect |
| --- | --- | --- | --- |
| Smiley joystick | Drag (clamped to a circle, springs back) | – | Moves the hero |
| D-pad | Press a lobe | Arrows / WASD | Moves the hero |
| Blue button | Press | Z / J / Space | Jump |
| Yellow button | Press | X / K | Sparkle burst |
| Red button | Press | C / L | Toggle dusk |
| Side knob | Drag | – | Screen backlight (16 detents, hard end stops) |
| Red side switch | Click | – | Display power |
| Magenta side buttons | Press | – | Pause / reset |
| Cartridges | Click or drag along the slot | – | Eject / seat. Pulling the yellow game cartridge blanks the game |

### Structure

```
console/src/console
├─ ConsoleExperience.tsx   Canvas, renderer settings
├─ Scene.tsx               Pose, idle float, GSAP reveal, backdrop shadow
├─ CameraController.tsx    Aspect-aware framing + cursor parallax
├─ LightingRig.tsx         Softbox key / fill / rim + matching environment
├─ InteractionController.tsx  Keyboard bridge
├─ store.ts                Input state shared by controls and the game
├─ interaction.ts          Drag, pointer-capture and reduced-motion helpers
├─ dimensions.ts           Single source of truth for layout
├─ geometry.ts materials.ts textures.ts sfx.ts
├─ game/                   Pixel-art game, bitmap fonts, CRT shader
└─ parts/                  ConsoleBody, DisplayModule, ActionButton, DirectionalPad,
                           Joystick, RotaryKnob, SideControls, Cartridge, USBPort,
                           ScrewDetails
```

All artwork (pixel scene, fonts, labels, plastic grain) is generated at runtime; there are no
external model or texture assets. `prefers-reduced-motion` disables the reveal, float and parallax.
