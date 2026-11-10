// Tiny synthesized clicks for tactile feedback. No assets; the AudioContext is
// created lazily on the first user gesture.

let ctx: AudioContext | null = null

export function blip(freq = 440, dur = 0.05, type: OscillatorType = 'square', vol = 0.035) {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur)
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur + 0.01)
  } catch {
    // Audio is a nicety; never let it break interaction.
  }
}
