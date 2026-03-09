'use client'

import { useEffect } from 'react'

const isExtensionNoise = (message?: string, source?: string, stack?: string) => {
  const msg = (message || '').toLowerCase()
  const src = (source || '').toLowerCase()
  const stk = (stack || '').toLowerCase()
  
  return (
    src.startsWith('chrome-extension://') ||
    src.startsWith('moz-extension://') ||
    stk.includes('chrome-extension://') ||
    stk.includes('moz-extension://') ||
    msg.includes('origin not allowed') ||
    msg.includes('func sseerror') ||
    msg.includes('func sseError') ||
    msg.includes('extension context invalidated') ||
    msg.includes('inpage.js')
  )
}

export default function ExtensionErrorGuard() {
  useEffect(() => {
    // Suppress error events
    const onError = (event: ErrorEvent) => {
      if (isExtensionNoise(event.message, event.filename, event.error?.stack)) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return true
      }
    }

    // Suppress unhandled promise rejections
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message =
        typeof reason === 'string'
          ? reason
          : reason?.message || reason?.toString?.() || ''
      const stack = reason?.stack || ''

      if (isExtensionNoise(message, '', stack)) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return true
      }
    }

    // Filter console errors originating from extensions
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      const message = args.join(' ')
      const stack = new Error().stack || ''
      
      if (!isExtensionNoise(message, '', stack)) {
        originalConsoleError.apply(console, args)
      }
    }

    // Add event listeners with capture phase for earlier interception
    window.addEventListener('error', onError, true)
    window.addEventListener('unhandledrejection', onUnhandledRejection, true)

    return () => {
      window.removeEventListener('error', onError, true)
      window.removeEventListener('unhandledrejection', onUnhandledRejection, true)
      console.error = originalConsoleError
    }
  }, [])

  return null
}
