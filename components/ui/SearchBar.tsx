import { Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
  autoFocus?: boolean
  className?: string
  disabled?: boolean
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  autoFocus = false,
  className = '',
  disabled = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleClear = () => {
    onChange('')
    if (onClear) onClear()
    if (inputRef.current) inputRef.current.focus()
  }

  return (
    <div
      className={`relative ${className}`}
      style={{
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            color: isFocused
              ? 'var(--gtixt-turquoise-primary)'
              : 'var(--gtixt-gray-medium)',
            transition: 'color 0.2s ease',
          }}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm transition-all"
          style={{
            borderColor: isFocused
              ? 'var(--gtixt-turquoise-primary)'
              : 'var(--gtixt-gray-medium)',
            backgroundColor: 'var(--gtixt-white)',
            color: 'var(--gtixt-gray-dark)',
            boxShadow: isFocused ? '0 0 0 3px rgba(0, 172, 193, 0.1)' : 'none',
            outline: 'none',
          }}
          aria-label={placeholder}
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--gtixt-gray-light)] transition-colors"
            aria-label="Clear search"
            type="button"
          >
            <X size={14} style={{ color: 'var(--gtixt-gray-medium)' }} />
          </button>
        )}
      </div>
    </div>
  )
}
