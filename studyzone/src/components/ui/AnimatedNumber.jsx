import { useEffect, useRef, useState } from 'react'

/**
 * Animated number counter.
 * Counts from 0 to `value` over `duration` ms on mount / value change.
 * Respects prefers-reduced-motion — shows final value immediately if set.
 *
 * @param {{ value: number, duration?: number, decimals?: number, suffix?: string, prefix?: string }} props
 */
export function AnimatedNumber({
  value,
  duration = 600,
  decimals = 0,
  suffix = '',
  prefix = '',
}) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef(null)
  const startTimeRef = useRef(null)
  const startValueRef = useRef(0)

  // Check prefers-reduced-motion
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (prefersReduced) return

    const from = startValueRef.current
    const to = value
    startTimeRef.current = null

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    function step(timestamp) {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + (to - from) * eased

      setDisplay(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setDisplay(to)
        startValueRef.current = to
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration, prefersReduced])

  const target = prefersReduced ? value : display
  const formatted =
    decimals > 0 ? target.toFixed(decimals) : Math.round(target).toString()

  return (
    <span aria-label={`${prefix}${value}${suffix}`} aria-live="polite">
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
