// src/lib/motion.ts
import type { TargetAndTransition, Transition, Variants } from "framer-motion";

/** Универсальный transition — без строковых ease (строки иногда ломают типы в старых версиях) */
export const trans = (delay = 0, duration = 0.45): Transition => ({
  delay,
  duration,
  ease: [0.16, 1, 0.3, 1], // cubic-bezier вместо "easeOut"
});

/** Плавный выезд вверх для initial/animate */
export const fadeUp = (delay = 0): { initial: TargetAndTransition; animate: TargetAndTransition } => ({
  initial: { y: 16, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: trans(delay) },
});

/** Для вариаций через variants + initial="hidden" animate="show" */
export const fadeVariants = (delay = 0): Variants => ({
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: trans(delay) },
});
