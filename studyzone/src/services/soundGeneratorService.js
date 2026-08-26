/**
 * Sound Generator Service using 100% synthesized Web Audio API.
 * Provides zero-dependency, royalty-free, offline-ready ambient noise,
 * calm natural soundscapes (Rain, Ocean, Wind, Campfire), and focus chimes.
 */

let audioCtx = null
let currentActiveSource = null
let currentGainNode = null
let isPlayingAmbient = false
let currentPreset = 'off'
let activeSessionToken = 0

const VOLUME_STORAGE_KEY = 'studyzone_focus_ambient_volume'
const PRESET_STORAGE_KEY = 'studyzone_focus_ambient_preset'

export function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Browser autoplay restriction, will resume on user interaction
    })
  }
  return audioCtx
}

export const AMBIENT_PRESETS = [
  { id: 'off', name: 'Mute', description: 'No background audio', category: 'General' },
  { id: 'rain', name: 'Gentle Rain', description: 'Soothing rain shower masking background noise', category: 'Nature' },
  { id: 'ocean', name: 'Ocean Waves', description: 'Rhythmic tidal swells with slow calming ebb and flow', category: 'Nature' },
  { id: 'wind', name: 'Forest Wind', description: 'Deep canopy breeze through pine branches', category: 'Nature' },
  { id: 'campfire', name: 'Warm Campfire', description: 'Cozy hearth crackle and warm sub-frequencies', category: 'Nature' },
  { id: 'brown', name: 'Brown Noise', description: 'Deep, warm rumble for ADHD & coding flow', category: 'Noise' },
  { id: 'pink', name: 'Pink Noise', description: 'Balanced 1/f rainfall-like soothing frequency', category: 'Noise' },
  { id: 'white', name: 'White Noise', description: 'Crisp focus sound masking sharp distractions', category: 'Noise' },
  { id: 'solfeggio', name: '528Hz Clarity', description: 'Solfeggio transformation tone with harmonic sub-sine', category: 'Harmonic' },
  { id: 'binaural', name: '432Hz Harmonic', description: 'Calm harmonic focus tone for deep study', category: 'Harmonic' },
]

export function getSavedVolume() {
  try {
    const v = localStorage.getItem(VOLUME_STORAGE_KEY)
    return v !== null ? Math.min(1, Math.max(0, parseFloat(v))) : 0.4
  } catch {
    return 0.4
  }
}

export function saveVolume(vol) {
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(vol))
  } catch {
    // ignore
  }
}

export function getSavedPreset() {
  try {
    return localStorage.getItem(PRESET_STORAGE_KEY) || 'off'
  } catch {
    return 'off'
  }
}

export function savePreset(presetId) {
  try {
    localStorage.setItem(PRESET_STORAGE_KEY, presetId)
  } catch {
    // ignore
  }
}

// ─── Noise Buffer Generators ──────────────────────────────────────

function createBrownNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 5
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = buffer.getChannelData(0)
  let lastOut = 0.0

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    output[i] = (lastOut + 0.02 * white) / 1.02
    lastOut = output[i]
    output[i] *= 3.5
  }

  return buffer
}

function createPinkNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 5
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = buffer.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }

  return buffer
}

function createWhiteNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 5
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.25
  }

  return buffer
}

function createCampfireBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 5
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = buffer.getChannelData(0)
  let lastOut = 0.0

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    const rumble = (lastOut + 0.015 * white) / 1.02
    lastOut = rumble

    let crackle = 0
    if (Math.random() < 0.0008) {
      crackle = (Math.random() * 2 - 1) * (0.4 + Math.random() * 0.6)
    }

    output[i] = rumble * 1.6 + crackle
  }

  return buffer
}

// ─── Synchronous Audio Cleanup ────────────────────────────────────

function cleanupActiveNodesImmediately() {
  if (currentActiveSource) {
    try {
      if (typeof currentActiveSource.stop === 'function') {
        currentActiveSource.stop()
      }
      if (typeof currentActiveSource.disconnect === 'function') {
        currentActiveSource.disconnect()
      }
    } catch {
      // Ignore already stopped/disconnected nodes
    }
    currentActiveSource = null
  }

  if (currentGainNode) {
    try {
      currentGainNode.disconnect()
    } catch {
      // Ignore
    }
    currentGainNode = null
  }

  isPlayingAmbient = false
}

// ─── Sound Playback Controller ────────────────────────────────────

