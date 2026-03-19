'use client'

/**
 * InfoTooltip – point d'interrogation (?) qui affiche une bulle contextuelle
 * au survol (desktop) ET au clic (touch/mobile).
 *
 * Usage:
 *   <InfoTooltip content="Explanation text" />
 *   <InfoTooltip content={<>Rich <strong>content</strong></>} position="left" />
 *   <InfoTooltip content="..." className="ml-1" />
 */

import { useEffect, useRef, useState } from 'react'

type Position = 'top' | 'bottom' | 'left' | 'right'

interface InfoTooltipProps {
  /** Text or JSX shown inside the tooltip bubble */
  content: React.ReactNode
  /** Preferred position (will auto-flip if off-screen). Default: 'top' */
  position?: Position
  /** Extra className on the trigger button */
  className?: string
  /** Aria-label for the button. Defaults to "More information" */
  label?: string
  /** Optional example text shown in a highlighted box below content */
  example?: string
}

const OFFSET = 8 // px between trigger and bubble

export function InfoTooltip({
  content,
  position = 'top',
  className = '',
  label = 'More information',
  example,
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        bubbleRef.current?.contains(e.target as Node)
      )
        return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const positionClasses: Record<Position, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses: Record<Position, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[6px] border-t-[#1a3550] border-x-[6px] border-x-transparent border-b-0',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[6px] border-b-[#1a3550] border-x-[6px] border-x-transparent border-t-0',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[6px] border-l-[#1a3550] border-y-[6px] border-y-transparent border-r-0',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[6px] border-r-[#1a3550] border-y-[6px] border-y-transparent border-l-0',
  }

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={[
          'flex h-4 w-4 cursor-help items-center justify-center rounded-full',
          'border border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
          'text-[9px] font-bold leading-none',
          'transition-all duration-150',
          'hover:border-cyan-400/70 hover:bg-cyan-500/20 hover:text-cyan-200',
          'hover:shadow-[0_0_8px_rgba(34,211,238,0.3)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50',
        ].join(' ')}
      >
        ?
      </button>

      {open && (
        <div
          ref={bubbleRef}
          role="tooltip"
          className={`absolute z-[80] w-56 ${positionClasses[position]}`}
        >
          {/* Bubble */}
          <div className="rounded-xl border border-white/[0.12] bg-[#1a3550] px-3 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
            <p className="text-xs leading-relaxed text-slate-200">{content}</p>
            {example && (
              <div className="mt-2 rounded-md border border-cyan-500/20 bg-cyan-500/[0.08] px-2 py-1.5">
                <p className="text-[10px] text-slate-400 mb-0.5 font-semibold uppercase tracking-wider">
                  Example
                </p>
                <p className="text-xs text-cyan-200">{example}</p>
              </div>
            )}
          </div>
          {/* Arrow */}
          <span className={`absolute h-0 w-0 ${arrowClasses[position]}`} />
        </div>
      )}
    </span>
  )
}

export default InfoTooltip
