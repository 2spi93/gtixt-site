import firmOverrides from '@/data/firm-overrides.json'
import { FIRM_COORDINATE_REGISTRY } from '@/lib/firm-coordinate-registry'
import { GLOBAL_CITY_HUBS } from '@/lib/global-city-hubs'

type FirmGeoInput = {
  id: string
  label?: string
  jurisdiction?: string
  websiteRoot?: string | null
  headquarters?: string | null
}

type FirmCoordinate = {
  latitude: number
  longitude: number
  source?: string
}

const CITY_COORDINATES: Array<{ token: string; coords: FirmCoordinate }> = [
  ...GLOBAL_CITY_HUBS.flatMap((hub) => {
    const coords = { latitude: hub.lat, longitude: hub.lon }
    return [hub.label, ...(hub.aliases || [])].map((token) => ({ token: token.toUpperCase(), coords }))
  }),
  { token: 'RAANANA', coords: { latitude: 32.1848, longitude: 34.8713 } },
  { token: 'LATINA', coords: { latitude: 41.4676, longitude: 12.9037 } },
  { token: 'AUSTIN', coords: { latitude: 30.2672, longitude: -97.7431 } },
  { token: 'BERLIN', coords: { latitude: 52.52, longitude: 13.405 } },
  { token: 'MIAMI', coords: { latitude: 25.7617, longitude: -80.1918 } },
]

const JURISDICTION_FALLBACK: Array<{ token: string; coords: FirmCoordinate }> = [
  { token: 'UNITED STATES', coords: { latitude: 39.8283, longitude: -98.5795 } },
  { token: 'USA', coords: { latitude: 39.8283, longitude: -98.5795 } },
  { token: 'US', coords: { latitude: 39.8283, longitude: -98.5795 } },
  { token: 'UNITED KINGDOM', coords: { latitude: 55.3781, longitude: -3.436 } },
  { token: 'UK', coords: { latitude: 55.3781, longitude: -3.436 } },
  { token: 'FRANCE', coords: { latitude: 46.2276, longitude: 2.2137 } },
  { token: 'GERMANY', coords: { latitude: 51.1657, longitude: 10.4515 } },
  { token: 'ITALY', coords: { latitude: 41.8719, longitude: 12.5674 } },
  { token: 'SPAIN', coords: { latitude: 40.4637, longitude: -3.7492 } },
  { token: 'ISRAEL', coords: { latitude: 31.0461, longitude: 34.8516 } },
  { token: 'UNITED ARAB EMIRATES', coords: { latitude: 23.4241, longitude: 53.8478 } },
  { token: 'UAE', coords: { latitude: 23.4241, longitude: 53.8478 } },
  { token: 'AUSTRALIA', coords: { latitude: -25.2744, longitude: 133.7751 } },
  { token: 'SINGAPORE', coords: { latitude: 1.3521, longitude: 103.8198 } },
]

const normalize = (value: string) => value.trim().toUpperCase().replace(/\s+/g, ' ')

const normalizeFirmId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

const normalizeWebsiteRoot = (value: string) =>
  normalizeFirmId(value.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''))

function findByToken(text: string, table: Array<{ token: string; coords: FirmCoordinate }>): FirmCoordinate | null {
  const normalized = normalize(text)
  const sorted = [...table].sort((a, b) => b.token.length - a.token.length)
  for (const entry of sorted) {
    if (normalized.includes(entry.token)) {
      return entry.coords
    }
  }
  return null
}

export function resolveFirmCoordinates(input: FirmGeoInput): FirmCoordinate | null {
  const overrides = firmOverrides as Record<string, { headquarters?: string; jurisdiction?: string }>
  const normalizedId = normalizeFirmId(input.id)
  const override = overrides[normalizedId]

  const registryKeys = [normalizedId, normalizeWebsiteRoot(input.websiteRoot || '')].filter(Boolean)
  for (const key of registryKeys) {
    const registryMatch = FIRM_COORDINATE_REGISTRY[key]
    if (registryMatch) {
      return {
        latitude: registryMatch.latitude,
        longitude: registryMatch.longitude,
        source: registryMatch.source,
      }
    }
  }

  const fromHeadquarters = findByToken(input.headquarters || override?.headquarters || '', CITY_COORDINATES)
  if (fromHeadquarters) return fromHeadquarters

  const fromLabel = findByToken(input.label || '', CITY_COORDINATES)
  if (fromLabel) return fromLabel

  const jurisdictionText = override?.jurisdiction || input.jurisdiction || ''
  const fromJurisdiction = findByToken(jurisdictionText, JURISDICTION_FALLBACK)
  if (fromJurisdiction) return fromJurisdiction

  return null
}