export function startAmbientSound(presetId, volume = 0.4) {
  // Generate unique session token to prevent race conditions
  activeSessionToken += 1
  const sessionToken = activeSessionToken

  cleanupActiveNodesImmediately()

  if (!presetId || presetId === 'off') {
    currentPreset = 'off'
    savePreset('off')
    return
  }

  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  currentPreset = presetId
  savePreset(presetId)

  const gainNode = ctx.createGain()
  const targetGain = Math.max(0.0001, Math.min(1, volume))
  gainNode.gain.setValueAtTime(targetGain, ctx.currentTime)
  gainNode.connect(ctx.destination)
  currentGainNode = gainNode

  // 1. Harmonics (432Hz Harmonic & 528Hz Solfeggio)
  if (presetId === 'binaural' || presetId === 'solfeggio') {
    const baseFreq = presetId === 'solfeggio' ? 528 : 432
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const osc3 = ctx.createOscillator()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime)

    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(baseFreq / 2, ctx.currentTime)

    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(baseFreq / 4, ctx.currentTime)

    const subGain = ctx.createGain()
    subGain.gain.setValueAtTime(0.25, ctx.currentTime)

    osc1.connect(subGain)
    osc2.connect(subGain)
    osc3.connect(subGain)
    subGain.connect(gainNode)

    osc1.start()
    osc2.start()
    osc3.start()

    currentActiveSource = {
      stop: () => {
        try {
          osc1.stop()
          osc2.stop()
          osc3.stop()
          osc1.disconnect()
          osc2.disconnect()
          osc3.disconnect()
          subGain.disconnect()
        } catch {
          // ignore
        }
      },
    }
  }

  // 2. Ocean Waves (Synthesized with periodic LFO filter swell)
  else if (presetId === 'ocean') {
    const buffer = createPinkNoiseBuffer(ctx)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(450, ctx.currentTime)
    filter.Q.setValueAtTime(3, ctx.currentTime)

    // LFO to create slow tidal swell (~0.12Hz)
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime)

    const lfoGain = ctx.createGain()
    lfoGain.gain.setValueAtTime(320, ctx.currentTime)

    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)

    source.connect(filter)
    filter.connect(gainNode)

    source.start()
    lfo.start()

    currentActiveSource = {
      stop: () => {
        try {
          source.stop()
          lfo.stop()
          source.disconnect()
          filter.disconnect()
          lfo.disconnect()
          lfoGain.disconnect()
        } catch {
          // ignore
        }
      },
    }
  }

  // 3. Forest Wind (Resonant sweeping bandpass)
  else if (presetId === 'wind') {
    const buffer = createPinkNoiseBuffer(ctx)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(400, ctx.currentTime)
    filter.Q.setValueAtTime(2.5, ctx.currentTime)

    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime)

    const lfoGain = ctx.createGain()
    lfoGain.gain.setValueAtTime(250, ctx.currentTime)

    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)

    source.connect(filter)
    filter.connect(gainNode)

    source.start()
    lfo.start()

    currentActiveSource = {
      stop: () => {
        try {
          source.stop()
          lfo.stop()
          source.disconnect()
          filter.disconnect()
          lfo.disconnect()
          lfoGain.disconnect()
        } catch {
          // ignore
        }
      },
    }
  }

  // 4. Gentle Rain (Filtered pink noise with gentle treble sheen)
  else if (presetId === 'rain') {
    const buffer = createPinkNoiseBuffer(ctx)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1400, ctx.currentTime)

    source.connect(filter)
    filter.connect(gainNode)
    source.start()

    currentActiveSource = {
      stop: () => {
        try {
          source.stop()
          source.disconnect()
          filter.disconnect()
        } catch {
          // ignore
        }
      },
    }
  }

  // 5. Warm Campfire (Low rumble + crackle impulses)
  else if (presetId === 'campfire') {
    const buffer = createCampfireBuffer(ctx)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2200, ctx.currentTime)

    source.connect(filter)
    filter.connect(gainNode)
    source.start()

    currentActiveSource = {
      stop: () => {
        try {
          source.stop()
          source.disconnect()
          filter.disconnect()
        } catch {
          // ignore
        }
      },
    }
  }

  // 6. Standard Noise Buffers (Brown, Pink, White)
  else {
    let buffer
    if (presetId === 'brown') {
      buffer = createBrownNoiseBuffer(ctx)
    } else if (presetId === 'pink') {
      buffer = createPinkNoiseBuffer(ctx)
    } else {
      buffer = createWhiteNoiseBuffer(ctx)
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(
      presetId === 'brown' ? 800 : presetId === 'pink' ? 4000 : 8000,
      ctx.currentTime,
    )

    source.connect(filter)
    filter.connect(gainNode)
    source.start()

    currentActiveSource = {
      stop: () => {
        try {
          source.stop()
          source.disconnect()
          filter.disconnect()
        } catch {
          // ignore
        }
      },
    }
  }

  if (sessionToken === activeSessionToken) {
    isPlayingAmbient = true
  }
}

export function setAmbientVolume(volume) {
  saveVolume(volume)
  if (currentGainNode && audioCtx) {
    try {
      currentGainNode.gain.cancelScheduledValues(audioCtx.currentTime)
      currentGainNode.gain.setValueAtTime(Math.max(0.0001, Math.min(1, volume)), audioCtx.currentTime)
    } catch {
      // ignore
    }
  }
}

export function stopAmbientSound() {
  activeSessionToken += 1
  cleanupActiveNodesImmediately()
}

export function isAmbientActive() {
  return isPlayingAmbient
}

export function getCurrentAmbientPreset() {
  return currentPreset
}

export function playCompletionChime() {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }

  const now = ctx.currentTime
  const frequencies = [528, 800, 1200, 1600]
  const gains = [0.4, 0.2, 0.1, 0.05]

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.995, now + 3.0)

    const initialGain = gains[idx]
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(initialGain, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 3.5)
  })
}
