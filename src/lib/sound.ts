// Arcade sound set, synthesized with the Web Audio API (no audio files).
// Audio starts only after the first user gesture (mobile autoplay rule): App calls
// `unlockAudio()` on the first pointer/key press. Every sound is a no-op while muted,
// before unlock, or where Web Audio is missing. The mute choice lives in localStorage.

const MUTE_KEY = 'whomst:muted'
const MASTER_VOLUME = 0.18

// ---------- mute store ----------

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

let muted = readMuted()
const listeners = new Set<() => void>()

export function isMuted(): boolean {
  return muted
}

export function setMuted(next: boolean) {
  muted = next
  try {
    window.localStorage.setItem(MUTE_KEY, next ? '1' : '0')
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
  if (next) stopAllRolls()
  listeners.forEach((fn) => fn())
}

export function subscribeMuted(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ---------- context ----------

let ctx: AudioContext | null = null
let master: GainNode | null = null

/** Create/resume the AudioContext. Call from a user gesture. */
export function unlockAudio() {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      ctx = new Ctor()
      master = ctx.createGain()
      master.gain.value = MASTER_VOLUME
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
    master = null
  }
}

function ready(): { ac: AudioContext; out: GainNode } | null {
  if (muted || !ctx || !master || ctx.state !== 'running') return null
  return { ac: ctx, out: master }
}

interface ToneOpts {
  freq: number
  /** Seconds from now. */
  at?: number
  dur: number
  type?: OscillatorType
  gain?: number
  /** Glide to this frequency over the tone. */
  slideTo?: number
}

function tone(ac: AudioContext, out: AudioNode, o: ToneOpts) {
  const t0 = ac.currentTime + (o.at ?? 0)
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = o.type ?? 'square'
  osc.frequency.setValueAtTime(o.freq, t0)
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + o.dur)
  const peak = o.gain ?? 0.5
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur)
  osc.connect(g).connect(out)
  osc.start(t0)
  osc.stop(t0 + o.dur + 0.02)
}

let noiseBuffer: AudioBuffer | null = null
function noise(ac: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ac.sampleRate) return noiseBuffer
  const len = Math.floor(ac.sampleRate * 0.1)
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  noiseBuffer = buf
  return buf
}

// ---------- the sound set ----------

/** Short tap beep (buttons). */
export function playTap() {
  const a = ready()
  if (!a) return
  tone(a.ac, a.out, { freq: 880, dur: 0.045, gain: 0.25 })
}

/** Lock-in blip: quick rising two-note. */
export function playLockIn() {
  const a = ready()
  if (!a) return
  tone(a.ac, a.out, { freq: 660, dur: 0.07, gain: 0.35 })
  tone(a.ac, a.out, { freq: 990, at: 0.07, dur: 0.1, gain: 0.35 })
}

/** Error buzz: low falling sawtooth. */
export function playError() {
  const a = ready()
  if (!a) return
  tone(a.ac, a.out, { freq: 150, slideTo: 95, dur: 0.22, type: 'sawtooth', gain: 0.3 })
}

/** Join chime: soft two-note bell. */
export function playJoin() {
  const a = ready()
  if (!a) return
  tone(a.ac, a.out, { freq: 784, dur: 0.18, type: 'sine', gain: 0.45 })
  tone(a.ac, a.out, { freq: 1175, at: 0.1, dur: 0.3, type: 'sine', gain: 0.4 })
}

/** Fanfare: rising arpeggio ending on a held chord. */
export function playFanfare() {
  const a = ready()
  if (!a) return
  const notes = [523, 659, 784]
  notes.forEach((f, i) => tone(a.ac, a.out, { freq: f, at: i * 0.1, dur: 0.12, gain: 0.3 }))
  ;[1047, 784, 659].forEach((f) =>
    tone(a.ac, a.out, { freq: f, at: 0.32, dur: 0.6, type: 'triangle', gain: 0.35 }),
  )
}

const rolls = new Set<() => void>()
function stopAllRolls() {
  rolls.forEach((stop) => stop())
}

/** Snare drumroll for `ms`, getting louder. Returns a stop function (safe to call twice). */
export function playDrumroll(ms: number): () => void {
  const a = ready()
  if (!a || ms <= 0) return () => {}
  const { ac, out } = a
  const bus = ac.createGain()
  bus.gain.value = 1
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1800
  filter.Q.value = 0.8
  filter.connect(bus).connect(out)

  const buf = noise(ac)
  const sources: AudioBufferSourceNode[] = []
  const step = 0.055
  const total = ms / 1000
  const t0 = ac.currentTime
  for (let t = 0; t < total; t += step) {
    const src = ac.createBufferSource()
    src.buffer = buf
    const g = ac.createGain()
    const level = 0.12 + 0.3 * (t / total)
    g.gain.setValueAtTime(level, t0 + t)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + t + 0.045)
    src.connect(g).connect(filter)
    src.start(t0 + t)
    src.stop(t0 + t + 0.05)
    sources.push(src)
  }

  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    rolls.delete(stop)
    const now = ac.currentTime
    bus.gain.setValueAtTime(bus.gain.value, now)
    bus.gain.linearRampToValueAtTime(0, now + 0.05)
    sources.forEach((s) => {
      try {
        s.stop(now + 0.06)
      } catch {
        // already stopped
      }
    })
  }
  rolls.add(stop)
  window.setTimeout(() => {
    rolls.delete(stop)
    stopped = true
  }, ms + 200)
  return stop
}
