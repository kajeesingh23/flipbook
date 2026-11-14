// Builds the app and inlines the JS and CSS into one self-contained HTML file
// (dist/robot-arm.html) that can be shared and opened directly, no server needed.
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

execSync('npx vite build --base ./', { stdio: 'inherit' })

const assets = readdirSync('dist/assets')
const js = readFileSync(`dist/assets/${assets.find((f) => f.endsWith('.js'))}`, 'utf8')
const css = readFileSync(`dist/assets/${assets.find((f) => f.endsWith('.css'))}`, 'utf8')

let html = readFileSync('dist/index.html', 'utf8')
html = html.replace(/<script[^>]*src=[^>]*><\/script>/, '').replace(/<link[^>]*rel="stylesheet"[^>]*>/, '')
// function replacers so `$` sequences in the bundle are not treated as patterns
html = html.replace('</head>', () => `<style>${css}</style></head>`)
html = html.replace('</body>', () => `<script type="module">${js.replace(/<\/script/g, '<\\/script')}</script></body>`)

writeFileSync('dist/robot-arm.html', html)
console.log(`dist/robot-arm.html  ${(html.length / 1024).toFixed(0)} kB`)
