import { buildPublicMetadata } from '@/lib/seo'

export const metadata = buildPublicMetadata({
  title: 'Trader Performance Simulator',
  description:
    'Simulate your challenge pass probability across prop firms using your strategy profile, risk parameters, and live constraints.',
  path: '/simulator',
})

export default function SimulatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
