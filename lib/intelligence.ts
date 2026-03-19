export function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

export function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function riskBandFromGri(gri: number): 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL' {
  if (gri < 20) return 'LOW'
  if (gri < 40) return 'MODERATE'
  if (gri < 60) return 'ELEVATED'
  if (gri < 80) return 'HIGH'
  return 'CRITICAL'
}
