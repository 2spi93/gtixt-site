'use client'

import { useEffect } from 'react'

const CHUNK_RELOAD_COUNT_KEY = '__chunk_reload_count__'
const CHUNK_RELOAD_TS_KEY = '__chunk_reload_ts__'
const MAX_CHUNK_RECOVERY_ATTEMPTS = 3

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

const isChunkLoadError = (value: unknown) => {
  if (!value) return false
  const message =
    typeof value === 'string'
      ? value
      : (value as { message?: string })?.message || String(value)

  return (
    message.includes('ChunkLoadError') ||
    message.includes('Loading chunk') ||
    message.includes('Failed to load chunk')
  )
}

const recoverFromChunkError = () => {
  try {
    const attempts = Number.parseInt(sessionStorage.getItem(CHUNK_RELOAD_COUNT_KEY) || '0', 10) || 0
    if (attempts >= MAX_CHUNK_RECOVERY_ATTEMPTS) return

    const nextAttempt = attempts + 1
    const now = Date.now()
    sessionStorage.setItem(CHUNK_RELOAD_COUNT_KEY, String(nextAttempt))
    sessionStorage.setItem(CHUNK_RELOAD_TS_KEY, String(now))

    const url = new URL(window.location.href)
    url.searchParams.set('__chunk_retry', String(nextAttempt))
    url.searchParams.set('__chunk_ts', String(now))
    window.location.replace(url.toString())
  } catch {
    window.location.reload()
  }
}

export default function ExtensionErrorGuard() {
  useEffect(() => {
    const isNextChunkResource = (url?: string) => {
      if (!url) return false
      return url.includes('/_next/static/chunks/') || url.includes('/_next/static/')
    }

    // Suppress error events
    const onError = (event: Event) => {
      const errEvent = event as ErrorEvent
      const target = event.target as HTMLElement | null
      const scriptSrc = target instanceof HTMLScriptElement ? target.src : ''
      const linkHref = target instanceof HTMLLinkElement ? target.href : ''
      const failedUrl = scriptSrc || linkHref || errEvent.filename || ''

      if (
        isChunkLoadError(errEvent.error) ||
        isChunkLoadError(errEvent.message) ||
        isNextChunkResource(failedUrl)
      ) {
        recoverFromChunkError()
        return true
      }

      if (isExtensionNoise(errEvent.message, errEvent.filename, errEvent.error?.stack)) {
        errEvent.preventDefault()
        errEvent.stopPropagation()
        errEvent.stopImmediatePropagation()
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

      if (isChunkLoadError(reason) || isChunkLoadError(message)) {
        recoverFromChunkError()
        return true
      }

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
