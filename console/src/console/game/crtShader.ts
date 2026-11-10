export const crtVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// Layered CRT/LCD look: barrel distortion, per-row scanlines, an RGB
// sub-pixel mask, a slow rolling band, vignette and a power-collapse effect.
// The fine structure fades out with distance (via fwidth) so it never moirés.
export const crtFragment = /* glsl */ `
uniform sampler2D map;
uniform vec2 resolution;
uniform float time;
uniform float brightness;
uniform float power;
uniform float aspect;
varying vec2 vUv;

float roundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 c = vUv - 0.5;

  // Rounded picture tube outline
  float edge = roundBox(c * vec2(aspect, 1.0), vec2(aspect, 1.0) * 0.5, 0.045);
  float inside = 1.0 - smoothstep(-0.004, 0.004, edge);

  // Subtle barrel distortion
  vec2 uv = 0.5 + c * (1.0 + 0.05 * dot(c, c));

  // Power on/off: the picture collapses to a bright horizontal line
  float open = smoothstep(0.0, 1.0, power);
  float squash = max(open * open, 0.004);
  uv.y = 0.5 + (uv.y - 0.5) / squash;
  float inPicture = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);

  // Faint horizontal wobble
  uv.x += sin(uv.y * 90.0 + time * 4.0) * 0.00035;

  // Slight chromatic fringing toward the edges
  vec2 fringe = c * 0.0025;
  vec3 col;
  col.r = texture2D(map, uv + fringe).r;
  col.g = texture2D(map, uv).g;
  col.b = texture2D(map, uv - fringe).b;

  vec2 px = uv * resolution;
  float detail = clamp(1.0 - fwidth(px.y) * 0.9, 0.0, 1.0);

  // Horizontal scanlines, one dark gap per pixel row
  float scan = 0.5 + 0.5 * cos(px.y * 6.28318);
  col *= mix(1.0, 0.62 + 0.38 * scan, detail);

  // RGB sub-pixel stripes + column gaps
  float sub = fract(px.x) * 3.0;
  vec3 mask = vec3(
    smoothstep(1.2, 0.2, abs(sub - 0.5)),
    smoothstep(1.2, 0.2, abs(sub - 1.5)),
    smoothstep(1.2, 0.2, abs(sub - 2.5))
  );
  col *= mix(vec3(1.0), 0.72 + 0.5 * mask, detail * 0.55);

  // Rolling refresh band and grain
  col *= 1.0 + 0.035 * sin(uv.y * 5.0 - time * 1.4);
  float n = fract(sin(dot(px + time, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * 0.025;

  // Vignette
  col *= 1.0 - 0.55 * dot(c, c);

  // Backlight: brightness knob + a faint lifted black so it reads as lit glass
  col = col * (0.45 + 1.0 * brightness) + vec3(0.012, 0.016, 0.02) * open;
  col *= inPicture;

  // Power-collapse flash
  col += vec3(0.9, 1.0, 1.0) * inPicture * (1.0 - open) * step(0.01, power) * 1.5;

  gl_FragColor = vec4(col * inside, 1.0);
  #include <colorspace_fragment>
}
`
