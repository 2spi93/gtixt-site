export type PlausibleProps = Record<string, string | number | boolean>

type PlausibleFn = (eventName: string, options?: { props?: PlausibleProps }) => void

declare global {
  interface Window {
    plausible?: PlausibleFn
  }
}

export function trackEvent(eventName: string, props?: PlausibleProps) {
  if (typeof window === 'undefined') return
  if (!window.plausible) return

  try {
    window.plausible(eventName, props ? { props } : undefined)
  } catch {
    // Never block UI interactions due to analytics errors.
  }
}
