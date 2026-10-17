import { flushSync } from 'react-dom'
import type { AroundNavHandler } from 'wouter'

type NavigationDirection = 'forward' | 'backward'

let viewTransitionId = 0

const getRouteLevel = (pathname: string) => pathname.split('/').filter(Boolean).length

export const viewTransitionHandler: AroundNavHandler = (navigate, to, options) => {
  const from = window.location.pathname
  const destination = new URL(to, window.location.href).pathname
  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (from === destination || !document.startViewTransition || prefersReducedMotion) {
    navigate(to, options)
    return
  }

  const direction: NavigationDirection =
    getRouteLevel(destination) < getRouteLevel(from) ? 'backward' : 'forward'
  const root = document.documentElement
  const currentTransitionId = ++viewTransitionId

  root.dataset.viewTransitionDirection = direction

  const transition = document.startViewTransition(() => {
    flushSync(() => navigate(to, options))
  })

  const clearTransitionAttributes = () => {
    if (viewTransitionId !== currentTransitionId) return
    delete root.dataset.viewTransitionDirection
  }

  transition.finished.then(clearTransitionAttributes, clearTransitionAttributes)
}
