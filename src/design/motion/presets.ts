import type { Transition, Variants } from 'motion/react'

export const motionTransition = {
  fast: { duration: 0.15, ease: [0.2, 0, 0, 1] },
  standard: { duration: 0.25, ease: [0.2, 0, 0, 1] },
  emphasized: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] },
  spring: { type: 'spring', stiffness: 360, damping: 28 },
} satisfies Record<string, Transition>

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: motionTransition.fast },
  exit: { opacity: 0, transition: motionTransition.fast },
}

export const riseVariants: Variants = {
  hidden: { opacity: 1, y: 12 },
  visible: { opacity: 1, y: 0, transition: motionTransition.standard },
  exit: { opacity: 0, y: -6, transition: motionTransition.fast },
}

export const celebrateVariants: Variants = {
  hidden: { opacity: 1, scale: 0.9, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: motionTransition.spring,
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

export const roundTransitionVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: motionTransition.emphasized,
  },
}

export const revealVariants: Variants = {
  hidden: { opacity: 1, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...motionTransition.standard, delay: 0.04 },
  },
}

export const resultSequenceVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
}

export const resultItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: motionTransition.standard },
}
