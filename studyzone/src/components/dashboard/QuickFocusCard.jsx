import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Flame, Play, Zap } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { fadeUp } from '../../lib/motion'

/**
 * Quick Focus component for the Dashboard Daily Action Hub.
 * Instant 1-click launcher for a 25-minute distraction-free focus session.
 * Requires NO prior subject, task, or learning plan selection.
 */
export function QuickFocusCard() {
  const navigate = useNavigate()

  function handleStart(minutes = 25) {
    navigate('/focus', { state: { autoStart: true, minutes } })
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <Card className="relative overflow-hidden p-5 sm:p-6 border-accent/30 bg-gradient-to-br from-amber-50/60 via-surface to-surface dark:from-amber-950/20 dark:via-surface dark:to-surface-raised/40 shadow-xs">
        {/* Ambient glow accent */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br from-amber-500/15 to-orange-500/10 blur-xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25">
                <Flame className="h-5 w-5 fill-white" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Instant Focus
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                  Ready to Focus?
                </h3>
              </div>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-600 dark:text-amber-400">
              25:00
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Start a 25-minute distraction-free session with ambient soundscapes. No subject, task, or setup needed — jump right into deep work.
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              size="md"
              onClick={() => handleStart(25)}
              className="gap-2 font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/25 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Start Focus</span>
            </Button>

            <button
              type="button"
              onClick={() => handleStart(50)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-border/70 hover:border-amber-500/40 hover:bg-surface-raised transition-colors text-muted hover:text-foreground cursor-pointer"
            >
              50m Deep Work
            </button>

            <button
              type="button"
              onClick={() => handleStart(15)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-border/70 hover:border-amber-500/40 hover:bg-surface-raised transition-colors text-muted hover:text-foreground cursor-pointer"
            >
              15m Sprint
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
