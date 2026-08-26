/**
 * Sound Generator Service using 100% synthesized Web Audio API.
 * Provides zero-dependency, royalty-free, offline-ready ambient noise and focus chimes.
 */

let audioCtx = null
let currentNoiseNode = null
let currentGainNode = null
let isPlayingAmbient = false
let currentPreset = 'off'

const VOLUME_STORAGE_KEY = 'studyzone_focus_ambient_volume'
const PRESET_STORAGE_KEY = 'studyzone_focus_ambient_preset'

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export const AMBIENT_PRESETS = [
  { id: 'off', name: 'Mute', description: 'No background audio' },
  { id: 'brown', name: 'Brown Noise', description: 'Deep, warm rumble for deep ADHD & coding flow' },
  { id: 'pink', name: 'Pink Noise', description: 'Balanced rainfall-like soothing frequency' },
  { id: 'white', name: 'White Noise', description: 'Crisp focus sound masking background distractions' },
  { id: 'binaural', name: '432Hz Harmonic', description: 'Calm harmonic focus tone' },
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

/**
 * Creates an audio buffer with Brown Noise (integrated white noise).
 */
function createBrownNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 5
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = buffer.getChannelData(0)
  let lastOut = 0.0

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    output[i] = (lastOut + 0.02 * white) / 1.02
    lastOut = output[i]
    output[i] *= 3.5 // Gain boost for deep rumble
  }

  return buffer
}

/**
 * Creates an audio buffer with Pink Noise (1/f spectral density via Paul Kellet filter).
 */
function createPinkNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 5
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = buffer.getChannelData(0)
  let b0 = 0
  let b1 = 0
  let b2 = 0
  let b3 = 0
  let b4 = 0
  let b5 = 0
  let b6 = 0

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    b3 = 0.8665 * b3 + white * 0.3104856
    b4 = 0.55 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.016898
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }

  return buffer
}

/**
 * Creates an audio buffer with White Noise.
 */
function createWhiteNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 5
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.2
  }

  return buffer
}

/**
 * Starts synthesized ambient soundscape.
 */
export function startAmbientSound(presetId, volume = 0.4) {
  stopAmbientSound()

  if (!presetId || presetId === 'off') {
    currentPreset = 'off'
    savePreset('off')
    return
  }

  const ctx = getAudioContext()
  if (!ctx) return

  currentPreset = presetId
  savePreset(presetId)

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(0.001, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), ctx.currentTime + 0.5)
  gainNode.connect(ctx.destination)
  currentGainNode = gainNode

  if (presetId === 'binaural') {
    // Harmonic drone at 432Hz + octave 216Hz + sub 108Hz
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const osc3 = ctx.createOscillator()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(432, ctx.currentTime)

    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(216, ctx.currentTime)

    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(108, ctx.currentTime)

    const subGain = ctx.createGain()
    subGain.gain.setValueAtTime(0.3, ctx.currentTime)

    osc1.connect(subGain)
    osc2.connect(subGain)
    osc3.connect(subGain)
    subGain.connect(gainNode)

    osc1.start()
    osc2.start()
    osc3.start()

    currentNoiseNode = {
      stop: () => {
        try {
          osc1.stop()
          osc2.stop()
          osc3.stop()
          osc1.disconnect()
          osc2.disconnect()
          osc3.disconnect()
        } catch {
          // ignore
        }
      },
    }
  } else {
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

    // Lowpass filter to avoid harsh digital edges
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(presetId === 'brown' ? 800 : presetId === 'pink' ? 4000 : 8000, ctx.currentTime)

    source.connect(filter)
    filter.connect(gainNode)
    source.start()

    currentNoiseNode = source
  }

  isPlayingAmbient = true
}

/**
 * Updates the ambient volume smoothly in real time.
 */
export function setAmbientVolume(volume) {
  saveVolume(volume)
  if (currentGainNode && audioCtx) {
    currentGainNode.gain.cancelScheduledValues(audioCtx.currentTime)
    currentGainNode.gain.setValueAtTime(Math.max(0.0001, volume), audioCtx.currentTime)
  }
}

/**
 * Stops ambient sound with a gentle fade-out.
 */
export function stopAmbientSound() {
  if (!currentNoiseNode || !currentGainNode || !audioCtx) {
    isPlayingAmbient = false
    return
  }

  try {
    currentGainNode.gain.cancelScheduledValues(audioCtx.currentTime)
    currentGainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3)

    setTimeout(() => {
      if (currentNoiseNode) {
        try {
          currentNoiseNode.stop()
          currentNoiseNode.disconnect()
        } catch {
          // ignore
        }
        currentNoiseNode = null
      }
      if (currentGainNode) {
        try {
          currentGainNode.disconnect()
        } catch {
          // ignore
        }
        currentGainNode = null
      }
      isPlayingAmbient = false
    }, 350)
  } catch {
    isPlayingAmbient = false
  }
}

export function isAmbientActive() {
  return isPlayingAmbient
}

export function getCurrentAmbientPreset() {
  return currentPreset
}

/**
 * Plays a synthesized Tibetan Singing Bowl / Focus Completion Bell Chime.
 */
export function playCompletionChime() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime

  // Harmonics for a rich singing bowl: Fundamental 528Hz (Love/Focus frequency), 800Hz, 1200Hz
  const frequencies = [528, 800, 1200, 1600]
  const gains = [0.4, 0.2, 0.1, 0.05]

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)
    // Slight pitch drop creates authentic bell resonance
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
