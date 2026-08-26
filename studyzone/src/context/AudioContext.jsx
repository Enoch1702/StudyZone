import { useState, useCallback } from 'react'
import { AudioContext } from './useAudio'
import {
  AMBIENT_PRESETS,
  getSavedPreset,
  getSavedVolume,
  startAmbientSound,
  stopAmbientSound,
  setAmbientVolume as setSynthVolume,
  playCompletionChime,
} from '../services/soundGeneratorService'

export function AudioProvider({ children }) {
  const [ambientPreset, setAmbientPresetState] = useState(() => getSavedPreset())
  const [ambientVolume, setAmbientVolumeState] = useState(() => getSavedVolume())
  const [isPlaying, setIsPlaying] = useState(false)

  const playPreset = useCallback(
    (presetId) => {
      if (!presetId || presetId === 'off') {
        stopAmbientSound()
        setAmbientPresetState('off')
        setIsPlaying(false)
        return
      }

      setAmbientPresetState(presetId)
      setIsPlaying(true)
      startAmbientSound(presetId, ambientVolume)
    },
    [ambientVolume],
  )

  const setVolume = useCallback((vol) => {
    const clamped = Math.max(0, Math.min(1, vol))
    setAmbientVolumeState(clamped)
    setSynthVolume(clamped)
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopAmbientSound()
      setIsPlaying(false)
    } else {
      const targetPreset = ambientPreset !== 'off' ? ambientPreset : 'rain'
      setAmbientPresetState(targetPreset)
      setIsPlaying(true)
      startAmbientSound(targetPreset, ambientVolume)
    }
  }, [isPlaying, ambientPreset, ambientVolume])

  const stop = useCallback(() => {
    stopAmbientSound()
    setAmbientPresetState('off')
    setIsPlaying(false)
  }, [])

  const value = {
    ambientPreset,
    ambientVolume,
    isPlaying,
    presets: AMBIENT_PRESETS,
    playPreset,
    setVolume,
    togglePlay,
    stop,
    playCompletionChime,
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}
