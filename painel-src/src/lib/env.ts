export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isCompact() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 820px)').matches
}

