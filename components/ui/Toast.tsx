import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const TOAST_STYLES = {
  success: {
    bg: 'var(--gtixt-success)',
    border: 'rgba(76, 175, 80, 0.3)',
    text: '#FFFFFF',
  },
  error: {
    bg: 'var(--gtixt-error)',
    border: 'rgba(229, 57, 53, 0.3)',
    text: '#FFFFFF',
  },
  warning: {
    bg: 'var(--gtixt-warning)',
    border: 'rgba(255, 167, 38, 0.3)',
    text: '#FFFFFF',
  },
  info: {
    bg: 'var(--gtixt-turquoise-primary)',
    border: 'rgba(0, 172, 193, 0.3)',
    text: '#FFFFFF',
  },
}

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const Icon = TOAST_ICONS[type]
  const styles = TOAST_STYLES[type]

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="card"
      style={{
        minWidth: '320px',
        maxWidth: '480px',
        borderLeftColor: styles.bg,
        borderLeftWidth: '4px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 mt-0.5"
          style={{ color: styles.bg }}
          aria-hidden="true"
        >
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[var(--gtixt-gray-dark)] mb-0.5">
            {title}
          </h4>
          {message && (
            <p className="text-xs text-[var(--gtixt-gray-medium)] leading-relaxed">
              {message}
            </p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 p-1 rounded hover:bg-[var(--gtixt-gray-light)] transition-colors"
          aria-label="Close notification"
        >
          <X size={16} className="text-[var(--gtixt-gray-medium)]" />
        </button>
      </div>
    </motion.div>
  )
}

export function ToastContainer({ 
  toasts 
}: { 
  toasts: ToastProps[] 
}) {
  return (
    <div
      className="fixed top-20 right-6 z-[9999] flex flex-col gap-3"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
