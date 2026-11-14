# flipbook

flipbook for artwork

## Interactive robotic arm

A procedurally modelled industrial robot arm that holds a tablet reading
"welcome" and follows the pointer using inverse kinematics.
Built with React, TypeScript, Three.js and React Three Fiber.

```bash
npm install
npm run dev      # start the dev server
npm test         # IK solver tests
npm run build    # type-check and production build
npm run package  # single shareable file: dist/robot-arm.html
```

Controls: move the pointer to steer the arm, drag to orbit, scroll to zoom,
"Reset view" to return to the default camera. On touch screens one finger
steers the arm and two fingers orbit and zoom.

### Layout

- `src/robot/config.ts` – dimensions, joint limits, workspace
- `src/robot/ik.ts` – analytic IK solver and forward kinematics (pure, tested)
- `src/robot/InverseKinematicsController.tsx` – pointer → target → damped joint drives
- `src/robot/RobotModel.tsx` – joint hierarchy: base → yaw → shoulder → elbow → wrist pitch → wrist yaw → gripper → tablet
- `src/robot/*.tsx` – one component per mechanical part
- `src/scene/` – lighting, floor, camera controls

All geometry, textures and the reflection environment are generated in code;
no external 3D assets are loaded.
