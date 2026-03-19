'use client'

interface BadgeProps {
  variant: 'tier' | 'risk-low' | 'risk-medium' | 'risk-high' | 'region'
  children: React.ReactNode
  icon?: React.ReactNode
}

export function Badge({ variant, children, icon }: BadgeProps) {
  const badgeClass = `badge badge-${variant}`

  return (
    <span className={badgeClass}>
      {icon && <span className="inline-block">{icon}</span>}
      {children}
    </span>
  )
}

export function BadgeTier({ children }: { children: React.ReactNode }) {
  return <Badge variant="tier">{children}</Badge>
}

export function BadgeRisk({ level, children }: { level: 'low' | 'medium' | 'high'; children: React.ReactNode }) {
  return <Badge variant={`risk-${level}`}>{children}</Badge>
}

export function BadgeRegion({ children }: { children: React.ReactNode }) {
  return <Badge variant="region">{children}</Badge>
}
