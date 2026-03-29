'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent } from '@/lib/plausible'

function funnelStep(pathname: string) {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/rankings')) return 'rankings'
  if (pathname.startsWith('/firms/')) return 'firm_page'
  if (pathname.startsWith('/methodology')) return 'methodology'
  if (pathname.startsWith('/api-docs')) return 'api_docs'
  return null
}

export default function PublicEngagementTracker() {
  const pathname = usePathname()
  const sentDepthRef = useRef<Set<number>>(new Set())
  const trackedPathRef = useRef<string | null>(null)

  useEffect(() => {
    const currentPath = pathname ?? '/'
    if (trackedPathRef.current === currentPath) return
    trackedPathRef.current = currentPath

    const sessionKey = '__gtxt_session_id'
    let sessionId = window.localStorage.getItem(sessionKey)
    if (!sessionId) {
      sessionId = window.crypto.randomUUID()
      window.localStorage.setItem(sessionKey, sessionId)
    }

    fetch('/api/visitors/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify({
        path: currentPath,
        sessionId,
      }),
    }).catch(() => {
      // Tracking must never impact UX.
    })
  }, [pathname])

  useEffect(() => {
    const step = funnelStep(pathname ?? '')
    if (step) {
      trackEvent('public_funnel_step', {
        step,
        path: pathname ?? '/',
      })
    }

    sentDepthRef.current = new Set()

    const onScroll = () => {
      const body = document.body
      const root = document.documentElement
      const maxScroll = Math.max(body.scrollHeight, root.scrollHeight) - window.innerHeight
      if (maxScroll <= 0) return

      const ratio = Math.min(100, Math.round((window.scrollY / maxScroll) * 100))
      const milestones = [25, 50, 75]

      for (const m of milestones) {
        if (ratio >= m && !sentDepthRef.current.has(m)) {
          sentDepthRef.current.add(m)
          trackEvent('public_scroll_depth', {
            depth: m,
            path: pathname ?? '/',
          })
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const link = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!link) return

      const href = link.getAttribute('href') || ''
      if (href.startsWith('/rankings') || href.startsWith('/firms/')) {
        trackEvent('public_funnel_click', {
          href,
          from: pathname ?? '/',
        })
      }

      if (!href.startsWith('/api/')) return

      const endpointGroup = href.split('?')[0].split('/').slice(0, 4).join('/') || '/api'

      trackEvent('public_api_link_click', {
        href,
        endpoint_group: endpointGroup,
        from: pathname ?? '/',
      })
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [pathname])

  return null
}
