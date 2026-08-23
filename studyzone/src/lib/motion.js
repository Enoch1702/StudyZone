/**
 * Centralized animation variants for StudyZone.
 * All timing / easing values live here — one place to tune.
 *
 * Motion respects prefers-reduced-motion natively when
 * { reducedMotion: 'user' } is passed to <MotionConfig>.
 * Individual components may also check the hook themselves.
 */

/** Subtle fade + rise — general content entrance */
export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
}

/** Page-level entrance — very subtle, just prevents jarring route swaps */
export const pageEntrance = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
}

/** Container that staggers its children */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.02,
    },
  },
}

/**
 * Individual stagger child — for lists, grids.
 * Used inside a staggerContainer.
 */
export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
  },
}

/** Card entrance — used for subject cards, stat cards */
export const cardEntrance = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
}

/** Modal backdrop — fade only */
export const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } },
}

/** Modal panel — scale + opacity */
export const modalPanel = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 4,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
}

/** Inline banner — height + opacity */
export const bannerVariant = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    marginBottom: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
}

/** Check mark pop-in for Checkbox */
export const checkMark = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    transition: { duration: 0.1, ease: 'easeIn' },
  },
}

/** SVG bar — animates height from 0 to target */
export const barEntrance = (delay = 0) => ({
  hidden: { scaleY: 0, opacity: 0 },
  visible: {
    scaleY: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
  },
})
