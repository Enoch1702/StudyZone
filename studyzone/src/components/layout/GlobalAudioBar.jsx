import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Headphones, Pause, Play, Volume2, VolumeX, X, Sparkles } from 'lucide-react'
import { useAudio } from '../../context/useAudio'
import { cn } from '../../lib/utils'

export function GlobalAudioBar() {
  const { ambientPreset, ambientVolume, isPlaying, presets, playPreset, setVolume, togglePlay, stop } =
    useAudio()
  const [isExpanded, setIsExpanded] = useState(false)

  if (ambientPreset === 'off' && !isPlaying) {
    return null
  }

  const currentPresetObj = presets.find((p) => p.id === ambientPreset) || {
    name: 'Ambient Sound',
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="rounded-2xl border border-purple-500/30 bg-surface-raised/95 backdrop-blur-md p-2.5 shadow-2xl ring-1 ring-purple-500/20 text-foreground"
        >
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? 'Pause ambient audio' : 'Resume ambient audio'}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Track Info & Preset Toggle */}
            <div className="min-w-0 max-w-[140px] sm:max-w-[180px]">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-left group cursor-pointer block truncate"
              >
                <div className="flex items-center gap-1.5">
                  <Headphones className="h-3 w-3 text-purple-400 shrink-0" />
                  <span className="text-xs font-bold text-foreground group-hover:text-purple-300 transition-colors truncate">
                    {currentPresetObj.name}
                  </span>
                </div>
                <p className="text-[10px] text-muted truncate">
                  {isPlaying ? 'Playing in background' : 'Paused'}
                </p>
              </button>
            </div>

            {/* Quick Volume Slider */}
            <div className="hidden sm:flex items-center gap-1.5 pl-1 border-l border-border/60">
              <button
                type="button"
                onClick={() => setVolume(ambientVolume === 0 ? 0.4 : 0)}
                className="text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                {ambientVolume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 accent-purple-400 cursor-pointer h-1.5 bg-surface rounded-lg"
              />
              <span className="text-[10px] font-mono text-muted w-7 text-right">
                {Math.round(ambientVolume * 100)}%
              </span>
            </div>

            {/* Stop / Close Button */}
            <button
              type="button"
              onClick={stop}
              title="Stop ambient audio"
              className="rounded-lg p-1 text-muted hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Expanded Sound Picker Drawer */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-border/60 space-y-2"
            >
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span className="font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  Select Soundscape
                </span>
                <span className="text-[10px]">10 offline synthesizers</span>
              </div>
              <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1">
                {presets.map((p) => {
                  const isCurrent = ambientPreset === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        playPreset(p.id)
                        if (p.id === 'off') setIsExpanded(false)
                      }}
                      className={cn(
                        'rounded-lg px-2 py-1.5 text-left text-[11px] font-medium border transition-colors cursor-pointer truncate',
                        isCurrent && p.id !== 'off'
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-surface/50 border-border/60 hover:bg-surface text-muted hover:text-foreground',
                      )}
                    >
                      {p.name}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
