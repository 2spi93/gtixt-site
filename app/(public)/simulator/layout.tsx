import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trader Performance Simulator - GTIXT',
  description:
    'Simulate your challenge pass probability across prop firms using your strategy profile, risk parameters, and live constraints.',
}

export default function SimulatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
