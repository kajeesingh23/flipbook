import { useState } from 'react'
import { RobotScene } from './scene/RobotScene'

export default function App() {
  const [resetSignal, setResetSignal] = useState(0)
  return (
    <main className="stage">
      <RobotScene resetSignal={resetSignal} />
      <footer className="hud">
        <p className="hint">
          <span className="fine">Move to steer the arm · Drag to orbit · Scroll to zoom</span>
          <span className="coarse">One finger steers the arm · Two fingers orbit and zoom</span>
        </p>
        <button type="button" onClick={() => setResetSignal((n) => n + 1)}>
          Reset view
        </button>
      </footer>
    </main>
  )
}
