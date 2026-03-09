import React from 'react'

export interface SliderProps {
  value?: number[]
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  onValueChange?: (value: number[]) => void
}

export function Slider({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  className = '',
  onValueChange
}: SliderProps) {
  const current = value?.[0] ?? defaultValue?.[0] ?? min

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={current}
      disabled={disabled}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gray-900 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  )
}
