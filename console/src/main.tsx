import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/fredoka/700.css'
import './index.css'
import App from './App'

const mount = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

// The "Play" sticker and brand plate are drawn to canvas textures, so the
// display font has to be ready before the first texture is baked.
document.fonts.load('700 64px Fredoka').then(mount, mount)
