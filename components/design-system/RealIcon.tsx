import Image from 'next/image'

export type RealIconName =
  | 'home'
  | 'dashboard'
  | 'rankings'
  | 'firms'
  | 'analytics'
  | 'galaxy'
  | 'methodology'
  | 'research'
  | 'api'
  | 'shield'
  | 'agents'
  | 'copilot'
  | 'users'
  | 'jobs'
  | 'logs'
  | 'audit'
  | 'monitoring'
  | 'health'
  | 'operations'
  | 'add'
  | 'review'

const ICON_MAP: Record<RealIconName, string> = {
  home: '/assets/realistic-icons/home.png',
  dashboard: '/assets/realistic-icons/dashboard.png',
  rankings: '/assets/realistic-icons/rankings.png',
  firms: '/assets/realistic-icons/firms.png',
  analytics: '/assets/realistic-icons/analytics.png',
  galaxy: '/assets/realistic-icons/galaxy.png',
  methodology: '/assets/realistic-icons/methodology.png',
  research: '/assets/realistic-icons/research.png',
  api: '/assets/realistic-icons/api.png',
  shield: '/assets/realistic-icons/shield.png',
  agents: '/assets/realistic-icons/agents.png',
  copilot: '/assets/realistic-icons/copilot.png',
  users: '/assets/realistic-icons/users.png',
  jobs: '/assets/realistic-icons/jobs.png',
  logs: '/assets/realistic-icons/logs.png',
  audit: '/assets/realistic-icons/audit.png',
  monitoring: '/assets/realistic-icons/monitoring.png',
  health: '/assets/realistic-icons/health.png',
  operations: '/assets/realistic-icons/operations.png',
  add: '/assets/realistic-icons/add.png',
  review: '/assets/realistic-icons/review.png',
}

interface RealIconProps {
  name: RealIconName
  size?: number
  className?: string
  alt?: string
}

export function RealIcon({
  name,
  size = 18,
  className = '',
  alt,
}: RealIconProps) {
  return (
    <Image
      src={ICON_MAP[name]}
      alt={alt || name}
      width={size}
      height={size}
      className={`inline-block select-none ${className}`}
      unoptimized
    />
  )
}
