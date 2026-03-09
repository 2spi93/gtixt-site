import React from 'react'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

export function Progress({ value = 0, className = '', ...props }: ProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div
      className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-gray-900 transition-all"
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </div>
  )
}
