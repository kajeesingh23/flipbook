# Fast Cartridge — interactive 3D handheld console

A collectible retro handheld rendered in real time with Three.js / React Three Fiber.
It is a complete object: drag it to inspect the front, back, sides, top and bottom,
operate every control, and play three games on its screen by loading the cartridges.

Repository: https://github.com/kajeesingh23/flipbook (this app is the `console/` folder)

## Requirements

- Node.js 20 or newer, npm 10 or newer
- A browser with WebGL 2

## Install and run

```bash
npm install        # install dependencies
npm run dev        # local development server (prints the URL, default http://localhost:5173)
```

## Production build

```bash
npm run build      # type-check and build to dist/
npm run preview    # serve the built dist/ locally to check it
```

`dist/` is a static site with relative asset paths, so it can be hosted from any folder
on any static host. All artwork (pixel art, fonts, labels, plastic grain) is generated at
runtime; the only bundled binary assets are the Fredoka font files.

## How to use it

### The console

| Action | Mouse / touch |
| --- | --- |
| Rotate the console | Drag the body or the background (one finger on touch). Full 360° sideways, tilts to show top and underside, keeps a little momentum on release |
| Return to the home pose | Double-click / double-tap an empty area |
| Screen brightness | Drag the metal side knob (16 detents) |
| Display power | Red slide switch on the left edge |
| Pause | Long magenta side button |
| Restart the current game | Small magenta side button |

Pressing or dragging a control never rotates the console; dragging anywhere else does.

### Cartridges and games

The console starts on the ADVENTURE title screen with all three cartridges seated.

| Cartridge | Slot | Game |
| --- | --- | --- |
| Blue | Right edge | Snake |
| Yellow | Top edge | Pong |
| Coral red | Bottom edge | Adventure (pixel platformer) |

- **Press a seated cartridge** to click it home and load its game.
- **Press the running cartridge** (or drag it out) to eject it and return to the title screen.
- **Press or push an ejected cartridge** to seat it and load its game.
- With every cartridge pulled, the screen shows `NO CART`.

### Game controls

Movement works with the smiley joystick (drag), the D-pad (press a lobe) or the keyboard.
The 3D buttons and the keys drive the same input, so a control held both ways fires once.

| Control | Keyboard | Snake | Pong | Adventure | Title screen |
| --- | --- | --- | --- | --- | --- |
| Joystick / D-pad | Arrows / WASD | Steer | Move paddle | Run left / right | Walk |
| Blue button | Z / J / Space | Hold for turbo | Hold for fast paddle | Hold to sprint | Jump |
| Yellow button | X / K | Retry after game over | Serve now / rematch | Jump, play again | Sparkle |
| Red button | C / L | Pause / resume | Pause / resume | Jump, play again | Toggle dusk |

- **Snake**: eat to grow and score; speed rises with every bite; walls and your own tail end the run.
- **Pong**: first to 5 against the CPU. The ball speeds up with every return.
- **Adventure**: run to the flag past gaps, spikes and slimes (stomp them from above). Three lives, 19 coins.

## Project structure

```
src/console
├─ ConsoleExperience.tsx      Canvas and renderer settings (one WebGL context)
├─ Scene.tsx                  Pose, reveal animation, backdrop shadow, part assembly
├─ RotationController.tsx     Grab-to-rotate, inertia, ambient float, home pose
├─ CameraController.tsx       Aspect-aware framing and cursor parallax
├─ LightingRig.tsx            Softbox key / fill / rim and matching environment
├─ InteractionController.tsx  Keyboard bridge
├─ store.ts                   Input and cartridge state shared by controls and games
├─ interaction.ts             Pointer claiming, drag and reduced-motion helpers
├─ dimensions.ts materials.ts geometry.ts textures.ts sfx.ts
├─ game/
│  ├─ GameSystem.ts           "Firmware": input merge, cartridge loading, transitions, pause
│  ├─ TitleScene.ts           ADVENTURE title screen and shared backdrop
│  ├─ Snake.ts Pong.ts Platformer.ts
│  └─ font.ts sprites.ts ui.ts types.ts crtShader.ts
└─ parts/                     ConsoleBody, BackPanel, DisplayModule, ActionButton,
                              DirectionalPad, Joystick, RotaryKnob, SideControls,
                              Cartridge, USBPort, ScrewDetails
```

Game logic is plain TypeScript with no Three.js dependency: each game exposes
`reset / update(dt, input) / draw(ctx)` and renders to one 192×128 canvas that the
display samples through a CRT shader.

## Deployment

The build is a static site, so any static host works.

- **GitHub Pages**: `.github/workflows/deploy-console.yml` builds `console/` and publishes
  it whenever `main` changes. One-time setup: in the repository go to
  *Settings → Pages → Build and deployment → Source* and choose **GitHub Actions**.
- **Vercel / Netlify**: import the repository, set the root directory to `console`,
  build command `npm run build`, output directory `dist`.

## Accessibility and motion

`prefers-reduced-motion` disables the reveal animation, idle float, cursor parallax and
rotation momentum. Short synthesized click sounds play on interaction.
