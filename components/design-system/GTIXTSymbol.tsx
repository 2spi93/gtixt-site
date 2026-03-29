type GTIXTSymbolProps = {
  size?: number
  className?: string
  animated?: boolean
}

export default function GTIXTSymbol({ size = 22, className = '', animated = false }: GTIXTSymbolProps) {
  const cls = animated ? `gx-symbol ${className}` : className

  return (
    <svg
      className={cls}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="GTIXT symbol"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer market ring */}
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeOpacity="0.85" strokeWidth="2" />

      {/* Layer arcs (concept: multi-layer governance) */}
      <path d="M11 24a13 13 0 0 1 26 0" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      <path d="M14.5 24a9.5 9.5 0 0 1 19 0" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />

      {/* Node graph */}
      <circle cx="24" cy="24" r="4" fill="currentColor" />
      <circle cx="33.5" cy="16.5" r="2" fill="currentColor" fillOpacity="0.9" />
      <circle cx="14.5" cy="31.5" r="2" fill="currentColor" fillOpacity="0.75" />
      <circle cx="35" cy="31" r="1.8" fill="currentColor" fillOpacity="0.65" />
      <path d="M24 24l9.5-7.5M24 24l-9.5 7.5M24 24l11 7" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
