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
      <Card className="relative overflow-hidden p-5 sm:p-6 border border-border/90 bg-surface shadow-xs">
        <div className="flex flex-col justify-between h-full space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                <Flame className="h-5 w-5 text-accent" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Instant Focus
                </span>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Ready to Focus?
                </h3>
              </div>
            </div>
            <span className="rounded-md border border-border bg-surface-raised px-2 py-0.5 text-xs font-mono font-semibold text-muted">
              25:00
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Start a 25-minute distraction-free session with ambient soundscapes. No subject, task, or setup needed — jump right into deep work.
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => handleStart(25)}
              className="gap-2 font-medium cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Start 25m Focus</span>
            </Button>

            <button
              type="button"
              onClick={() => handleStart(50)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface hover:bg-surface-raised hover:border-border-strong transition-colors text-muted hover:text-foreground cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              50m Deep Work
            </button>

            <button
              type="button"
              onClick={() => handleStart(15)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-surface hover:bg-surface-raised hover:border-border-strong transition-colors text-muted hover:text-foreground cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              15m Sprint
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
