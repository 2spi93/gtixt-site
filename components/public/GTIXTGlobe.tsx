'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import countries10m from 'world-atlas/countries-10m.json'
import countries50m from 'world-atlas/countries-50m.json'
import { feature, mesh } from 'topojson-client'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GLOBAL_CITY_HUBS } from '@/lib/global-city-hubs'

export type ActiveLayer = 'risk' | 'liquidity' | 'transparency' | 'growth'
export type RegimeMode = 'stable' | 'stress' | 'instability'
export type GlobeLinkType = 'jurisdiction' | 'risk-cluster' | 'warning-signal'
export type LabelTone = 'institutional' | 'demonstrative'

type GlobeNode = {
  id: string
  label: string
  score?: number
  riskIndex?: number
  currentRiskIndex?: number
  currentEarlyWarning?: boolean
  periodDelta?: number
  risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  region?: string
  country?: string
  headquarters?: string
  latitude?: number
  longitude?: number
  modelType?: string
  payoutReliability?: number
  operationalStability?: number
  foundedPeriod?: string | null
  sunsetPeriod?: string | null
  foundedYear?: number | null
  sunsetYear?: number | null
}

type GlobeLink = {
  source: string
  target: string
  type?: GlobeLinkType
}

type RuntimeGraphData = {
  nodes: GlobeNode[]
  links: GlobeLink[]
}

type GTIXTGlobeProps = {
  runtimeGraph: RuntimeGraphData
  activeLayer?: ActiveLayer
  regimeMode?: RegimeMode
  timelineLabel?: string
  riskShockEnabled?: boolean
  sectorPulseEnabled?: boolean
  collapseSimulationEnabled?: boolean
  collapseSeedId?: string | null
  collapseComparisonEnabled?: boolean
  collapseComparisonSeedId?: string | null
  collapsePropagationDepth?: number
  collapseIntensity?: number
  collapsePlaybackRunning?: boolean
  collapsePlaybackSpeed?: number
  collapsePlaybackStepSignal?: number
  collapsePlaybackResetSignal?: number
  autoTourEnabled?: boolean
  executiveClarityEnabled?: boolean
  labelTone?: LabelTone
  selectedFirmId?: string | null
  selectedLinkPair?: { source: string; target: string } | null
  onFirmSelect?: (id: string) => void
  onLinkSelect?: (source: string, target: string, type?: GlobeLinkType) => void
  onRenderError?: (reason: string) => void
  onRenderReady?: () => void
  /** Called every ~60 frames with current FPS, frame time and draw calls. */
  onPerfSample?: (fps: number, frameTimeMs: number, drawCalls: number) => void
}

type HoverCardState = {
  nodeId: string
  x: number
  y: number
  pinned?: boolean
}

const SECTOR_COLORS: Record<string, string> = {
  FUTURES: '#7cfcff',
  FOREX: '#4f8cff',
  CRYPTO: '#ff4fd8',
  UNKNOWN: '#9ca3af',
}

const REGION_HALO_COLORS: Record<string, [number, number, number]> = {
  USA: [0.27, 0.53, 1],
  EU: [0.2, 0.8, 0.53],
  UAE: [1, 0.53, 0.2],
  Australia: [0.2, 0.87, 0.8],
}

const GEO_ZONE_COLORS: Record<'NA' | 'EU' | 'ASIA' | 'MIDDLE_EAST' | 'LATAM', string> = {
  NA: '#4ea3ff',
  EU: '#45e6a1',
  ASIA: '#ff8b4d',
  MIDDLE_EAST: '#f6c744',
  LATAM: '#d374ff',
}

const REGION_ANCHORS: Record<string, { lat: number; lon: number; latSpread: number; lonSpread: number }> = {
  USA: { lat: 38, lon: -97, latSpread: 14, lonSpread: 22 },
  NA: { lat: 41, lon: -99, latSpread: 16, lonSpread: 28 },
  EU: { lat: 50, lon: 10, latSpread: 12, lonSpread: 20 },
  EUROPE: { lat: 50, lon: 10, latSpread: 12, lonSpread: 20 },
  UAE: { lat: 24, lon: 54, latSpread: 6, lonSpread: 9 },
  MIDDLE_EAST: { lat: 27, lon: 45, latSpread: 10, lonSpread: 16 },
  ASIA: { lat: 28, lon: 102, latSpread: 20, lonSpread: 26 },
  AUSTRALIA: { lat: -26, lon: 134, latSpread: 11, lonSpread: 16 },
  LATAM: { lat: -14, lon: -60, latSpread: 20, lonSpread: 24 },
  AFRICA: { lat: 3, lon: 20, latSpread: 24, lonSpread: 24 },
  GLOBAL: { lat: 6, lon: 18, latSpread: 30, lonSpread: 46 },
}

const GEOGRAPHIC_LABELS: Array<{
  color?: string
  label: string
  lat: number
  lon: number
  maxDistance: number
  scale: [number, number]
  type: 'country' | 'capital' | 'region'
}> = [
  { type: 'region', label: 'North America', lat: 41, lon: -101, maxDistance: 5.8, scale: [0.54, 0.11], color: '#cfe8ff' },
  { type: 'region', label: 'Europe', lat: 51, lon: 8, maxDistance: 5.6, scale: [0.42, 0.11], color: '#d8ffe9' },
  { type: 'region', label: 'Middle East', lat: 27, lon: 46, maxDistance: 5.4, scale: [0.5, 0.11], color: '#ffe7b3' },
  { type: 'region', label: 'Asia-Pacific', lat: 24, lon: 112, maxDistance: 5.8, scale: [0.5, 0.11], color: '#ffd8c4' },
  { type: 'region', label: 'Latin America', lat: -17, lon: -60, maxDistance: 5.8, scale: [0.56, 0.11], color: '#efd4ff' },
  { type: 'country', label: 'United States', lat: 38, lon: -97, maxDistance: 4.8, scale: [0.48, 0.1], color: '#d7ecff' },
  { type: 'country', label: 'United Kingdom', lat: 54, lon: -2, maxDistance: 4.5, scale: [0.52, 0.1], color: '#d7ecff' },
  { type: 'country', label: 'France', lat: 46.2, lon: 2.2, maxDistance: 4.4, scale: [0.31, 0.095], color: '#e2f7ff' },
  { type: 'country', label: 'Germany', lat: 51, lon: 10, maxDistance: 4.4, scale: [0.35, 0.095], color: '#e2f7ff' },
  { type: 'country', label: 'United Arab Emirates', lat: 24.3, lon: 54.4, maxDistance: 4.3, scale: [0.72, 0.1], color: '#fff0c8' },
  { type: 'country', label: 'Australia', lat: -25.5, lon: 134, maxDistance: 4.7, scale: [0.42, 0.1], color: '#dffbff' },
  { type: 'country', label: 'Singapore', lat: 1.35, lon: 103.82, maxDistance: 4.2, scale: [0.34, 0.092], color: '#ffe3cf' },
  { type: 'country', label: 'Japan', lat: 36.2, lon: 138.2, maxDistance: 4.2, scale: [0.28, 0.092], color: '#ffe1d7' },
  { type: 'country', label: 'Hong Kong', lat: 22.3, lon: 114.17, maxDistance: 4.1, scale: [0.34, 0.092], color: '#ffe1d7' },
  { type: 'capital', label: 'Washington', lat: 38.9072, lon: -77.0369, maxDistance: 3.9, scale: [0.28, 0.085], color: '#f6fbff' },
  { type: 'capital', label: 'London', lat: 51.5072, lon: -0.1276, maxDistance: 3.8, scale: [0.22, 0.085], color: '#f6fbff' },
  { type: 'capital', label: 'Paris', lat: 48.8566, lon: 2.3522, maxDistance: 3.8, scale: [0.18, 0.082], color: '#f6fbff' },
  { type: 'capital', label: 'Berlin', lat: 52.52, lon: 13.405, maxDistance: 3.8, scale: [0.2, 0.082], color: '#f6fbff' },
  { type: 'capital', label: 'Abu Dhabi', lat: 24.4539, lon: 54.3773, maxDistance: 3.7, scale: [0.3, 0.082], color: '#fff4dc' },
  { type: 'capital', label: 'Canberra', lat: -35.2809, lon: 149.13, maxDistance: 3.8, scale: [0.26, 0.082], color: '#f6fbff' },
  { type: 'capital', label: 'Tokyo', lat: 35.6762, lon: 139.6503, maxDistance: 3.7, scale: [0.2, 0.082], color: '#ffe7dd' },
  { type: 'capital', label: 'Singapore', lat: 1.3521, lon: 103.8198, maxDistance: 3.6, scale: [0.24, 0.082], color: '#fff0e6' },
]

const LAYER_LEGEND: Record<ActiveLayer, { items: { color: string; label: string }[]; title: string }> = {
  risk: {
    title: 'Risk Band',
    items: [
      { color: '#ff4d4d', label: 'Critical' },
      { color: '#ff8a3d', label: 'High' },
      { color: '#3dd5ff', label: 'Medium' },
      { color: '#5bffcf', label: 'Low' },
    ],
  },
  liquidity: {
    title: 'Payout Reliability',
    items: [
      { color: '#ff4466', label: 'Low payout' },
      { color: '#00ffcc', label: 'High payout' },
    ],
  },
  transparency: {
    title: 'Operational Stability',
    items: [
      { color: '#ff8833', label: 'Low stability' },
      { color: '#33eedd', label: 'High stability' },
    ],
  },
  growth: {
    title: 'GTIXT Score',
    items: [
      { color: '#1133cc', label: 'Low score' },
      { color: '#ffcc00', label: 'High score' },
    ],
  },
}

const RELATION_LEGEND: Array<{ color: string; description: string; label: string; type: GlobeLinkType }> = [
  { type: 'jurisdiction', label: 'Regulatory Mesh', description: 'Shared jurisdiction', color: '#70c8ff' },
  { type: 'risk-cluster', label: 'Risk Cluster', description: 'Shared systemic pattern', color: '#ffb35c' },
  { type: 'warning-signal', label: 'Warning Lattice', description: 'Early warning coupling', color: '#ff6fc4' },
]

function relationTypeStyle(type?: GlobeLinkType) {
  if (type === 'jurisdiction') {
    return { color: '#d9ebff', opacity: 0.64, particleScale: 0.88 }
  }
  if (type === 'warning-signal') {
    return { color: '#9dd7ff', opacity: 0.72, particleScale: 0.96 }
  }
  return { color: '#b8ddff', opacity: 0.68, particleScale: 0.92 }
}

function hashCode(input: string): number {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const latRad = toRad(clamp(lat, -89.5, 89.5))
  const lonRad = toRad(clamp(lon, -180, 180))
  // Three.js SphereGeometry UV: u=0→phi=0→-X (lon=-180), u=0.5→phi=π→+X (lon=0).
  // Sphere vertex z = +r·sin(phi)·sin(θ) = +r·sin(lonRad+π)·… = -r·sin(lonRad)·…
  // Z must be NEGATED relative to a naive spherical formula to align with the texture.
  return new THREE.Vector3(
    radius * Math.cos(latRad) * Math.cos(lonRad),
    radius * Math.sin(latRad),
    -radius * Math.cos(latRad) * Math.sin(lonRad)
  )
}

function inferAnchorKey(node: GlobeNode): string {
  const region = String(node.region || '').trim().toUpperCase()
  if (region && REGION_ANCHORS[region]) return region

  const country = String(node.country || '').trim().toUpperCase()
  if (country === 'US' || country === 'USA') return 'USA'
  if (country === 'GB' || country === 'UK' || country === 'FR' || country === 'DE' || country === 'IT' || country === 'ES') return 'EU'
  if (country === 'AE' || country === 'UAE' || country === 'SA' || country === 'QA' || country === 'KW') return 'MIDDLE_EAST'
  if (country === 'AU' || country === 'NZ') return 'AUSTRALIA'
  if (country === 'BR' || country === 'MX' || country === 'AR' || country === 'CO' || country === 'CL' || country === 'PE') return 'LATAM'
  if (country === 'IN' || country === 'CN' || country === 'JP' || country === 'KR' || country === 'SG' || country === 'HK') return 'ASIA'

  const text = `${node.label} ${node.headquarters || ''}`.toUpperCase()
  if (/(DUBAI|ABU DHABI|DOHA|RIYADH)/.test(text)) return 'MIDDLE_EAST'
  if (/(LONDON|PARIS|BERLIN|MADRID|MILAN|ROME|AMSTERDAM)/.test(text)) return 'EU'
  if (/(NEW YORK|CHICAGO|MIAMI|LOS ANGELES|DALLAS|TORONTO)/.test(text)) return 'NA'
  if (/(SYDNEY|MELBOURNE|PERTH|AUSTRALIA)/.test(text)) return 'AUSTRALIA'
  if (/(SAO PAULO|MEXICO CITY|BUENOS AIRES|LATAM)/.test(text)) return 'LATAM'
  if (/(SINGAPORE|TOKYO|HONG KONG|MUMBAI|SEOUL|SHANGHAI)/.test(text)) return 'ASIA'

  return 'GLOBAL'
}

function resolveNodeLatLon(node: GlobeNode): { lat: number; lon: number } {
  if (typeof node.latitude === 'number' && typeof node.longitude === 'number') {
    return {
      lat: clamp(node.latitude, -89.5, 89.5),
      lon: clamp(node.longitude, -180, 180),
    }
  }

  const anchor = REGION_ANCHORS[inferAnchorKey(node)] || REGION_ANCHORS.GLOBAL
  const seedA = hashCode(`${node.id}:lat`)
  const seedB = hashCode(`${node.id}:lon`)
  const latJitter = (((seedA % 1000) / 1000) - 0.5) * anchor.latSpread * 2
  const lonJitter = (((seedB % 1000) / 1000) - 0.5) * anchor.lonSpread * 2
  return {
    lat: clamp(anchor.lat + latJitter, -80, 80),
    lon: clamp(anchor.lon + lonJitter, -180, 180),
  }
}

function nodeToSpherePosition(node: GlobeNode, radius: number): THREE.Vector3 {
  const { lat, lon } = resolveNodeLatLon(node)
  return latLonToVector3(lat, lon, radius)
}

function geodesicArcPoints(start: THREE.Vector3, end: THREE.Vector3, segments: number, baseRadius: number): THREE.Vector3[] {
  const a = start.clone().normalize()
  const b = end.clone().normalize()
  const dot = clamp(a.dot(b), -1, 1)
  const omega = Math.acos(dot)
  const sinOmega = Math.sin(omega)

  if (sinOmega < 0.0001) {
    return [start.clone(), end.clone()]
  }

  const angularDistance = omega
  const maxLift = 0.08 + angularDistance * 0.22
  const points: THREE.Vector3[] = []
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments
    const s0 = Math.sin((1 - t) * omega) / sinOmega
    const s1 = Math.sin(t * omega) / sinOmega
    const dir = a.clone().multiplyScalar(s0).add(b.clone().multiplyScalar(s1)).normalize()
    const lift = Math.sin(Math.PI * t) * maxLift
    points.push(dir.multiplyScalar(baseRadius + lift))
  }
  return points
}

type EarthTextureSet = {
  diffuse: THREE.CanvasTexture
  normal: THREE.CanvasTexture
  specular: THREE.CanvasTexture
  bump: THREE.CanvasTexture
}

const GEOGRAPHIC_LABEL_SUBTITLES: Record<string, string> = {
  'North America': 'Regulatory Hub',
  'Europe': 'Governance Zone',
  'Middle East': 'Trading Center',
  'Asia-Pacific': 'Growth Markets',
  'Latin America': 'Emerging',
  'United States': 'US Markets',
  'United Kingdom': 'London Hub',
  'United Arab Emirates': 'Dubai · Abu Dhabi',
  'Australia': 'Pacific Hub',
  'Singapore': 'SEA Gateway',
  'Japan': 'APAC Finance',
  'Hong Kong': 'HK Exchange',
}

function createRichTextSprite(
  title: string,
  options: {
    type?: 'region' | 'country' | 'capital' | 'cluster' | 'firm'
    subtitle?: string
    color?: string
    tone?: LabelTone
  } = {}
): THREE.CanvasTexture {
  const { type = 'country', subtitle, color, tone = 'institutional' } = options
  // Logical canvas size (world-space units stay the same — only pixel density improves)
  const logW = 256
  const logH = 64
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
  const canvas = document.createElement('canvas')
  canvas.width = logW * dpr
  canvas.height = logH * dpr
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, logW, logH)

  // Frosted glass pill background
  const bgAlpha = tone === 'institutional'
    ? (type === 'region' ? 0.42 : type === 'capital' ? 0.54 : 0.58)
    : (type === 'region' ? 0.5 : type === 'capital' ? 0.62 : 0.66)
  ctx.fillStyle = `rgba(5, 11, 21, ${bgAlpha})`
  ctx.beginPath()
  ctx.roundRect(5, 5, logW - 10, logH - 10, 9)
  ctx.fill()

  // Subtle border — color-coded by type
  const borderAlpha = tone === 'institutional'
    ? (type === 'firm' ? 0.26 : type === 'region' ? 0.14 : 0.12)
    : (type === 'firm' ? 0.34 : type === 'region' ? 0.2 : 0.16)
  ctx.strokeStyle =
    type === 'firm' ? `rgba(255,200,70,${borderAlpha})` :
    type === 'region' ? `rgba(100,200,255,${borderAlpha})` :
    type === 'cluster' ? `rgba(180,150,255,${borderAlpha})` :
    type === 'capital' ? `rgba(160,210,255,${borderAlpha})` :
    `rgba(140,180,220,${borderAlpha})`
  ctx.lineWidth = 0.7
  ctx.stroke()

  // Title font stack — matches Apple / Linear / Vercel aesthetic
  const titleSizeBase = type === 'region' ? 16 : type === 'capital' ? 12 : type === 'cluster' ? 13 : 14
  const titleSize = tone === 'institutional' ? Math.max(11, titleSizeBase - 1) : titleSizeBase
  const weight = tone === 'institutional'
    ? (type === 'region' ? '600' : type === 'firm' ? '500' : '450')
    : (type === 'region' ? '700' : type === 'firm' ? '600' : '500')
  ctx.font = `${weight} ${titleSize}px -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const resolvedColor = color || (
    type === 'firm' ? '#fef3c7' :
    type === 'cluster' ? '#ddd0ff' :
    type === 'capital' ? '#e8f4ff' :
    type === 'region' ? '#c8e8ff' :
    '#d8eaff'
  )

  // Drop shadow for depth
  ctx.shadowColor = 'rgba(0,0,0,0.9)'
  ctx.shadowBlur = tone === 'institutional' ? 3 : 5
  ctx.shadowOffsetY = 1

  const showSub = !!subtitle
  const titleY = showSub ? logH * 0.36 : logH / 2

  // Region type: uppercase tracking
  if (type === 'region') {
    ctx.letterSpacing = '0.06em'
    ctx.lineWidth = tone === 'institutional' ? 1.2 : 2.1
    ctx.strokeStyle = tone === 'institutional' ? 'rgba(16,28,44,0.42)' : 'rgba(16,28,44,0.58)'
    ctx.strokeText(title.toUpperCase(), logW / 2, titleY)
    ctx.fillStyle = resolvedColor
    ctx.fillText(title.toUpperCase(), logW / 2, titleY)
    ctx.letterSpacing = '0'
  } else {
    ctx.lineWidth = tone === 'institutional' ? 1 : 1.9
    ctx.strokeStyle = tone === 'institutional' ? 'rgba(12,20,32,0.36)' : 'rgba(12,20,32,0.52)'
    ctx.strokeText(title, logW / 2, titleY)
    ctx.fillStyle = resolvedColor
    ctx.fillText(title, logW / 2, titleY)
  }

  if (showSub) {
    ctx.shadowBlur = 2
    ctx.shadowOffsetY = 0
    const subSize = titleSize - 4
    ctx.font = `400 ${subSize}px -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif`
    ctx.fillStyle =
      type === 'region' ? 'rgba(150,200,255,0.58)' :
      type === 'firm' ? (tone === 'institutional' ? 'rgba(240,180,60,0.58)' : 'rgba(240,180,60,0.68)') :
      (tone === 'institutional' ? 'rgba(130,165,200,0.48)' : 'rgba(130,165,200,0.58)')
    ctx.fillText(subtitle, logW / 2, logH * 0.70)
  }

  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function collectGeoLineStrings(shape: any): number[][][] {
  if (!shape) return []
  if (shape.type === 'Feature') return collectGeoLineStrings(shape.geometry)
  if (shape.type === 'FeatureCollection') return shape.features.flatMap((item: any) => collectGeoLineStrings(item))
  if (shape.type === 'LineString') return [shape.coordinates]
  if (shape.type === 'MultiLineString') return shape.coordinates
  if (shape.type === 'Polygon') return shape.coordinates
  if (shape.type === 'MultiPolygon') return shape.coordinates.flat()
  if (shape.type === 'GeometryCollection') return shape.geometries.flatMap((item: any) => collectGeoLineStrings(item))
  return []
}

function createGeoLineGroup(
  shape: any,
  radius: number,
  materialFactory: (index: number) => THREE.LineBasicMaterial
): THREE.Group {
  const group = new THREE.Group()
  const lineStrings = collectGeoLineStrings(shape)
  lineStrings.forEach((lineString, index) => {
    if (!Array.isArray(lineString) || lineString.length < 2) return
    const points = lineString.map(([lon, lat]) => latLonToVector3(lat, lon, radius))
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, materialFactory(index))
    group.add(line)
  })
  return group
}

function createFallbackEarthTextureSet(topology?: any): EarthTextureSet {
  const size = 1024
  const makeCanvas = () => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size / 2
    const context = canvas.getContext('2d')
    return { canvas, context }
  }

  // Political map canvas — equirectangular projection from topojson (2048×1024).
  // When topology is provided this renders real country fills, borders and coastlines.
  // Used as the fallback diffuse texture until the real earth_diffuse.jpg loads.
  const pmW = 2048, pmH = 1024
  const politicalCanvas = document.createElement('canvas')
  politicalCanvas.width = pmW
  politicalCanvas.height = pmH
  const diffuseLayer = { canvas: politicalCanvas }
  const dc = politicalCanvas.getContext('2d')
  if (dc) {
    const ocean = dc.createLinearGradient(0, 0, 0, pmH)
    ocean.addColorStop(0,    '#0b2547')
    ocean.addColorStop(0.38, '#091d3a')
    ocean.addColorStop(0.62, '#091d3a')
    ocean.addColorStop(1,    '#06142a')
    dc.fillStyle = ocean
    dc.fillRect(0, 0, pmW, pmH)

    // Equirectangular projection: lon→x, lat→y
    const projPt = (lon: number, lat: number): [number, number] => [
      ((lon + 180) / 360) * pmW,
      ((90 - lat) / 180) * pmH,
    ]

    // Trace a coordinate ring, restarting sub-paths at antimeridian crossings
    const traceRing = (ring: number[][]) => {
      let prevLon = ring[0]?.[0] ?? 0
      ring.forEach(([lon, lat]: number[], i: number) => {
        const [x, y] = projPt(lon, lat)
        if (i === 0 || Math.abs(lon - prevLon) > 180) dc.moveTo(x, y)
        else dc.lineTo(x, y)
        prevLon = lon
      })
      dc.closePath()
    }

    if (topology) {
      const FILL_COLORS = [
        '#1b3e24','#1e4428','#172e1d','#20422a','#19361f',
        '#1d4027','#214525','#163020','#1f3f2a','#1b3c22',
        '#2b4d32','#173422','#213f28','#1c3d25','#244628',
      ]
      const countriesGeo = feature(topology, topology.objects.countries) as any
      // Country fills
      countriesGeo.features.forEach((f: any, idx: number) => {
        const geom = f.geometry
        if (!geom) return
        dc.beginPath()
        if (geom.type === 'Polygon') {
          geom.coordinates.forEach(traceRing)
        } else if (geom.type === 'MultiPolygon') {
          ;(geom.coordinates as number[][][][]).forEach((poly: number[][][]) => poly.forEach(traceRing))
        }
        dc.fillStyle = FILL_COLORS[idx % FILL_COLORS.length]
        dc.fill('evenodd')
      })
      // Internal country borders
      dc.strokeStyle = '#325e38'
      dc.lineWidth = 0.45
      dc.globalAlpha = 0.7
      countriesGeo.features.forEach((f: any) => {
        const geom = f.geometry
        if (!geom) return
        dc.beginPath()
        if (geom.type === 'Polygon') {
          geom.coordinates.forEach(traceRing)
        } else if (geom.type === 'MultiPolygon') {
          ;(geom.coordinates as number[][][][]).forEach((poly: number[][][]) => poly.forEach(traceRing))
        }
        dc.stroke()
      })
      dc.globalAlpha = 1
      // Coastline highlight
      const landGeo = feature(topology, topology.objects.land) as any
      const traceGeom = (geom: any) => {
        if (!geom) return
        if (geom.type === 'Polygon') {
          dc.beginPath(); geom.coordinates.forEach(traceRing); dc.stroke()
        } else if (geom.type === 'MultiPolygon') {
          ;(geom.coordinates as number[][][][]).forEach((poly: number[][][]) => {
            dc.beginPath(); poly.forEach(traceRing); dc.stroke()
          })
        } else if (geom.type === 'GeometryCollection') {
          geom.geometries.forEach(traceGeom)
        }
      }
      dc.strokeStyle = '#bcd8ee'
      dc.lineWidth = 0.85
      dc.globalAlpha = 0.52
      if (landGeo.type === 'Feature') traceGeom(landGeo.geometry)
      else if (landGeo.type === 'FeatureCollection') landGeo.features.forEach((f: any) => traceGeom(f.geometry))
      else traceGeom(landGeo)
      dc.globalAlpha = 1
    } else {
      // Rough continent ellipse last-resort fallback (no topology available)
      dc.fillStyle = '#2a5236'
      ;[[pmW*0.15,pmH*0.38,105,155],[pmW*0.35,pmH*0.33,135,165],
        [pmW*0.53,pmH*0.3,155,115],[pmW*0.68,pmH*0.33,195,135],
        [pmW*0.87,pmH*0.38,90,62]].forEach(([x,y,w,h]) => {
        dc.beginPath(); dc.ellipse(x, y, w, h, 0, 0, Math.PI*2); dc.fill()
      })
    }
  }

  const bumpLayer = makeCanvas()
  if (bumpLayer.context) {
    const context = bumpLayer.context
    const gradient = context.createLinearGradient(0, 0, bumpLayer.canvas.width, bumpLayer.canvas.height)
    gradient.addColorStop(0, '#515151')
    gradient.addColorStop(1, '#7f7f7f')
    context.fillStyle = gradient
    context.fillRect(0, 0, bumpLayer.canvas.width, bumpLayer.canvas.height)
    context.fillStyle = '#a7a7a7'
    for (let i = 0; i < 2800; i += 1) {
      const x = (i * 37) % bumpLayer.canvas.width
      const y = (i * 73) % bumpLayer.canvas.height
      const s = 1 + ((i * 19) % 3)
      context.fillRect(x, y, s, s)
    }
  }

  const normalLayer = makeCanvas()
  if (normalLayer.context) {
    const context = normalLayer.context
    context.fillStyle = '#8080ff'
    context.fillRect(0, 0, normalLayer.canvas.width, normalLayer.canvas.height)
    context.fillStyle = '#7f8cff'
    for (let i = 0; i < 3800; i += 1) {
      const x = (i * 53) % normalLayer.canvas.width
      const y = (i * 89) % normalLayer.canvas.height
      context.fillRect(x, y, 2, 2)
    }
  }

  const specularLayer = makeCanvas()
  if (specularLayer.context) {
    const context = specularLayer.context
    context.fillStyle = '#c8c8c8'
    context.fillRect(0, 0, specularLayer.canvas.width, specularLayer.canvas.height)
    context.fillStyle = '#5f5f5f'
    context.globalAlpha = 0.78
    const continentMasks = [
      [size * 0.22, size * 0.19, 130, 85, -0.2],
      [size * 0.38, size * 0.27, 98, 120, 0.24],
      [size * 0.53, size * 0.2, 160, 95, 0.08],
      [size * 0.72, size * 0.26, 178, 108, -0.28],
      [size * 0.86, size * 0.31, 82, 52, 0.2],
    ]
    continentMasks.forEach(([x, y, w, h, tilt]) => {
      context.save()
      context.translate(x, y)
      context.rotate(tilt)
      context.beginPath()
      context.ellipse(0, 0, w, h, 0, 0, Math.PI * 2)
      context.fill()
      context.restore()
    })
    context.globalAlpha = 1
  }

  const diffuse = new THREE.CanvasTexture(diffuseLayer.canvas)
  const normal = new THREE.CanvasTexture(normalLayer.canvas)
  const specular = new THREE.CanvasTexture(specularLayer.canvas)
  const bump = new THREE.CanvasTexture(bumpLayer.canvas)
  ;[diffuse, normal, specular, bump].forEach((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true
  })
  return { diffuse, normal, specular, bump }
}

function applyTextureCandidates(
  loader: THREE.TextureLoader,
  candidates: string[],
  onLoaded: (texture: THREE.Texture) => void
) {
  const attempt = (index: number) => {
    if (index >= candidates.length) return
    loader.load(
      candidates[index],
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        onLoaded(texture)
      },
      undefined,
      () => attempt(index + 1)
    )
  }
  attempt(0)
}

function lerp3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function layerNodeColor(node: GlobeNode, layer: ActiveLayer, riskShockEnabled: boolean): [number, number, number] {
  const dynamicRisk = Math.min(Math.max((node.currentRiskIndex ?? node.riskIndex ?? 28) / 100, 0), 1)
  if (layer === 'risk') {
    const base: [number, number, number] =
      dynamicRisk >= 0.65 || node.risk === 'CRITICAL'
        ? [1, 0.3, 0.3]
        : dynamicRisk >= 0.48 || node.risk === 'HIGH'
          ? [1, 0.54, 0.24]
          : dynamicRisk >= 0.3 || node.risk === 'MEDIUM'
            ? [0.24, 0.84, 1]
            : [0.36, 1, 0.81]
    if (!riskShockEnabled) return base
    const boost = dynamicRisk >= 0.48 || node.currentEarlyWarning ? 1.24 : 0.92
    return [Math.min(base[0] * boost, 1), Math.min(base[1] * boost, 1), Math.min(base[2] * boost, 1)]
  }
  if (layer === 'liquidity') {
    const t = Math.min(Math.max((node.payoutReliability ?? 50) / 100, 0), 1)
    return lerp3([1, 0.27, 0.4], [0, 1, 0.8], t)
  }
  if (layer === 'transparency') {
    const t = Math.min(Math.max((node.operationalStability ?? 50) / 100, 0), 1)
    return lerp3([1, 0.53, 0.2], [0.2, 0.93, 0.87], t)
  }
  // growth
  const t = Math.min(Math.max((node.score ?? 50) / 100, 0), 1)
  return lerp3([0.07, 0.2, 0.8], [1, 0.8, 0], t)
}

function layerFlowColor(layer: ActiveLayer): string {
  if (layer === 'risk') return '#ff8b5c'
  if (layer === 'liquidity') return '#31ffe0'
  if (layer === 'transparency') return '#59ffd2'
  return '#ffd24d'
}

function regimeIntensity(mode: RegimeMode): number {
  if (mode === 'instability') return 1.45
  if (mode === 'stress') return 1.15
  return 0.85
}

function riskValue(risk?: GlobeNode['risk']): number {
  if (risk === 'CRITICAL') return 1
  if (risk === 'HIGH') return 0.76
  if (risk === 'MEDIUM') return 0.48
  return 0.22
}

function nodeSystemicRisk(node: GlobeNode): number {
  const fromIndex = Math.min(Math.max((node.currentRiskIndex ?? node.riskIndex ?? 22) / 100, 0), 1)
  const fromBand = riskValue(node.risk)
  const warningBoost = node.currentEarlyWarning ? 0.14 : 0
  return Math.min(1, Math.max(fromIndex, fromBand) + warningBoost)
}

function geographicZone(region?: string): 'NA' | 'EU' | 'ASIA' | 'MIDDLE_EAST' | 'LATAM' {
  const normalized = String(region || '').toUpperCase()
  if (normalized === 'USA' || normalized === 'NA') return 'NA'
  if (normalized === 'EU' || normalized === 'EUROPE') return 'EU'
  if (normalized === 'UAE' || normalized === 'MIDDLE_EAST') return 'MIDDLE_EAST'
  if (normalized === 'LATAM' || normalized === 'LATIN_AMERICA') return 'LATAM'
  return 'ASIA'
}

function layerGlobePalette(layer: ActiveLayer, regimeMode: RegimeMode) {
  const regimeBoost = regimeMode === 'instability' ? 1 : regimeMode === 'stress' ? 0.7 : 0.45
  if (layer === 'risk') {
    return {
      a: '#041426',
      b: regimeMode === 'instability' ? '#ff5f57' : '#ff8d63',
      c: '#ffd166',
      overlayA: '#ff5f57',
      overlayB: '#ff9f6e',
      strength: 0.24 + regimeBoost * 0.18,
    }
  }
  if (layer === 'liquidity') {
    return {
      a: '#031a25',
      b: '#00d4c7',
      c: '#96fff4',
      overlayA: '#17e8cf',
      overlayB: '#4ef2ff',
      strength: 0.2 + regimeBoost * 0.12,
    }
  }
  if (layer === 'transparency') {
    return {
      a: '#071a1b',
      b: '#33e2d0',
      c: '#8ffff0',
      overlayA: '#2fd5a3',
      overlayB: '#4fe7df',
      strength: 0.18 + regimeBoost * 0.1,
    }
  }
  return {
    a: '#07112b',
    b: '#4f75ff',
    c: '#ffcf4e',
    overlayA: '#6186ff',
    overlayB: '#ffd24d',
    strength: 0.19 + regimeBoost * 0.11,
  }
}

function layerFlowProfile(layer: ActiveLayer) {
  if (layer === 'risk') {
    return { arcOpacity: 0.42, particleSize: 0.028, pulseSpeed: 1.2, shockColor: '#ff6b6b' }
  }
  if (layer === 'liquidity') {
    return { arcOpacity: 0.34, particleSize: 0.025, pulseSpeed: 1.45, shockColor: '#2ef2d5' }
  }
  if (layer === 'transparency') {
    return { arcOpacity: 0.31, particleSize: 0.023, pulseSpeed: 1.05, shockColor: '#56f4da' }
  }
  return { arcOpacity: 0.36, particleSize: 0.026, pulseSpeed: 1.32, shockColor: '#ffd24d' }
}

function createGlowTexture(innerColor: string, outerAlpha = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) {
    return new THREE.CanvasTexture(canvas)
  }

  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 128)
  gradient.addColorStop(0, innerColor)
  gradient.addColorStop(0.28, innerColor)
  gradient.addColorStop(0.62, 'rgba(255,255,255,0.18)')
  gradient.addColorStop(1, `rgba(255,255,255,${outerAlpha})`)
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createAtmosphereDustTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) {
    return new THREE.CanvasTexture(canvas)
  }

  const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
  gradient.addColorStop(0.16, 'rgba(166,244,255,0.72)')
  gradient.addColorStop(0.55, 'rgba(93,158,255,0.2)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export default function GTIXTGlobe({
  runtimeGraph,
  activeLayer = 'risk',
  regimeMode = 'stable',
  timelineLabel = 'live',
  riskShockEnabled = false,
  sectorPulseEnabled = false,
  collapseSimulationEnabled = false,
  collapseSeedId,
  collapseComparisonEnabled = false,
  collapseComparisonSeedId,
  collapsePropagationDepth = 4,
  collapseIntensity = 1,
  collapsePlaybackRunning = true,
  collapsePlaybackSpeed = 1,
  collapsePlaybackStepSignal = 0,
  collapsePlaybackResetSignal = 0,
  autoTourEnabled = false,
  executiveClarityEnabled = false,
  labelTone = 'institutional',
  selectedFirmId,
  selectedLinkPair,
  onFirmSelect,
  onLinkSelect,
  onRenderError,
  onRenderReady,
  onPerfSample,
}: GTIXTGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const pointGeomRef = useRef<THREE.BufferGeometry | null>(null)
  const nodeIdsRef = useRef<string[]>([])
  const graphNodesRef = useRef<GlobeNode[]>([])
  const nodePositionsMapRef = useRef<Map<string, THREE.Vector3>>(new Map())
  const highlightPointRef = useRef<THREE.Points | null>(null)
  const onFirmSelectRef = useRef(onFirmSelect)
  const onLinkSelectRef = useRef(onLinkSelect)
  const onRenderErrorRef = useRef(onRenderError)
  const onRenderReadyRef = useRef(onRenderReady)
  const onPerfSampleRef = useRef(onPerfSample)
  const collapseSeedIdRef = useRef(collapseSeedId ?? null)
  const collapseComparisonEnabledRef = useRef(collapseComparisonEnabled)
  const collapseComparisonSeedIdRef = useRef(collapseComparisonSeedId ?? null)
  const collapsePropagationDepthRef = useRef(collapsePropagationDepth)
  const collapseIntensityRef = useRef(collapseIntensity)
  const collapsePlaybackRunningRef = useRef(collapsePlaybackRunning)
  const collapsePlaybackSpeedRef = useRef(collapsePlaybackSpeed)
  const collapsePlaybackStepSignalRef = useRef(collapsePlaybackStepSignal)
  const collapsePlaybackResetSignalRef = useRef(collapsePlaybackResetSignal)
  const collapsePlaybackTimeRef = useRef(0)
  const selectedFirmIdRef = useRef(selectedFirmId ?? null)
  const executiveClarityEnabledRef = useRef(executiveClarityEnabled)
  const labelToneRef = useRef<LabelTone>(labelTone)
  const selectedLinkPairRef = useRef(selectedLinkPair ?? null)
  const prevSelectedFirmIdRef = useRef<string | null>(null)
  const hoveredNodeIdRef = useRef<string | null>(null)
  const hoveredSinceRef = useRef(0)
  const renderKickRef = useRef<(() => void) | null>(null)
  const [hoverCard, setHoverCard] = useState<HoverCardState | null>(null)
  const [pinnedCard, setPinnedCard] = useState<HoverCardState | null>(null)
  const pinnedCardRef = useRef<HoverCardState | null>(null)

  useEffect(() => {
    onFirmSelectRef.current = onFirmSelect
  }, [onFirmSelect])

  useEffect(() => {
    onLinkSelectRef.current = onLinkSelect
  }, [onLinkSelect])

  useEffect(() => {
    onRenderErrorRef.current = onRenderError
  }, [onRenderError])

  useEffect(() => {
    onRenderReadyRef.current = onRenderReady
  }, [onRenderReady])

  useEffect(() => {
    onPerfSampleRef.current = onPerfSample
  }, [onPerfSample])

  useEffect(() => {
    collapseSeedIdRef.current = collapseSeedId ?? null
    renderKickRef.current?.()
  }, [collapseSeedId])

  useEffect(() => {
    collapseComparisonEnabledRef.current = collapseComparisonEnabled
    renderKickRef.current?.()
  }, [collapseComparisonEnabled])

  useEffect(() => {
    collapseComparisonSeedIdRef.current = collapseComparisonSeedId ?? null
    renderKickRef.current?.()
  }, [collapseComparisonSeedId])

  useEffect(() => {
    collapsePropagationDepthRef.current = collapsePropagationDepth
    renderKickRef.current?.()
  }, [collapsePropagationDepth])

  useEffect(() => {
    collapseIntensityRef.current = collapseIntensity
    renderKickRef.current?.()
  }, [collapseIntensity])

  useEffect(() => {
    collapsePlaybackRunningRef.current = collapsePlaybackRunning
    renderKickRef.current?.()
  }, [collapsePlaybackRunning])

  useEffect(() => {
    collapsePlaybackSpeedRef.current = collapsePlaybackSpeed
    renderKickRef.current?.()
  }, [collapsePlaybackSpeed])

  useEffect(() => {
    collapsePlaybackStepSignalRef.current = collapsePlaybackStepSignal
    renderKickRef.current?.()
  }, [collapsePlaybackStepSignal])

  useEffect(() => {
    collapsePlaybackResetSignalRef.current = collapsePlaybackResetSignal
    collapsePlaybackTimeRef.current = 0
    renderKickRef.current?.()
  }, [collapsePlaybackResetSignal])

  useEffect(() => {
    pinnedCardRef.current = pinnedCard
  }, [pinnedCard])

  useEffect(() => {
    selectedFirmIdRef.current = selectedFirmId ?? null
    renderKickRef.current?.()
  }, [selectedFirmId])

  useEffect(() => {
    executiveClarityEnabledRef.current = executiveClarityEnabled
    renderKickRef.current?.()
  }, [executiveClarityEnabled])

  useEffect(() => {
    labelToneRef.current = labelTone
    renderKickRef.current?.()
  }, [labelTone])

  useEffect(() => {
    selectedLinkPairRef.current = selectedLinkPair ?? null
    renderKickRef.current?.()
  }, [selectedLinkPair])

  useEffect(() => {
    const nextHoveredId = pinnedCard?.nodeId || hoverCard?.nodeId || null
    if (hoveredNodeIdRef.current !== nextHoveredId) {
      hoveredNodeIdRef.current = nextHoveredId
      hoveredSinceRef.current = performance.now()
      renderKickRef.current?.()
    }
  }, [hoverCard?.nodeId, pinnedCard?.nodeId])

  const graphData = useMemo(() => {
    const nodes = (runtimeGraph?.nodes || []).slice(0, 400)
    const ids = new Set(nodes.map((node) => node.id))
    const links = (runtimeGraph?.links || [])
      .filter((link) => ids.has(link.source) && ids.has(link.target))
      .slice(0, 1200)
    return { nodes, links }
  }, [runtimeGraph])

  const connectionCountByNode = useMemo(() => {
    const counts = new Map<string, number>()
    graphData.links.forEach((link) => {
      counts.set(link.source, (counts.get(link.source) || 0) + 1)
      counts.set(link.target, (counts.get(link.target) || 0) + 1)
    })
    return counts
  }, [graphData])

  const hoveredNode = useMemo(() => {
    const target = pinnedCard || hoverCard
    if (!target) return null
    return graphData.nodes.find((node) => node.id === target.nodeId) || null
  }, [graphData.nodes, hoverCard, pinnedCard])

  const selectedNode = useMemo(() => {
    if (!selectedFirmId) return null
    return graphData.nodes.find((node) => node.id === selectedFirmId) || null
  }, [graphData.nodes, selectedFirmId])

  useEffect(() => {
    if (!hoverCard) return
    if (!graphData.nodes.some((node) => node.id === hoverCard.nodeId)) {
      setHoverCard(null)
    }
  }, [graphData.nodes, hoverCard])

  useEffect(() => {
    if (!pinnedCard) return
    if (!graphData.nodes.some((node) => node.id === pinnedCard.nodeId)) {
      setPinnedCard(null)
    }
  }, [graphData.nodes, pinnedCard])

  // Update node colors when analytical layer changes (without rebuilding the scene)
  useEffect(() => {
    const geom = pointGeomRef.current
    if (!geom || !graphNodesRef.current.length) return
    const colorAttr = geom.getAttribute('color') as THREE.BufferAttribute
    if (!colorAttr) return
    graphNodesRef.current.forEach((node, index) => {
      const [r, g, b] = layerNodeColor(node, activeLayer, riskShockEnabled)
      colorAttr.setXYZ(index, r, g, b)
    })
    colorAttr.needsUpdate = true
  }, [activeLayer, riskShockEnabled])

  // Update highlight point when selectedFirmId changes (without rebuilding the scene)
  useEffect(() => {
    const hp = highlightPointRef.current
    if (!hp) return
    if (!selectedFirmId) {
      hp.visible = false
      return
    }
    const pos = nodePositionsMapRef.current.get(selectedFirmId)
    if (!pos) {
      hp.visible = false
      return
    }
    const arr = hp.geometry.getAttribute('position') as THREE.BufferAttribute
    arr.setXYZ(0, pos.x, pos.y, pos.z)
    arr.needsUpdate = true
    hp.visible = true
  }, [selectedFirmId])

  // Main Three.js scene — only rebuilt when graph topology changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const readViewportSize = () => {
      const containerRect = container.getBoundingClientRect()
      const rootRect = rootRef.current?.getBoundingClientRect()
      const hostRect = container.parentElement?.getBoundingClientRect()
      return {
        width: Math.max(container.clientWidth, Math.round(containerRect.width), Math.round(rootRect?.width || 0), Math.round(hostRect?.width || 0)),
        height: Math.max(container.clientHeight, Math.round(containerRect.height), Math.round(rootRect?.height || 0), Math.round(hostRect?.height || 0)),
      }
    }

    // Some layout phases temporarily report 0x0. Bootstrap with safe dimensions,
    // then immediately adapt using ResizeObserver + onResize.
    const { width: measuredWidth, height: measuredHeight } = readViewportSize()
    const width = Math.max(measuredWidth, 960)
    const height = Math.max(measuredHeight, 520)

    // renderer is assigned inside the try block; the catch always returns early,
    // so any code reached after the try is guaranteed to have renderer initialised.
    // The definite-assignment assertion removes the union-null from all subsequent
    // closure references without requiring per-site non-null casts.
    let renderer!: THREE.WebGLRenderer
    let composer: EffectComposer | null = null
    try {
      const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0b1220')
    scene.fog = new THREE.FogExp2('#070d17', 0.04)

    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(18, 48, 48),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        transparent: true,
        uniforms: {
          uTop: { value: new THREE.Color('#1b2a3c') },
          uBottom: { value: new THREE.Color('#09111a') },
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uTop;
          uniform vec3 uBottom;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y * 0.5 + 0.5;
            vec3 color = mix(uBottom, uTop, smoothstep(0.0, 1.0, h));
            gl_FragColor = vec4(color, 0.92);
          }
        `,
      })
    )
    scene.add(skyDome)

    const camera = new THREE.PerspectiveCamera(45, width / Math.max(height, 1), 0.1, 100)
    camera.position.set(0, 0, 4.8)

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.debug.checkShaderErrors = true
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.92  // slightly darker → stronger contrast on links & labels
    renderer.sortObjects = true
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setSize(width, height)
    renderer.domElement.style.width = `${width}px`
    renderer.domElement.style.height = `${height}px`
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.inset = '0'
    // Fade-in: start invisible, transition to opaque on first rendered frame
    renderer.domElement.style.opacity = '0'
    renderer.domElement.style.transition = 'opacity 0.38s cubic-bezier(0.16, 1, 0.3, 1)'
    container.appendChild(renderer.domElement)

    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    // Start at strength=0 — bloom is ANALYTICAL: enabled only on node selection.
    // This avoids saturating lines/labels at idle and saves 6 GPU render passes.
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(Math.max(width / 2, 1), Math.max(height / 2, 1)), 0.0, 0.1, 0.92)
    composer.addPass(bloomPass)

    const GLOBE_MIN_DISTANCE = 1.45
    const GLOBE_MAX_DISTANCE = 8.4

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.095
    controls.rotateSpeed = 0.36
    controls.enableZoom = true
    controls.zoomSpeed = 0.68
    controls.minDistance = GLOBE_MIN_DISTANCE
    controls.maxDistance = GLOBE_MAX_DISTANCE
    controls.autoRotate = autoTourEnabled
    controls.autoRotateSpeed = 0.42
    controls.target.set(0, 0, 0)
    controls.minPolarAngle = Math.PI * 0.06
    controls.maxPolarAngle = Math.PI * 0.94
    controls.update()

    const onContextLost = (event: Event) => {
      event.preventDefault()
      onRenderErrorRef.current?.('webgl context lost')
    }
    const onContextCreationError = () => {
      onRenderErrorRef.current?.('webgl context creation failed')
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false)
    renderer.domElement.addEventListener('webglcontextcreationerror', onContextCreationError as EventListener, false)

    const ambient = new THREE.AmbientLight('#e4eefb', 0.4)
    const key = new THREE.PointLight('#f3f8ff', 0.92, 24)
    key.position.set(3, 2, 4)
    const rim = new THREE.PointLight('#96abc1', 0.28, 24)
    rim.position.set(-3, -1.5, -3)
    scene.add(ambient, key, rim)

    const globeGroup = new THREE.Group()
    scene.add(globeGroup)

    const dynamicTexturesToDispose: THREE.Texture[] = []
    const textureLoader = new THREE.TextureLoader()
    // Use 50m (medium) resolution for balanced border quality vs bundle size.
    // Pass topology to the fallback generator so it draws a real political map
    // instead of crude ellipses while the real earth_diffuse.jpg loads.
    const worldTopology = countries50m as any
    const worldTopologyHiRes = countries10m as any
    const fallbackEarthTextures = createFallbackEarthTextureSet(worldTopology)

    const palette = layerGlobePalette(activeLayer, regimeMode)
    const flowProfile = layerFlowProfile(activeLayer)

    const shockUniforms = {
      uTime: { value: 0 },
      uShockPoint: { value: new THREE.Vector3(0, 1, 0) },
      uShockIntensity: { value: 0 },
      uShockColor: { value: new THREE.Color('#ff5b5b') },
    }

    const earthBaseMaterial = new THREE.MeshPhongMaterial({
      color: '#ffffff',
      map: fallbackEarthTextures.diffuse,
      normalMap: fallbackEarthTextures.normal,
      bumpMap: fallbackEarthTextures.bump,
      bumpScale: 0.028,
      specularMap: fallbackEarthTextures.specular,
      specular: new THREE.Color('#6ca7d8'),
      shininess: 16,
      emissive: new THREE.Color('#09203a'),
      emissiveIntensity: 0.02,
      transparent: false,
    })

    applyTextureCandidates(
      textureLoader,
      ['/assets/earth/earth_diffuse.jpg', '/assets/earth/earth_diffuse.png', '/assets/earth/earth_diffuse.webp'],
      (texture) => {
      dynamicTexturesToDispose.push(texture)
      earthBaseMaterial.map = texture
      earthBaseMaterial.needsUpdate = true
      }
    )
    applyTextureCandidates(textureLoader, ['/assets/earth/earth_normal.png', '/assets/earth/earth_normal.jpg', '/assets/earth/earth_normal.webp'], (texture) => {
      dynamicTexturesToDispose.push(texture)
      earthBaseMaterial.normalMap = texture
      earthBaseMaterial.needsUpdate = true
    })
    applyTextureCandidates(textureLoader, ['/assets/earth/earth_specular.png', '/assets/earth/earth_specular.jpg', '/assets/earth/earth_specular.webp'], (texture) => {
      dynamicTexturesToDispose.push(texture)
      earthBaseMaterial.specularMap = texture
      earthBaseMaterial.needsUpdate = true
    })
    applyTextureCandidates(textureLoader, ['/assets/earth/earth_bump.jpg', '/assets/earth/earth_bump.png', '/assets/earth/earth_bump.webp'], (texture) => {
      dynamicTexturesToDispose.push(texture)
      earthBaseMaterial.bumpMap = texture
      earthBaseMaterial.needsUpdate = true
    })

    const earthBase = new THREE.Mesh(new THREE.SphereGeometry(1.205, 128, 128), earthBaseMaterial)
    globeGroup.add(earthBase)

    // Political overlay: semi-transparent country-fill canvas shown at all times,
    // providing country differentiation on top of (or instead of) the photo-realistic diffuse.
    const politicalOverlayMat = new THREE.MeshBasicMaterial({
      map: fallbackEarthTextures.diffuse,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })
    const politicalOverlay = new THREE.Mesh(
      new THREE.SphereGeometry(1.2062, 128, 128),
      politicalOverlayMat
    )
    globeGroup.add(politicalOverlay)

    const coastlineShape = feature(worldTopology, worldTopology.objects.land) as any
    const bordersShape = mesh(worldTopology, worldTopology.objects.countries, (a: any, b: any) => a !== b) as any
    const coastlineShapeHiRes = feature(worldTopologyHiRes, worldTopologyHiRes.objects.land) as any
    const bordersShapeHiRes = mesh(worldTopologyHiRes, worldTopologyHiRes.objects.countries, (a: any, b: any) => a !== b) as any
    // Shared materials — single instance per geo layer so animation loop can
    // update opacity in one assignment instead of iterating all child lines.
    const coastlineMat = new THREE.LineBasicMaterial({ color: '#d8e8f4', transparent: true, opacity: 0.78, depthWrite: false })
    const borderMat    = new THREE.LineBasicMaterial({ color: '#8aa3bc', transparent: true, opacity: 0.38, depthWrite: false })
    const coastlineMatHiRes = new THREE.LineBasicMaterial({ color: '#edf7ff', transparent: true, opacity: 0.0, depthWrite: false })
    const borderMatHiRes = new THREE.LineBasicMaterial({ color: '#c5d7ea', transparent: true, opacity: 0.0, depthWrite: false })
    const coastlineLines = createGeoLineGroup(coastlineShape, 1.212, () => coastlineMat)
    const borderLines    = createGeoLineGroup(bordersShape,   1.214, () => borderMat)
    const coastlineLinesHiRes = createGeoLineGroup(coastlineShapeHiRes, 1.2136, () => coastlineMatHiRes)
    const borderLinesHiRes = createGeoLineGroup(bordersShapeHiRes, 1.2154, () => borderMatHiRes)
    globeGroup.add(coastlineLines)
    globeGroup.add(borderLines)
    globeGroup.add(coastlineLinesHiRes)
    globeGroup.add(borderLinesHiRes)

    // Lat/lon graticule — institutional geographic reference grid
    // Meridians every 30° + parallels every 30° + prominent equator
    const GRAT_R   = 1.2103
    const gratMat  = new THREE.LineBasicMaterial({ color: '#6590ae', transparent: true, opacity: 0.05, depthWrite: false })
    const eqMat    = new THREE.LineBasicMaterial({ color: '#9acce8', transparent: true, opacity: 0.11, depthWrite: false })
    const graticuleGroup = new THREE.Group()
    for (let lon = -180; lon < 180; lon += 30) {
      const pts: THREE.Vector3[] = []
      for (let lat = -84; lat <= 84; lat += 5) pts.push(latLonToVector3(lat, lon, GRAT_R))
      graticuleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gratMat))
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      if (lat === 0) continue
      const pts: THREE.Vector3[] = []
      for (let lon = -180; lon <= 180; lon += 4) pts.push(latLonToVector3(lat, lon, GRAT_R))
      graticuleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gratMat))
    }
    const eqPts: THREE.Vector3[] = []
    for (let lon = -180; lon <= 180; lon += 3) eqPts.push(latLonToVector3(0, lon, GRAT_R + 0.001))
    graticuleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(eqPts), eqMat))
    globeGroup.add(graticuleGroup)

    const shockOverlay = new THREE.Mesh(
      new THREE.SphereGeometry(1.252, 96, 96),
      new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: shockUniforms,
        vertexShader: `
          varying vec3 vPosition;
          varying vec3 vNormal;
          void main() {
            vPosition = normalize(position);
            vNormal = normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uShockPoint;
          uniform float uShockIntensity;
          uniform vec3 uShockColor;
          varying vec3 vPosition;
          varying vec3 vNormal;

          void main() {
            float dist = distance(normalize(vPosition), normalize(uShockPoint));
            float ring1 = smoothstep(0.42, 0.18, abs(dist - (0.18 + mod(uTime * 0.12, 0.36))));
            float ring2 = smoothstep(0.36, 0.12, abs(dist - (0.34 + mod(uTime * 0.16, 0.28))));
            float core = smoothstep(0.42, 0.0, dist);
            float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 1.6);
            float alpha = (core * 0.16 + ring1 * 0.22 + ring2 * 0.18 + fresnel * 0.04) * uShockIntensity;
            gl_FragColor = vec4(uShockColor, alpha);
          }
        `,
      })
    )
    globeGroup.add(shockOverlay)

    // Fresnel atmospheric limb — gives the planet its real "atmospheric halo" look
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.31, 64, 64),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
        uniforms: {
          uColor: { value: new THREE.Color('#7ec8ff') },
          uStrength: { value: 1.0 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vWorldPos;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uStrength;
          varying vec3 vNormal;
          varying vec3 vWorldPos;
          void main() {
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.6);
            float alpha = fresnel * 0.28 * uStrength;
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
      })
    )
    globeGroup.add(atmosphere)

    const horizonGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.33, 96, 96),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        uniforms: {
          uColor: { value: new THREE.Color('#8ec5ff') },
          uStrength: { value: 1 },
        },
        vertexShader: `
          varying vec3 vNormalDir;
          void main() {
            vNormalDir = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uStrength;
          varying vec3 vNormalDir;
          void main() {
            float rim = pow(1.0 - abs(vNormalDir.z), 2.4);
            float alpha = rim * 0.28 * uStrength;
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
      })
    )
    globeGroup.add(horizonGlow)

    const cloudMaterial = new THREE.MeshPhongMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.075,
      depthWrite: false,
      blending: THREE.NormalBlending,
      emissive: new THREE.Color('#e6f3ff'),
      emissiveIntensity: 0.02,
      shininess: 24,
    })
    applyTextureCandidates(textureLoader, ['/assets/earth/earth_clouds.png', '/assets/earth/earth_clouds.jpg', '/assets/earth/earth_clouds.webp'], (texture) => {
      dynamicTexturesToDispose.push(texture)
      cloudMaterial.map = texture
      cloudMaterial.alphaMap = texture
      cloudMaterial.needsUpdate = true
    })
    const cloudShell = new THREE.Mesh(new THREE.SphereGeometry(1.275, 96, 96), cloudMaterial)
    globeGroup.add(cloudShell)

    const orbitalDustTexture = createAtmosphereDustTexture()
    const orbitalDustGeometry = new THREE.BufferGeometry()
    const orbitalDustCount = 180
    const orbitalDustPositions = new Float32Array(orbitalDustCount * 3)
    for (let index = 0; index < orbitalDustCount; index += 1) {
      const radius = 1.55 + ((index * 37) % 100) / 100 * 1.2
      const theta = ((index * 23) % 360) * (Math.PI / 180)
      const phi = Math.acos(clamp(-1 + (((index * 17) % 100) / 100) * 2, -1, 1))
      orbitalDustPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta)
      orbitalDustPositions[index * 3 + 1] = radius * Math.cos(phi) * 0.72
      orbitalDustPositions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
    }
    orbitalDustGeometry.setAttribute('position', new THREE.BufferAttribute(orbitalDustPositions, 3))
    const orbitalDustMaterial = new THREE.PointsMaterial({
      map: orbitalDustTexture,
      color: '#bfe3ff',
      size: 0.072,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    const orbitalDust = new THREE.Points(orbitalDustGeometry, orbitalDustMaterial)
    globeGroup.add(orbitalDust)

    // Build node positions
    const nodePositions = new Map<string, THREE.Vector3>()
    graphData.nodes.forEach((node) => {
      nodePositions.set(node.id, nodeToSpherePosition(node, 1.236))
    })
    nodePositionsMapRef.current = nodePositions
    graphNodesRef.current = graphData.nodes
    nodeIdsRef.current = graphData.nodes.map((n) => n.id)

    // Node point cloud (vertexColors)
    const pointGeometry = new THREE.BufferGeometry()
    const pointPositions = new Float32Array(graphData.nodes.length * 3)
    const pointColors = new Float32Array(graphData.nodes.length * 3)
    const riskByNode = new Map<string, GlobeNode['risk']>()

    graphData.nodes.forEach((node, index) => {
      const pos = nodePositions.get(node.id) || new THREE.Vector3()
      pointPositions[index * 3] = pos.x
      pointPositions[index * 3 + 1] = pos.y
      pointPositions[index * 3 + 2] = pos.z
      const [r, g, b] = layerNodeColor(node, activeLayer, riskShockEnabled)
      pointColors[index * 3] = r
      pointColors[index * 3 + 1] = g
      pointColors[index * 3 + 2] = b
      riskByNode.set(node.id, node.risk)
    })

    pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3))
    pointGeometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3))
    pointGeomRef.current = pointGeometry

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    const points = new THREE.Points(pointGeometry, pointsMaterial)
    globeGroup.add(points)

    const geographicLabelRecords: Array<{
      anchor: THREE.Vector3
      maxDistance: number
      sprite: THREE.Sprite
      texture: THREE.CanvasTexture
      type: 'country' | 'capital' | 'region' | 'cluster' | 'firm'
      baseScaleX: number
      baseScaleY: number
      nodeId?: string
    }> = []

    GEOGRAPHIC_LABELS.forEach((item) => {
      const subtitle = GEOGRAPHIC_LABEL_SUBTITLES[item.label]
      const texture = createRichTextSprite(item.label, { type: item.type, subtitle, color: item.color, tone: labelToneRef.current })
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      )
      sprite.position.copy(latLonToVector3(item.lat, item.lon, 1.32))
      sprite.scale.set(item.scale[0], item.scale[1], 1)
      globeGroup.add(sprite)
      geographicLabelRecords.push({
        anchor: latLonToVector3(item.lat, item.lon, 1.32),
        maxDistance: item.maxDistance,
        sprite,
        texture,
        type: item.type,
        baseScaleX: item.scale[0],
        baseScaleY: item.scale[1],
      })
    })

    const cityHubRecords: Array<{ anchor: THREE.Vector3; dot: THREE.Sprite; label: THREE.Sprite | null; labelTexture: THREE.CanvasTexture | null }> = []
    GLOBAL_CITY_HUBS.forEach((city) => {
      const anchor = latLonToVector3(city.lat, city.lon, 1.228)
      const dot = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createGlowTexture('rgba(255,255,255,1)', 0),
          color: '#f6fbff',
          transparent: true,
          opacity: city.prominence === 'primary' ? 0.82 : city.prominence === 'secondary' ? 0.66 : 0.5,
          depthWrite: false,
        })
      )
      dot.position.copy(anchor)
      dot.scale.setScalar(city.prominence === 'primary' ? 0.034 : city.prominence === 'secondary' ? 0.025 : 0.018)
      globeGroup.add(dot)

      let labelTexture: THREE.CanvasTexture | null = null
      let label: THREE.Sprite | null = null
      if (city.prominence === 'primary') {
        labelTexture = createRichTextSprite(city.label, { type: 'capital', color: '#e8f4ff', tone: labelToneRef.current })
        label = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: labelTexture,
            transparent: true,
            opacity: 0.78,
            depthWrite: false,
          })
        )
        label.position.copy(anchor.clone().multiplyScalar(1.08))
        label.scale.set(0.34, 0.085, 1)
        globeGroup.add(label)
      }

      cityHubRecords.push({ anchor, dot, label, labelTexture })
    })

    const topFirmLabels = [...graphData.nodes]
      .sort((a, b) => nodeSystemicRisk(b) - nodeSystemicRisk(a) || Number(b.score || 0) - Number(a.score || 0))
      .slice(0, 10)

    topFirmLabels.forEach((node) => {
      const anchor = nodePositions.get(node.id)
      if (!anchor) return
      const riskSuffix = node.risk === 'CRITICAL' ? 'Critical' : node.risk === 'HIGH' ? 'High Risk' : node.region || ''
      const texture = createRichTextSprite(node.label, { type: 'firm', subtitle: riskSuffix || undefined, color: '#fef3c7', tone: labelToneRef.current })
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      )
      sprite.position.copy(anchor.clone().multiplyScalar(1.09))
      sprite.scale.set(0.28, 0.08, 1)
      globeGroup.add(sprite)
      geographicLabelRecords.push({ anchor: anchor.clone().multiplyScalar(1.09), maxDistance: 2.4, sprite, texture, type: 'firm', baseScaleX: 0.28, baseScaleY: 0.08, nodeId: node.id })
    })

    // Geographic heat zones (NA / EU / ASIA / Middle East / LatAm) with activity + risk intensity
    const zoneGroups = new Map<'NA' | 'EU' | 'ASIA' | 'MIDDLE_EAST' | 'LATAM', { positions: THREE.Vector3[]; count: number; riskSum: number }>()
    graphData.nodes.forEach((node) => {
      const zone = geographicZone(node.region)
      if (!zoneGroups.has(zone)) {
        zoneGroups.set(zone, { positions: [], count: 0, riskSum: 0 })
      }
      const bucket = zoneGroups.get(zone)
      if (!bucket) return
      bucket.positions.push(nodePositions.get(node.id) || new THREE.Vector3())
      bucket.count += 1
      bucket.riskSum += nodeSystemicRisk(node)
    })
    const haloRecords: Array<{
      core: THREE.Mesh
      ring: THREE.Mesh
      outerRing: THREE.Mesh
      coreMaterial: THREE.MeshBasicMaterial
      ringMaterial: THREE.MeshBasicMaterial
      outerRingMaterial: THREE.MeshBasicMaterial
      phase: number
      base: number
      color: THREE.Color
    }> = []
    zoneGroups.forEach((bucket, zone) => {
      if (bucket.positions.length < 2) return
      const sum = new THREE.Vector3()
      bucket.positions.forEach((p) => sum.add(p))
      const centroid = sum.divideScalar(bucket.positions.length).normalize().multiplyScalar(1.245)
      const concentration = Math.min(bucket.count / Math.max(graphData.nodes.length, 1), 1)
      const avgRisk = bucket.riskSum / Math.max(bucket.count, 1)
      const base = 0.12 + concentration * 0.24 + avgRisk * 0.2
      const radius = 0.3 + concentration * 0.22 + avgRisk * 0.08
      const haloMat = new THREE.MeshBasicMaterial({
        color: GEO_ZONE_COLORS[zone],
        transparent: true,
        opacity: base,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const ringMat = new THREE.MeshBasicMaterial({
        color: GEO_ZONE_COLORS[zone],
        transparent: true,
        opacity: base * 0.82,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: GEO_ZONE_COLORS[zone],
        transparent: true,
        opacity: base * 0.4,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const haloMesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), haloMat)
      const ringMesh = new THREE.Mesh(new THREE.RingGeometry(radius * 0.92, radius * 1.24, 64), ringMat)
      const outerRingMesh = new THREE.Mesh(new THREE.RingGeometry(radius * 1.22, radius * 1.54, 64), outerRingMat)
      haloMesh.position.copy(centroid)
      ringMesh.position.copy(centroid)
      outerRingMesh.position.copy(centroid)
      haloMesh.lookAt(new THREE.Vector3(0, 0, 0))
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0))
      outerRingMesh.lookAt(new THREE.Vector3(0, 0, 0))
      globeGroup.add(haloMesh)
      globeGroup.add(ringMesh)
      globeGroup.add(outerRingMesh)
      haloRecords.push({
        core: haloMesh,
        ring: ringMesh,
        outerRing: outerRingMesh,
        coreMaterial: haloMat,
        ringMaterial: ringMat,
        outerRingMaterial: outerRingMat,
        phase: (hashCode(zone) % 100) / 17,
        base,
        color: new THREE.Color(GEO_ZONE_COLORS[zone]),
      })

      const texture = createRichTextSprite(zone.replace('_', ' '), { type: 'cluster', color: '#f0ebff', tone: labelToneRef.current })
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      )
      sprite.position.copy(centroid.clone().multiplyScalar(1.065))
      sprite.scale.set(0.34, 0.085, 1)
      globeGroup.add(sprite)
      geographicLabelRecords.push({ anchor: centroid.clone().multiplyScalar(1.065), maxDistance: 4.6, sprite, texture, type: 'cluster', baseScaleX: 0.34, baseScaleY: 0.085 })
    })

    const adjacency = new Map<string, string[]>()
    graphData.links.forEach((link) => {
      if (!adjacency.has(link.source)) adjacency.set(link.source, [])
      if (!adjacency.has(link.target)) adjacency.set(link.target, [])
      adjacency.get(link.source)?.push(link.target)
      adjacency.get(link.target)?.push(link.source)
    })

    const shockDistance = new Map<string, number>()
    if (riskShockEnabled) {
      const seedIds = selectedFirmIdRef.current
        ? [selectedFirmIdRef.current]
        : graphData.nodes.filter((node) => nodeSystemicRisk(node) >= 0.48).map((node) => node.id)
      const queue = seedIds.filter(Boolean).map((id) => ({ id, depth: 0 }))
      queue.forEach(({ id }) => shockDistance.set(id, 0))
      while (queue.length > 0) {
        const current = queue.shift()
        if (!current || current.depth >= 3) continue
        const neighbors = adjacency.get(current.id) || []
        neighbors.forEach((nextId) => {
          if (shockDistance.has(nextId)) return
          shockDistance.set(nextId, current.depth + 1)
          queue.push({ id: nextId, depth: current.depth + 1 })
        })
      }
    }

    const buildCollapseDistance = (seedId: string | null) => {
      const distanceMap = new Map<string, number>()
      if (!collapseSimulationEnabled || !seedId) return distanceMap
      const queue = [{ id: seedId, depth: 0 }]
      distanceMap.set(seedId, 0)
      while (queue.length > 0) {
        const current = queue.shift()
        if (!current || current.depth >= collapsePropagationDepthRef.current) continue
        const neighbors = adjacency.get(current.id) || []
        neighbors.forEach((nextId) => {
          if (distanceMap.has(nextId)) return
          distanceMap.set(nextId, current.depth + 1)
          queue.push({ id: nextId, depth: current.depth + 1 })
        })
      }
      return distanceMap
    }

    const collapseSeed = collapseSeedIdRef.current || [...graphData.nodes].sort((a, b) => nodeSystemicRisk(b) - nodeSystemicRisk(a))[0]?.id || null
    const comparisonSeed = collapseComparisonEnabledRef.current
      ? collapseComparisonSeedIdRef.current || graphData.nodes.find((node) => node.id !== collapseSeed)?.id || null
      : null
    const primaryCollapseDistance = buildCollapseDistance(collapseSeed)
    const secondaryCollapseDistance =
      comparisonSeed && comparisonSeed !== collapseSeed ? buildCollapseDistance(comparisonSeed) : new Map<string, number>()

    // Arc connections
    const lineGroup = new THREE.Group()
    const lineRecords: {
      line: THREE.Line
      source: string
      target: string
      type?: GlobeLinkType
      riskPairHot: boolean
      hop: number | null
      collapsePrimaryHop: number | null
      collapseSecondaryHop: number | null
      systemicWeight: number
    }[] = []
    const flowParticleGroups: { points: THREE.Points; samples: THREE.Vector3[]; seed: number; speed: number }[] = []
    graphData.links.forEach((link) => {
      const start = nodePositions.get(link.source)
      const end = nodePositions.get(link.target)
      if (!start || !end) return
      const relationStyle = relationTypeStyle(link.type)
      const geoPoints = geodesicArcPoints(start, end, 32, 1.24)
      const curve = new THREE.CatmullRomCurve3(geoPoints)
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(geoPoints)
      const lineMaterial = new THREE.LineBasicMaterial({
        color: relationStyle.color,
        transparent: true,
        opacity: Math.min(flowProfile.arcOpacity * relationStyle.opacity, 0.42),
        depthWrite: false,
      })
      const line = new THREE.Line(lineGeometry, lineMaterial)
      line.renderOrder = 5
      lineGroup.add(line)
      const sourceRisk = riskByNode.get(link.source)
      const targetRisk = riskByNode.get(link.target)
      const riskPairHot =
        sourceRisk === 'CRITICAL' || sourceRisk === 'HIGH' || targetRisk === 'CRITICAL' || targetRisk === 'HIGH'
      const sourceHop = shockDistance.get(link.source)
      const targetHop = shockDistance.get(link.target)
      const hop = sourceHop == null && targetHop == null ? null : Math.min(sourceHop ?? 99, targetHop ?? 99)
      const sourcePrimaryCollapseHop = primaryCollapseDistance.get(link.source)
      const targetPrimaryCollapseHop = primaryCollapseDistance.get(link.target)
      const collapsePrimaryHop =
        sourcePrimaryCollapseHop == null && targetPrimaryCollapseHop == null
          ? null
          : Math.min(sourcePrimaryCollapseHop ?? 99, targetPrimaryCollapseHop ?? 99)
      const sourceSecondaryCollapseHop = secondaryCollapseDistance.get(link.source)
      const targetSecondaryCollapseHop = secondaryCollapseDistance.get(link.target)
      const collapseSecondaryHop =
        sourceSecondaryCollapseHop == null && targetSecondaryCollapseHop == null
          ? null
          : Math.min(sourceSecondaryCollapseHop ?? 99, targetSecondaryCollapseHop ?? 99)
      const sourceNode = graphData.nodes.find((node) => node.id === link.source)
      const targetNode = graphData.nodes.find((node) => node.id === link.target)
      const systemicWeight = ((sourceNode ? nodeSystemicRisk(sourceNode) : 0.2) + (targetNode ? nodeSystemicRisk(targetNode) : 0.2)) / 2
      lineRecords.push({
        line,
        source: link.source,
        target: link.target,
        type: link.type,
        riskPairHot,
        hop,
        collapsePrimaryHop,
        collapseSecondaryHop,
        systemicWeight,
      })

      const particleGeometry = new THREE.BufferGeometry()
      const particlePositions = new Float32Array(9)
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
      const particleMaterial = new THREE.PointsMaterial({
        color: relationStyle.color,
        size: flowProfile.particleSize * relationStyle.particleScale * 0.82,
        transparent: true,
        opacity: 0.46,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      })
      const particlePoints = new THREE.Points(particleGeometry, particleMaterial)
      lineGroup.add(particlePoints)
      flowParticleGroups.push({
        points: particlePoints,
        samples: curve.getPoints(72),
        seed: (hashCode(`${link.source}:${link.target}`) % 1000) / 1000,
        speed: (0.18 + systemicWeight * 0.2) * flowProfile.pulseSpeed * relationStyle.particleScale + ((hashCode(link.source) + hashCode(link.target)) % 7) * 0.04,
      })
    })
    globeGroup.add(lineGroup)

    const sectorPulseRecords: { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial; phase: number; riskScalar: number }[] = []
    if (sectorPulseEnabled) {
      const sectorGroups = new Map<string, { positions: THREE.Vector3[]; risk: number }>()
      graphData.nodes.forEach((node) => {
        const sector = String(node.modelType || 'UNKNOWN').toUpperCase()
        if (!sectorGroups.has(sector)) sectorGroups.set(sector, { positions: [], risk: 0 })
        const bucket = sectorGroups.get(sector)
        if (!bucket) return
        bucket.positions.push(nodePositions.get(node.id) || new THREE.Vector3())
        bucket.risk += nodeSystemicRisk(node)
      })
      sectorGroups.forEach((bucket, sector) => {
        if (bucket.positions.length < 2) return
        const centroid = bucket.positions.reduce((acc, pos) => acc.add(pos), new THREE.Vector3())
          .divideScalar(bucket.positions.length)
          .normalize()
          .multiplyScalar(1.34)
        const riskScalar = Math.min(1, bucket.risk / Math.max(bucket.positions.length, 1))
        const material = new THREE.MeshBasicMaterial({
          color: SECTOR_COLORS[sector] || SECTOR_COLORS.UNKNOWN,
          transparent: true,
          opacity: 0.08 + riskScalar * 0.14,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
        const mesh = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.38, 64), material)
        mesh.position.copy(centroid)
        mesh.lookAt(new THREE.Vector3(0, 0, 0))
        globeGroup.add(mesh)
        sectorPulseRecords.push({ mesh, material, phase: (hashCode(sector) % 100) / 12, riskScalar })
      })
    }

    // Selected firm gold highlight sprite
    const highlightGeom = new THREE.BufferGeometry()
    const highlightPos = new Float32Array(3)
    highlightGeom.setAttribute('position', new THREE.BufferAttribute(highlightPos, 3))
    const highlightMat = new THREE.PointsMaterial({
      color: '#82f7e7',
      size: 0.048,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const highlightPoint = new THREE.Points(highlightGeom, highlightMat)
    highlightPoint.visible = false
    globeGroup.add(highlightPoint)
    highlightPointRef.current = highlightPoint

    const focusSpriteTexture = createGlowTexture('rgba(118, 245, 220, 1)', 0)
    const directSpriteTexture = createGlowTexture('rgba(118, 245, 220, 1)', 0)
    const secondarySpriteTexture = createGlowTexture('rgba(183, 221, 255, 1)', 0)

    const focusHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: focusSpriteTexture,
        color: '#7af5dc',
        transparent: true,
        opacity: 0.46,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    focusHalo.visible = false
    focusHalo.scale.setScalar(0.24)
    globeGroup.add(focusHalo)

    const hoverHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: focusSpriteTexture,
        color: '#bfe0ff',
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    hoverHalo.visible = false
    hoverHalo.scale.setScalar(0.16)
    globeGroup.add(hoverHalo)

    const collapseSeedTexture = createGlowTexture('rgba(255, 96, 96, 1)', 0)
    const collapseSeedHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: collapseSeedTexture,
        color: '#ff6b6b',
        transparent: true,
        opacity: 0.74,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    collapseSeedHalo.visible = false
    collapseSeedHalo.scale.setScalar(0.34)
    globeGroup.add(collapseSeedHalo)

    const comparisonSeedTexture = createGlowTexture('rgba(96, 189, 255, 1)', 0)
    const comparisonSeedHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: comparisonSeedTexture,
        color: '#63c9ff',
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    comparisonSeedHalo.visible = false
    comparisonSeedHalo.scale.setScalar(0.28)
    globeGroup.add(comparisonSeedHalo)

    const directNeighborSprites = Array.from({ length: 16 }, () => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: directSpriteTexture,
          color: '#76f5dc',
          transparent: true,
          opacity: 0.28,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
      sprite.visible = false
      sprite.scale.setScalar(0.16)
      globeGroup.add(sprite)
      return sprite
    })

    const secondaryNeighborSprites = Array.from({ length: 28 }, () => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: secondarySpriteTexture,
          color: '#75b9ff',
          transparent: true,
          opacity: 0.14,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
      sprite.visible = false
      sprite.scale.setScalar(0.11)
      globeGroup.add(sprite)
      return sprite
    })

    // Restore highlight if a firm is already selected when scene rebuilds
    const currentSelected = selectedFirmIdRef.current
    if (currentSelected) {
      const pos = nodePositions.get(currentSelected)
      if (pos) {
        const arr = highlightGeom.getAttribute('position') as THREE.BufferAttribute
        arr.setXYZ(0, pos.x, pos.y, pos.z)
        arr.needsUpdate = true
        highlightPoint.visible = true
      }
    }

    // Cinematic focus — activated when selectedFirmId changes; easeOutCubic sweep
    const cinematicRef = {
      active: false,
      startElapsed: 0,
      duration: 1.4,
      startTarget: new THREE.Vector3(),
      endTarget: new THREE.Vector3(),
    }
    let prevCinematicFirmId: string | null = null

    // Cinematic link focus — sweep when selectedLinkPair changes
    const cinematicLinkRef = {
      active: false,
      startElapsed: 0,
      duration: 1.2,
      startTarget: new THREE.Vector3(),
      endTarget: new THREE.Vector3(),
    }
    let prevCinematicLinkKey: string | null = null

    // Deselection dissolve ring — brief gold pulse when firm is deselected
    const deselectionDissolveRef = {
      active: false,
      startElapsed: 0,
      duration: 0.85,
      position: new THREE.Vector3(),
    }
    const dissolveRingTexture = createGlowTexture('rgba(255, 215, 80, 1)', 0)
    const dissolveRing = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: dissolveRingTexture,
        color: '#ffd050',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    dissolveRing.visible = false
    dissolveRing.scale.setScalar(0.38)
    globeGroup.add(dissolveRing)

    // Anomaly rings — pulsing amber halos around early-warning nodes (up to 20 at once)
    const anomalyRingTexture = createGlowTexture('rgba(255, 180, 40, 1)', 0)
    const MAX_ANOMALY_RINGS = 20
    const anomalyRingPool = Array.from({ length: MAX_ANOMALY_RINGS }, () => {
      const ring = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: anomalyRingTexture,
          color: '#ffb828',
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
      ring.visible = false
      ring.scale.setScalar(0.3)
      globeGroup.add(ring)
      return ring
    })
    const earlyWarningNodeIds = graphData.nodes
      .filter((n) => n.currentEarlyWarning)
      .slice(0, MAX_ANOMALY_RINGS)
      .map((n) => n.id)

    // Mouse rotation + hover + zoom
    const raycaster = new THREE.Raycaster()
    raycaster.params.Points = { threshold: 0.055 }
    let isDragging = false
    let dragMoved = false
    let lastPointerX = 0
    let lastPointerY = 0

    const updateHoverFromEvent = (event: MouseEvent) => {
      if (pinnedCardRef.current?.pinned) {
        renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab'
        return
      }
      const bounds = renderer.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -(((event.clientY - bounds.top) / bounds.height) * 2 - 1)
      )
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObject(points)
      let hoveredNodeId: string | null = null

      if (intersects.length > 0) {
        const idx = intersects[0].index ?? -1
        if (idx >= 0 && nodeIdsRef.current[idx]) {
          hoveredNodeId = nodeIdsRef.current[idx]
        }
      }

      if (!hoveredNodeId) {
        const localX = event.clientX - bounds.left
        const localY = event.clientY - bounds.top
        const centerX = bounds.width / 2
        const centerY = bounds.height / 2
        const ellipseDistance =
          (((localX - centerX) / (bounds.width * 0.34)) ** 2) +
          (((localY - centerY) / (bounds.height * 0.39)) ** 2)

        if (ellipseDistance > 1.35) {
          renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab'
          setHoverCard(null)
          return
        }

        const projected = new THREE.Vector3()
        const world = new THREE.Vector3()
        let bestDistance = Number.POSITIVE_INFINITY

        nodeIdsRef.current.forEach((id) => {
          const source = nodePositionsMapRef.current.get(id)
          if (!source) return
          world.copy(source).applyMatrix4(globeGroup.matrixWorld)
          projected.copy(world).project(camera)
          if (projected.z < -1 || projected.z > 1) return
          const screenX = ((projected.x + 1) * 0.5) * bounds.width
          const screenY = ((1 - projected.y) * 0.5) * bounds.height
          const distance = Math.hypot(screenX - localX, screenY - localY)
          if (distance < bestDistance) {
            bestDistance = distance
            hoveredNodeId = id
          }
        })
      }

      if (hoveredNodeId) {
        renderer.domElement.style.cursor = 'pointer'
        setHoverCard({
          nodeId: hoveredNodeId,
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        })
        return
      }

      renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab'
      setHoverCard(null)
    }

    const onPointerMove = (event: MouseEvent) => {
      if (isDragging) {
        const dx = event.clientX - lastPointerX
        const dy = event.clientY - lastPointerY
        lastPointerX = event.clientX
        lastPointerY = event.clientY
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          dragMoved = true
        }
        renderer.domElement.style.cursor = 'grabbing'
        setHoverCard(null)
        renderKickRef.current?.()
        return
      }

      if (pinnedCardRef.current?.pinned) {
        renderer.domElement.style.cursor = 'grab'
        return
      }

      updateHoverFromEvent(event)
      renderKickRef.current?.()
    }

    const onPointerDown = (event: MouseEvent) => {
      isDragging = true
      dragMoved = false
      lastPointerX = event.clientX
      lastPointerY = event.clientY
      renderer.domElement.style.cursor = 'grabbing'
      setHoverCard(null)
      renderKickRef.current?.()
    }

    const onPointerUp = () => {
      isDragging = false
      renderer.domElement.style.cursor = 'grab'
      renderKickRef.current?.()
    }

    const onPointerLeave = () => {
      isDragging = false
      renderer.domElement.style.cursor = 'grab'
      if (!pinnedCardRef.current?.pinned) {
        setHoverCard(null)
      }
      renderKickRef.current?.()
    }

    renderer.domElement.style.cursor = 'grab'
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.addEventListener('mousemove', onPointerMove)
    renderer.domElement.addEventListener('pointermove', onPointerMove as EventListener)
    renderer.domElement.addEventListener('mousedown', onPointerDown)
    renderer.domElement.addEventListener('pointerdown', onPointerDown as EventListener)
    renderer.domElement.addEventListener('mouseleave', onPointerLeave)
    renderer.domElement.addEventListener('pointerleave', onPointerLeave as EventListener)
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('pointerup', onPointerUp)
    const onControlsChange = () => renderKickRef.current?.()
    const onControlsStart = () => renderKickRef.current?.()
    const onControlsEnd = () => renderKickRef.current?.()
    controls.addEventListener('change', onControlsChange)
    controls.addEventListener('start', onControlsStart)
    controls.addEventListener('end', onControlsEnd)

    // Click → Firm Focus via Raycaster
    const onClick = (event: MouseEvent) => {
      if (dragMoved) return
      const bounds = renderer.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -(((event.clientY - bounds.top) / bounds.height) * 2 - 1)
      )
      raycaster.setFromCamera(mouse, camera)

      // Priority 1: node click
      const intersects = raycaster.intersectObject(points)
      if (intersects.length > 0) {
        const idx = intersects[0].index ?? -1
        if (idx >= 0 && nodeIdsRef.current[idx]) {
          const nodeId = nodeIdsRef.current[idx]
          onFirmSelectRef.current?.(nodeId)
          setPinnedCard({
            nodeId,
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
            pinned: true,
          })
        }
        renderKickRef.current?.()
        return
      }

      // Priority 2: arc (relation) click — precise line raycasting
      raycaster.params.Line = { threshold: 0.018 }
      const arcLines = lineRecords.map((r) => r.line)
      const arcIntersects = raycaster.intersectObjects(arcLines, false)
      if (arcIntersects.length > 0) {
        const intersectedLine = arcIntersects[0].object
        const matchingRecord = lineRecords.find((r) => r.line === intersectedLine)
        if (matchingRecord) {
          onLinkSelectRef.current?.(matchingRecord.source, matchingRecord.target, matchingRecord.type)
          renderKickRef.current?.()
          return
        }
      }

      // Priority 3: deselect
      if (pinnedCardRef.current?.pinned) {
        setPinnedCard(null)
      }
      renderKickRef.current?.()
    }
    renderer.domElement.addEventListener('click', onClick)

    // Double-click: zoom to firm or reset to full view
    const onDblClick = (event: MouseEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -(((event.clientY - bounds.top) / bounds.height) * 2 - 1)
      )
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObject(points)
      if (intersects.length > 0) {
        const idx = intersects[0].index ?? -1
        if (idx >= 0 && nodeIdsRef.current[idx]) {
          onFirmSelectRef.current?.(nodeIdsRef.current[idx])
        }
      } else {
        // Double-click empty space → reset orbit to full-globe view
        controls.minDistance = GLOBE_MIN_DISTANCE
        controls.maxDistance = GLOBE_MAX_DISTANCE
        controls.target.set(0, 0, 0)
          wantsZoomReset = true
      }
      renderKickRef.current?.()
    }
    renderer.domElement.addEventListener('dblclick', onDblClick)

    // Animation loop
    let rafId = 0
    let renderLoopActive = false
    let needsRender = true
    let lastRenderKickAt = performance.now()
    let readyReported = false
    const clock = new THREE.Clock()
    let elapsed = 0
    // Perf sampling: rolling 60-frame counter for FPS callback
    let perfFrameCount = 0
    let perfAccMs = 0
    let perfAccDrawCalls = 0
    let lastStepSignal = collapsePlaybackStepSignalRef.current
    let lastResetSignal = collapsePlaybackResetSignalRef.current
    const requestRender = () => {
      needsRender = true
      lastRenderKickAt = performance.now()
      if (renderLoopActive) return
      renderLoopActive = true
      rafId = requestAnimationFrame(tick)
    }
    renderKickRef.current = requestRender
    // ── Per-tick cache variables ─────────────────────────────────────────────
    // Neighbor-set cache: rebuild only when selected firm changes
    let cachedNeighborInteractionId: string | null = '__init__'
    let cachedDirectNeighborSet = new Set<string>()
    let cachedSecondaryNeighborSet = new Set<string>()
    // Color-dirty guard: skip per-node color loop when selection/hover is stable
    let colorDirtyInteractionId: string | null = '__init__'
    let colorDirtyHoveredId: string | null = '__init__'
    // Label-collision throttle: rebuild every 4 frames or on selection change
    let labelCollisionFrame = 0
    let labelCacheInteractionId: string | null = '__init__'
    let labelCandidatesCache: any[] = []
    // View-reset flag: double-click on empty space animates camera to distance 4.8
    let wantsZoomReset = false
    // ────────────────────────────────────────────────────────────────────────
    const tick = () => {
      const idleMs = performance.now() - lastRenderKickAt
      const selectedLinkActive = Boolean(selectedLinkPairRef.current)
      const continuousAnimation =
        collapseSimulationEnabled ||
        riskShockEnabled ||
        sectorPulseEnabled ||
        // Keep rendering while a node is selected so the selection pulse animates
        !!selectedFirmIdRef.current ||
        (autoTourEnabled && !selectedFirmIdRef.current && !isDragging) ||
        cinematicRef.active ||
        cinematicLinkRef.active ||
        deselectionDissolveRef.active

      if (!needsRender && !continuousAnimation && idleMs > 180) {
        renderLoopActive = false
        rafId = 0
        return
      }

      needsRender = false
      const delta = Math.min(clock.getDelta(), 0.05)
      elapsed += delta
      // Very slow heartbeat (0.8 Hz ≈ once per 1.25 s) — reads as a calm indicator, not flicker
      const selectPulse = 0.5 + 0.5 * Math.sin(elapsed * 0.8)

      // FPS sampling: every 60 frames call onPerfSample
      perfFrameCount++
      perfAccMs += delta * 1000
      perfAccDrawCalls += Number(renderer.info.render.calls || 0)
      if (perfFrameCount >= 60) {
        const avgFps = 1000 / (perfAccMs / perfFrameCount)
        const avgFrameMs = perfAccMs / perfFrameCount
        const avgDrawCalls = perfAccDrawCalls / perfFrameCount
        onPerfSampleRef.current?.(avgFps, avgFrameMs, avgDrawCalls)
        perfFrameCount = 0
        perfAccMs = 0
        perfAccDrawCalls = 0
      }

      if (collapsePlaybackResetSignalRef.current !== lastResetSignal) {
        collapsePlaybackTimeRef.current = 0
        lastResetSignal = collapsePlaybackResetSignalRef.current
      }
      if (collapsePlaybackStepSignalRef.current !== lastStepSignal) {
        const stepDelta = collapsePlaybackStepSignalRef.current - lastStepSignal
        collapsePlaybackTimeRef.current += Math.max(0, stepDelta)
        lastStepSignal = collapsePlaybackStepSignalRef.current
      }
      if (collapsePlaybackRunningRef.current) {
        collapsePlaybackTimeRef.current += delta * collapsePlaybackSpeedRef.current
      }

      const currentDistance = camera.position.distanceTo(controls.target)
      const zoomScale = clamp(currentDistance / 4.2, 0.42, 1.8)
      // Geo layer opacity: crisp when zoomed in, subtle when viewing full globe
      const zoomNorm  = clamp((currentDistance - 1.28) / 5.12, 0, 1)
      const hiResGeoMix = clamp((2.5 - currentDistance) / 1.1, 0, 1)
      politicalOverlayMat.opacity = 0.11 + (1 - zoomNorm) * 0.22
      coastlineMat.opacity = 0.28 + (1 - zoomNorm) * 0.38
      borderMat.opacity    = 0.1 + (1 - zoomNorm) * 0.24
      coastlineMatHiRes.opacity = hiResGeoMix * 0.62
      borderMatHiRes.opacity = hiResGeoMix * 0.5
      gratMat.opacity      = 0.012 + (1 - zoomNorm) * 0.048
      eqMat.opacity        = 0.038 + (1 - zoomNorm) * 0.082
      // ANALYTICAL BLOOM: only active when a node is selected — tiny aura around it.
      // At idle the strength is 0 so we skip the full EffectComposer pass later.
      const wantsBloom = Boolean(selectedFirmIdRef.current)
      bloomPass.threshold = 0.88
      bloomPass.strength = wantsBloom
        ? 0.06 + (regimeMode === 'instability' ? 0.02 : regimeMode === 'stress' ? 0.01 : 0)
        : 0.0
      bloomPass.radius = 0.1
      controls.autoRotate = autoTourEnabled && !selectedFirmIdRef.current && !isDragging
      controls.autoRotateSpeed = regimeMode === 'stress' ? 0.5 : 0.38
      globeGroup.rotation.x += (0 - globeGroup.rotation.x) * 0.08
      globeGroup.rotation.y += (0 - globeGroup.rotation.y) * 0.08
      globeGroup.rotation.z += (0 - globeGroup.rotation.z) * 0.08
      if (continuousAnimation) {
        orbitalDust.rotation.y += delta * 0.01
        orbitalDust.rotation.x = Math.sin(elapsed * 0.08) * 0.04
      }

      // Steady beacon on selected node: fixed size, minimal opacity breath so it stays sharp
      if (highlightPoint.visible) {
        highlightMat.opacity = 0.68 + selectPulse * 0.12  // 0.68 – 0.80 only
        highlightMat.size = 0.048                          // never changes size — avoids shape flicker
      }

      const regimeMult = regimeIntensity(regimeMode)
      const shockMult = riskShockEnabled ? 1.22 : 1
      const livePalette = layerGlobePalette(activeLayer, regimeMode)
      const liveFlowProfile = layerFlowProfile(activeLayer)
      const collapseSpeed = 0.36 + collapseIntensityRef.current * 0.6
      const collapseSpan = Math.max(1, collapsePropagationDepthRef.current + 1)
      const playbackClock = collapsePlaybackTimeRef.current * collapseSpeed
      const primaryCollapseTravel = collapseSimulationEnabled ? (playbackClock % collapseSpan) : 0
      const secondaryCollapseTravel = collapseSimulationEnabled ? ((playbackClock + 0.55) % collapseSpan) : 0
      const primaryFrontierHop = Math.floor(primaryCollapseTravel)
      const secondaryFrontierHop = Math.floor(secondaryCollapseTravel)
      const primaryFrontierPhase = primaryCollapseTravel - primaryFrontierHop
      const secondaryFrontierPhase = secondaryCollapseTravel - secondaryFrontierHop

      const collapseActivation = (hop: number | null, frontierHop: number, frontierPhase: number) => {
        if (hop == null) return 0
        if (hop < frontierHop) return 1
        if (hop === frontierHop) return 0.2 + frontierPhase * 0.8
        return 0.04
      }

      shockUniforms.uTime.value = elapsed
      scene.background = new THREE.Color('#0b1220')
      ;(skyDome.material as THREE.ShaderMaterial).uniforms.uTop.value.set('#243548')
      ;(skyDome.material as THREE.ShaderMaterial).uniforms.uBottom.value.set('#09111a')

      // Hover + interaction state — must be resolved before atmosphere/node coloring
      const hoveredId = hoveredNodeIdRef.current
      const interactionId = selectedFirmIdRef.current
      if (scene.fog && scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.set(interactionId ? '#060a12' : '#070d17')
        scene.fog.density = 0.028 + (1 - zoomNorm) * 0.028 + (interactionId ? 0.011 : 0)
      }
      pointsMaterial.opacity = interactionId ? 0.22 : 0.76

      // Terrain micro-contrast: amplify bump relief at close zoom for Google Earth detail
      earthBaseMaterial.bumpScale = 0.016 + hiResGeoMix * 0.042
      earthBaseMaterial.emissiveIntensity = riskShockEnabled ? 0.025 : 0.012 + hiResGeoMix * 0.018
      earthBaseMaterial.specular.set(hiResGeoMix > 0.3 ? '#9ab8d4' : '#88a8c9')

      // Atmospheric glow: color shifts toward active region zone color for visual anchoring
      const activeZoneColor = interactionId
        ? (() => {
            const node = graphData.nodes.find((n) => n.id === interactionId)
            if (!node) return '#7ec8ff'
            const zone = geographicZone(node.region)
            const zoneHex: Record<string, string> = { NA: '#7ab8ff', EU: '#72f5c0', MIDDLE_EAST: '#ffd080', LATAM: '#d88aff', ASIA: '#ffa870' }
            return zoneHex[zone] || '#7ec8ff'
          })()
        : '#7ec8ff'
      ;(atmosphere.material as THREE.ShaderMaterial).uniforms.uColor.value.set(
        regimeMode === 'instability' ? '#ff9b8b' : activeZoneColor
      )
      ;(atmosphere.material as THREE.ShaderMaterial).uniforms.uStrength.value =
        0.48 + regimeMult * 0.1 + (1 - zoomNorm) * 0.1 + (collapseSimulationEnabled ? 0.12 : 0) + (interactionId ? 0.05 : 0)
      ;(horizonGlow.material as THREE.ShaderMaterial).uniforms.uColor.value.set(interactionId ? activeZoneColor : '#95c8ff')
      ;(horizonGlow.material as THREE.ShaderMaterial).uniforms.uStrength.value = 0.28 + regimeMult * 0.04 + (1 - zoomNorm) * 0.08
      pointsMaterial.size = 0.027 + (riskShockEnabled ? 0.003 : 0)

      const layerColor = new THREE.Color(layerFlowColor(activeLayer))
      const hotColor = new THREE.Color(liveFlowProfile.shockColor)
      const collapseColor = new THREE.Color('#ff3b30')
      const comparisonCollapseColor = new THREE.Color('#4db7ff')
      const sharedCollapseColor = new THREE.Color('#ffd166')

      const pointColorAttr = pointGeometry.getAttribute('color') as THREE.BufferAttribute
      const colorNeedsRebuild = interactionId !== colorDirtyInteractionId || hoveredId !== colorDirtyHoveredId || collapseSimulationEnabled
      graphData.nodes.forEach((node, index) => {
        if (!colorNeedsRebuild) return
        const [baseR, baseG, baseB] = layerNodeColor(node, activeLayer, riskShockEnabled)
        const primaryActivation = collapseActivation(primaryCollapseDistance.get(node.id) ?? null, primaryFrontierHop, primaryFrontierPhase)
        const secondaryActivation = collapseActivation(secondaryCollapseDistance.get(node.id) ?? null, secondaryFrontierHop, secondaryFrontierPhase)
        let r = baseR
        let g = baseG
        let b = baseB
        if (collapseSimulationEnabled && (primaryActivation > 0 || secondaryActivation > 0)) {
          let target = collapseColor
          if (primaryActivation > 0 && secondaryActivation > 0) {
            target = sharedCollapseColor
          } else if (secondaryActivation > 0) {
            target = comparisonCollapseColor
          }
          const mixStrength = Math.min(0.92, 0.22 + Math.max(primaryActivation, secondaryActivation) * 0.7)
          r = baseR + (target.r - baseR) * mixStrength
          g = baseG + (target.g - baseG) * mixStrength
          b = baseB + (target.b - baseB) * mixStrength
        }
        if (node.id === hoveredId) {
          r = r + (0.72 - r) * 0.55
          g = g + (0.92 - g) * 0.55
          b = b + (1 - b) * 0.55
        } else if (interactionId && node.id !== interactionId) {
          const connected = adjacency.get(interactionId)?.includes(node.id)
          if (!connected) {
            r *= 0.78
            g *= 0.78
            b *= 0.78
          }
        }
        pointColorAttr.setXYZ(index, r, g, b)
      })
        if (colorNeedsRebuild) {
          pointColorAttr.needsUpdate = true
          colorDirtyInteractionId = interactionId
          colorDirtyHoveredId = hoveredId
        }

      if (interactionId !== cachedNeighborInteractionId) {
        cachedDirectNeighborSet = new Set(interactionId ? adjacency.get(interactionId) || [] : [])
        cachedSecondaryNeighborSet = new Set<string>()
        cachedDirectNeighborSet.forEach((id) => {
          const chained = adjacency.get(id) || []
          chained.forEach((nextId) => {
            if (nextId !== interactionId && !cachedDirectNeighborSet.has(nextId)) {
              cachedSecondaryNeighborSet.add(nextId)
            }
          })
        })
        cachedNeighborInteractionId = interactionId
      }
      const directNeighborSet = cachedDirectNeighborSet
      const secondaryNeighborSet = cachedSecondaryNeighborSet

      lineRecords.forEach((record, index) => {
        const material = record.line.material as THREE.LineBasicMaterial
        const relationStyle = relationTypeStyle(record.type)
        const relationColor = new THREE.Color(relationStyle.color)
        const basePulse = 0.12 + Math.abs(Math.sin(elapsed * (liveFlowProfile.pulseSpeed + regimeMult * 0.08) + index * 0.03)) * (0.1 + record.systemicWeight * 0.12)
        const focused = !!interactionId
        const connectedToFocus = focused && (record.source === interactionId || record.target === interactionId)
        const connectedToSecondary = focused && (
          directNeighborSet.has(record.source) ||
          directNeighborSet.has(record.target) ||
          secondaryNeighborSet.has(record.source) ||
          secondaryNeighborSet.has(record.target)
        )

        const hopBoost = record.hop == null ? 1 : Math.max(0.35, 1.35 - record.hop * 0.32)
        const primaryActivation = collapseActivation(record.collapsePrimaryHop, primaryFrontierHop, primaryFrontierPhase)
        const secondaryActivation = collapseActivation(record.collapseSecondaryHop, secondaryFrontierHop, secondaryFrontierPhase)
        const collapseBoost = 1 + (primaryActivation + secondaryActivation) * (0.42 + collapseIntensityRef.current * 0.22)
        let opacity = basePulse * regimeMult * hopBoost * collapseBoost * (record.riskPairHot && riskShockEnabled ? shockMult : 1)
        if (focused) {
          // Direct links: stable opacity + a tiny breath via selectPulse — never sinusoidal flicker
          opacity = connectedToFocus ? 0.72 + selectPulse * 0.04 : connectedToSecondary ? 0.2 : 0.03
        } else if (selectedLinkActive) {
          opacity *= 0.18
        }

        // Selected link pair → max highlight pulse
        const isSelectedLink = selectedLinkPairRef.current && (
          (record.source === selectedLinkPairRef.current.source && record.target === selectedLinkPairRef.current.target) ||
          (record.source === selectedLinkPairRef.current.target && record.target === selectedLinkPairRef.current.source)
        )
        if (isSelectedLink) opacity = Math.min(opacity * 4.0, 0.98)

        // Direct connections of the selected node bypass the style-opacity multiplier
        // (which would otherwise dim them down to ~0.55). We keep them near-opaque.
        material.opacity = focused && connectedToFocus
          ? Math.min(opacity, 0.92)
          : Math.min(opacity * relationStyle.opacity, 0.62)
        if (collapseSimulationEnabled && (primaryActivation > 0 || secondaryActivation > 0)) {
          if (primaryActivation > 0 && secondaryActivation > 0) {
            material.color.lerpColors(relationColor, sharedCollapseColor, Math.min(0.95, 0.34 + Math.max(primaryActivation, secondaryActivation) * 0.72))
          } else if (primaryActivation > 0) {
            material.color.lerpColors(relationColor, collapseColor, Math.min(0.95, 0.28 + primaryActivation * 0.68))
          } else {
            material.color.lerpColors(relationColor, comparisonCollapseColor, Math.min(0.95, 0.28 + secondaryActivation * 0.68))
          }
        } else if (focused && connectedToFocus) {
          material.color.set('#b0f4e8')
        } else if (focused && connectedToSecondary) {
          material.color.set('#d7ebff')
        } else if (riskShockEnabled && (record.riskPairHot || record.hop != null)) {
          const dominoMix = record.hop == null ? 0.72 : Math.max(0.24, 0.94 - record.hop * 0.24)
          material.color.lerpColors(relationColor, hotColor, dominoMix)
        } else if (selectedLinkActive) {
          material.color.lerpColors(relationColor, new THREE.Color('#d9ebff'), 0.22)
        } else if (connectedToSecondary) {
          material.color.lerpColors(relationColor, new THREE.Color(livePalette.overlayB), 0.34)
        } else {
          material.color.lerpColors(relationColor, layerColor, 0.24)
        }
      })

      flowParticleGroups.forEach((group, groupIndex) => {
        const attr = group.points.geometry.getAttribute('position') as THREE.BufferAttribute
        const particleMaterial = group.points.material as THREE.PointsMaterial
        const focused = !!interactionId
        const related = focused
          ? lineRecords[groupIndex] &&
            (lineRecords[groupIndex].source === interactionId || lineRecords[groupIndex].target === interactionId)
          : true
        const particleAnimationEnabled = collapseSimulationEnabled || riskShockEnabled || selectedLinkActive
        const visible = particleAnimationEnabled && (!focused || related)
        group.points.visible = visible
        if (!visible) return

        for (let particleIndex = 0; particleIndex < 3; particleIndex += 1) {
          const progress = (elapsed * group.speed + group.seed + particleIndex * 0.18) % 1
          const sampleIndex = Math.min(Math.floor(progress * (group.samples.length - 1)), group.samples.length - 1)
          const sample = group.samples[sampleIndex]
          attr.setXYZ(particleIndex, sample.x, sample.y, sample.z)
        }
        attr.needsUpdate = true
        const hop = lineRecords[groupIndex]?.hop
        const relationStyle = relationTypeStyle(lineRecords[groupIndex]?.type)
        const relationColor = new THREE.Color(relationStyle.color)
        const primaryActivation = collapseActivation(lineRecords[groupIndex]?.collapsePrimaryHop ?? null, primaryFrontierHop, primaryFrontierPhase)
        const secondaryActivation = collapseActivation(lineRecords[groupIndex]?.collapseSecondaryHop ?? null, secondaryFrontierHop, secondaryFrontierPhase)
        const dominoPulse = hop == null ? 1 : Math.max(0.5, 1.2 - hop * 0.18)
        const collapsePulse = 1 + (primaryActivation + secondaryActivation) * (0.28 + collapseIntensityRef.current * 0.18)
        particleMaterial.color.copy(
          collapseSimulationEnabled && primaryActivation > 0 && secondaryActivation > 0
            ? sharedCollapseColor
            : collapseSimulationEnabled && primaryActivation > 0
              ? collapseColor
              : collapseSimulationEnabled && secondaryActivation > 0
                ? comparisonCollapseColor
            : riskShockEnabled && (lineRecords[groupIndex]?.riskPairHot || hop != null)
              ? hotColor
                : relationColor.clone().lerp(layerColor, 0.24)
        )
          particleMaterial.opacity = Math.min((0.34 + Math.sin(elapsed * 4 + group.seed * 10) * 0.12) * regimeMult * dominoPulse * collapsePulse * relationStyle.opacity, 0.72)
        particleMaterial.size =
              (liveFlowProfile.particleSize * relationStyle.particleScale) - 0.008 +
            (riskShockEnabled ? 0.004 : 0) +
            (collapseSimulationEnabled ? 0.006 + collapseIntensityRef.current * 0.003 : 0) +
            (hop === 0 ? 0.006 : 0)
      })

      haloRecords.forEach((halo) => {
        // When a node is selected, calm geo halos so they don't compete with the focused network.
        // Idle mode keeps risk-driven rhythm; selection mode becomes a slow ambient glow.
        const haloFreq = interactionId
          ? 0.35 + halo.base * 0.25           // ~0.35–0.60 Hz: barely perceptible
          : 1.3 + halo.base * 1.4 + regimeMult * 0.24
        const zonePulse = Math.sin(elapsed * haloFreq + halo.phase)
        const pulseAbs = Math.abs(zonePulse)
        const ampScale = interactionId ? 0.28 : 1.0   // 72% smaller amplitude while focused
        halo.coreMaterial.color.lerpColors(halo.color, layerColor, 0.22)
        halo.ringMaterial.color.lerpColors(halo.color, new THREE.Color(livePalette.overlayB), 0.28)
        halo.outerRingMaterial.color.lerpColors(halo.color, new THREE.Color(livePalette.overlayA), 0.18)
        halo.coreMaterial.opacity = (halo.base + pulseAbs * 0.14 * ampScale + (collapseSimulationEnabled ? 0.05 + collapseIntensityRef.current * 0.03 : 0)) * regimeMult
        halo.ringMaterial.opacity = (halo.base * 0.72 + pulseAbs * 0.18 * ampScale + (collapseSimulationEnabled ? 0.04 + collapseIntensityRef.current * 0.02 : 0)) * regimeMult
        halo.outerRingMaterial.opacity = (halo.base * 0.28 + pulseAbs * 0.1 * ampScale + (collapseSimulationEnabled ? 0.02 + collapseIntensityRef.current * 0.02 : 0)) * regimeMult
        halo.core.scale.setScalar(1 + pulseAbs * 0.12 * ampScale)
        halo.ring.scale.setScalar(1 + pulseAbs * 0.22 * ampScale)
        halo.outerRing.scale.setScalar(1 + pulseAbs * 0.34 * ampScale)
      })

      orbitalDustMaterial.opacity = 0.05 + (1 - zoomNorm) * 0.04 + (regimeMult - 0.85) * 0.012

      sectorPulseRecords.forEach((record) => {
        const pulse = Math.abs(Math.sin(elapsed * (1.4 + regimeMult * 0.2) + record.phase))
        record.material.opacity = (0.06 + record.riskScalar * 0.12 + pulse * 0.12) * regimeMult
        const scale = 1 + pulse * 0.18 + record.riskScalar * 0.12
        record.mesh.scale.setScalar(scale)
      })

      // Anomaly rings: pulsing amber halos around early-warning nodes (BI intelligence layer)
      earlyWarningNodeIds.forEach((id, idx) => {
        const ring = anomalyRingPool[idx]
        if (!ring) return
        const pos = nodePositions.get(id)
        if (!pos) { ring.visible = false; return }
        const worldPos = pos.clone().applyMatrix4(globeGroup.matrixWorld)
        const cameraDir = camera.position.clone().sub(worldPos).normalize()
        const frontFacing = pos.clone().normalize().dot(cameraDir) > 0.08
        ring.visible = frontFacing
        if (!frontFacing) return
        ring.position.copy(pos)
        // Double-pulse: was 4.8 Hz (stroboscopic), now 2.0 Hz — still urgent but readable
        const innerPulse = (Math.sin(elapsed * 2.0 + idx * 1.2) + 1) * 0.5
        const outerBreathe = (Math.sin(elapsed * 0.9 + idx * 0.9) + 1) * 0.5
        ring.scale.setScalar(0.22 + innerPulse * 0.06 + outerBreathe * 0.04)
        ;(ring.material as THREE.SpriteMaterial).opacity = (0.28 + innerPulse * 0.28 + outerBreathe * 0.12) * regimeMult
      })
      // Hide unused rings
      for (let ri = earlyWarningNodeIds.length; ri < MAX_ANOMALY_RINGS; ri++) {
        anomalyRingPool[ri].visible = false
      }

      atmosphere.scale.setScalar(1)
      horizonGlow.scale.setScalar(1)

      const viewportWidth = Math.max(renderer.domElement.clientWidth, 1)
      const viewportHeight = Math.max(renderer.domElement.clientHeight, 1)
      labelCollisionFrame++
      const rebuildLabels = labelCollisionFrame % 4 === 0 || interactionId !== labelCacheInteractionId
      let labelCandidates: Array<{
        record: (typeof geographicLabelRecords)[number]
        targetOpacity: number
        priority: number
        screenX: number
        screenY: number
      }> = rebuildLabels ? [] : (labelCandidatesCache as any)

      geographicLabelRecords.forEach((record) => {
        const worldAnchor = record.anchor.clone().applyMatrix4(globeGroup.matrixWorld)
        const cameraDir = camera.position.clone().sub(worldAnchor).normalize()
        const normal = worldAnchor.clone().normalize()
        const frontFacing = normal.dot(cameraDir) > 0.1
        const withinDistance = currentDistance <= record.maxDistance
        const baseOpacity = frontFacing && withinDistance
          ? record.type === 'region' ? 0.46
            : record.type === 'country' ? 0.58
            : record.type === 'capital' ? 0.72
            : record.type === 'cluster' ? 0.7
            : 0.8
          : 0

        const distanceNorm = clamp(1 - currentDistance / Math.max(record.maxDistance, 0.001), 0, 1)
        const distanceOpacity = 0.32 + distanceNorm * 0.88

        let targetOpacity = baseOpacity * distanceOpacity
        let priority = record.type === 'firm' ? 100 : record.type === 'capital' ? 80 : record.type === 'country' ? 60 : record.type === 'cluster' ? 50 : 35

        const focusedId = selectedFirmIdRef.current
        if (focusedId && record.nodeId) {
          if (record.nodeId === focusedId) {
            targetOpacity = Math.max(targetOpacity, 0.95)
            priority += 220
          } else if (!directNeighborSet.has(record.nodeId)) {
            targetOpacity *= 0.3
            priority -= 30
          } else {
            priority += 55
          }
        }

        if (executiveClarityEnabledRef.current) {
          if (record.type === 'region') targetOpacity = 0
          if (record.type === 'country') targetOpacity *= 0.35
          if (record.type === 'cluster') targetOpacity *= 0.35
          if (record.type === 'capital') priority += 20
          if (record.type === 'firm') priority += 35
        }

        if (targetOpacity > 0.01) {
          const ndc = worldAnchor.clone().project(camera)
          const screenX = (ndc.x * 0.5 + 0.5) * viewportWidth
          const screenY = (-ndc.y * 0.5 + 0.5) * viewportHeight
          if (rebuildLabels) labelCandidates.push({ record, targetOpacity, priority, screenX, screenY })
        }
      })

      if (rebuildLabels) {
        labelCandidates.sort((a, b) => b.priority - a.priority)
        labelCandidatesCache = labelCandidates
        labelCacheInteractionId = interactionId
      }
      const occupied: Array<{ x: number; y: number; radius: number }> = []

      geographicLabelRecords.forEach((record) => {
        const material = record.sprite.material as THREE.SpriteMaterial
        material.opacity += (0 - material.opacity) * 0.14
        if (material.opacity < 0.015) {
          record.sprite.visible = false
        }
      })

      labelCandidates.forEach((entry) => {
        const radius = entry.record.type === 'region'
          ? (labelToneRef.current === 'institutional' ? 58 : 54)
          : entry.record.type === 'country'
            ? (labelToneRef.current === 'institutional' ? 49 : 46)
            : entry.record.type === 'capital'
              ? (labelToneRef.current === 'institutional' ? 40 : 38)
              : (labelToneRef.current === 'institutional' ? 44 : 42)
        const collided = occupied.some((item) => {
          const dx = item.x - entry.screenX
          const dy = item.y - entry.screenY
          const d2 = dx * dx + dy * dy
          const minDist = item.radius + radius
          return d2 < minDist * minDist
        })

        if (collided) return
        occupied.push({ x: entry.screenX, y: entry.screenY, radius })

        const record = entry.record
        const targetOpacity = entry.targetOpacity
        record.sprite.visible = true
        const material = record.sprite.material as THREE.SpriteMaterial
        material.opacity += (targetOpacity - material.opacity) * 0.10
        const opacityNorm = clamp(material.opacity / 0.72, 0, 1)
        const targetScaleX = record.baseScaleX * (0.88 + opacityNorm * 0.12)
        const targetScaleY = record.baseScaleY * (0.88 + opacityNorm * 0.12)
        record.sprite.scale.x += (targetScaleX - record.sprite.scale.x) * 0.12
        record.sprite.scale.y += (targetScaleY - record.sprite.scale.y) * 0.12
        record.sprite.position.copy(record.anchor)
      })

      cityHubRecords.forEach((record) => {
        const worldAnchor = record.anchor.clone().applyMatrix4(globeGroup.matrixWorld)
        const cameraDir = camera.position.clone().sub(worldAnchor).normalize()
        const normal = worldAnchor.clone().normalize()
        const visible = normal.dot(cameraDir) > 0.12 && currentDistance <= 4.8
        record.dot.visible = visible
        if (record.label) {
          record.label.visible = visible && currentDistance <= 4.2
        }
        if (!visible) return
        if (record.label) {
          record.label.position.copy(record.anchor.clone().multiplyScalar(1.08))
        }
      })

      const primarySeedPosition = collapseSeed ? nodePositions.get(collapseSeed) : null
      if (collapseSimulationEnabled && primarySeedPosition) {
        collapseSeedHalo.visible = true
        collapseSeedHalo.position.copy(primarySeedPosition)
        collapseSeedHalo.scale.setScalar(0.24 + primaryFrontierPhase * 0.22)
        ;(collapseSeedHalo.material as THREE.SpriteMaterial).opacity = 0.42 + primaryFrontierPhase * 0.42
      } else {
        collapseSeedHalo.visible = false
      }

      const comparisonSeedPosition = comparisonSeed ? nodePositions.get(comparisonSeed) : null
      if (collapseSimulationEnabled && collapseComparisonEnabledRef.current && comparisonSeedPosition) {
        comparisonSeedHalo.visible = true
        comparisonSeedHalo.position.copy(comparisonSeedPosition)
        comparisonSeedHalo.scale.setScalar(0.21 + secondaryFrontierPhase * 0.18)
        ;(comparisonSeedHalo.material as THREE.SpriteMaterial).opacity = 0.28 + secondaryFrontierPhase * 0.34
      } else {
        comparisonSeedHalo.visible = false
      }

      if (selectedFirmIdRef.current) {
        const focusPos = nodePositions.get(selectedFirmIdRef.current)
        if (focusPos) {
          focusHalo.visible = true
          focusHalo.position.copy(focusPos)
          focusHalo.scale.setScalar(0.19 + selectPulse * 0.06)
          ;(focusHalo.material as THREE.SpriteMaterial).opacity = 0.36 + selectPulse * 0.22
        }

        const directNeighbors = [...directNeighborSet]
        directNeighborSprites.forEach((sprite, index) => {
          const id = directNeighbors[index]
          const pos = id ? nodePositions.get(id) : null
          sprite.visible = !!pos
          if (!pos) return
          sprite.position.copy(pos)
          // Neighbour sprites: much smaller amplitude so they glow steadily, not flicker
          sprite.scale.setScalar(0.12 + selectPulse * 0.02)
          ;(sprite.material as THREE.SpriteMaterial).opacity = 0.52 + selectPulse * 0.10
          ;(sprite.material as THREE.SpriteMaterial).color.set('#7af5dc')
        })

        const secondaryNeighbors = [...secondaryNeighborSet]
        secondaryNeighborSprites.forEach((sprite, index) => {
          const id = secondaryNeighbors[index]
          const pos = id ? nodePositions.get(id) : null
          sprite.visible = !!pos
          if (!pos) return
          sprite.position.copy(pos)
          sprite.scale.setScalar(0.09)
          ;(sprite.material as THREE.SpriteMaterial).opacity = 0.22
          ;(sprite.material as THREE.SpriteMaterial).color.set('#d7ebff')
        })
      } else {
        focusHalo.visible = false
        directNeighborSprites.forEach((sprite) => {
          sprite.visible = false
        })
        secondaryNeighborSprites.forEach((sprite) => {
          sprite.visible = false
        })
      }

      if (hoveredId) {
        const hoverPos = nodePositions.get(hoveredId)
        if (hoverPos) {
          hoverHalo.visible = true
          hoverHalo.position.copy(hoverPos)
          hoverHalo.scale.setScalar(0.14)
          ;(hoverHalo.material as THREE.SpriteMaterial).opacity = 0.22
        } else {
          hoverHalo.visible = false
        }
      } else {
        hoverHalo.visible = false
      }

      // Orbit anchor: follow only explicit selection (never hover) to keep framing stable.
      const focusId = selectedFirmIdRef.current

      // Deselection dissolve: when firm is deselected, trigger gold ring pulse at last position
      const newFirmSelected = selectedFirmIdRef.current
      if (newFirmSelected !== prevSelectedFirmIdRef.current) {
        if (!newFirmSelected && prevSelectedFirmIdRef.current) {
          const lastPos = nodePositions.get(prevSelectedFirmIdRef.current)
          if (lastPos) {
            deselectionDissolveRef.active = true
            deselectionDissolveRef.startElapsed = elapsed
            deselectionDissolveRef.position.copy(lastPos)
          }
        }
        prevSelectedFirmIdRef.current = newFirmSelected
      }

      // Dissolve ring animation
      if (deselectionDissolveRef.active) {
        const tRaw = (elapsed - deselectionDissolveRef.startElapsed) / deselectionDissolveRef.duration
        if (tRaw >= 1) {
          deselectionDissolveRef.active = false
          dissolveRing.visible = false
        } else {
          // easeInCubic fade out + scale expansion
          const tEased = tRaw * tRaw * tRaw
          dissolveRing.visible = true
          dissolveRing.position.copy(deselectionDissolveRef.position)
          dissolveRing.scale.setScalar(0.3 + tRaw * 0.6)
          ;(dissolveRing.material as THREE.SpriteMaterial).opacity = (1 - tEased) * 0.55
        }
      } else {
        dissolveRing.visible = false
      }

      // Detect firm selection change → trigger cinematic sweep
      if (newFirmSelected !== prevCinematicFirmId) {
        prevCinematicFirmId = newFirmSelected
        if (newFirmSelected) {
          const sweepPos = nodePositions.get(newFirmSelected)
          if (sweepPos) {
            cinematicRef.active = true
            cinematicRef.startElapsed = elapsed
            cinematicRef.duration = 2.0
            cinematicRef.startTarget.copy(controls.target)
            cinematicRef.endTarget.copy(sweepPos).multiplyScalar(0.38)
            try { performance.mark('globe:cameraSweepStart') } catch { /* */ }
          }
        } else {
          cinematicRef.active = false
        }
      }

      // Detect link selection change → trigger cinematic arc sweep
      const currentLinkKey = selectedLinkPairRef.current
        ? `${selectedLinkPairRef.current.source}:${selectedLinkPairRef.current.target}`
        : null
      if (currentLinkKey !== prevCinematicLinkKey) {
        prevCinematicLinkKey = currentLinkKey
        if (currentLinkKey && selectedLinkPairRef.current && !selectedFirmIdRef.current) {
          const srcPos = nodePositions.get(selectedLinkPairRef.current.source)
          const tgtPos = nodePositions.get(selectedLinkPairRef.current.target)
          if (srcPos && tgtPos) {
            const midpoint = srcPos.clone().add(tgtPos).multiplyScalar(0.5).multiplyScalar(0.45)
            cinematicLinkRef.active = true
            cinematicLinkRef.startElapsed = elapsed
            cinematicLinkRef.duration = 1.6
            cinematicLinkRef.startTarget.copy(controls.target)
            cinematicLinkRef.endTarget.copy(midpoint)
          }
        } else {
          cinematicLinkRef.active = false
        }
      }

      if (focusId) {
        cinematicLinkRef.active = false
        const focusPos = nodePositions.get(focusId)
        if (focusPos) {
          const focusNormal = focusPos.clone().normalize()
          const focusTarget = focusPos.clone().multiplyScalar(0.5)
          controls.minDistance = GLOBE_MIN_DISTANCE
          controls.maxDistance = GLOBE_MAX_DISTANCE

          if (cinematicRef.active && selectedFirmIdRef.current) {
            const tRaw = clamp((elapsed - cinematicRef.startElapsed) / cinematicRef.duration, 0, 1)
            // easeOutExpo for dramatic deceleration into lock
            const tEased = tRaw >= 1 ? 1 : 1 - Math.pow(2, -10 * tRaw)
            controls.target.lerpVectors(cinematicRef.startTarget, cinematicRef.endTarget, tEased)
            if (tRaw >= 1) {
              cinematicRef.active = false
              try { performance.measure('globe:cameraSweep', 'globe:cameraSweepStart') } catch { /* */ }
            }
          } else {
            const lambda = 6.5
            const dt = Math.min(delta, 0.05)
            const lerpT = 1 - Math.exp(-lambda * dt)
            controls.target.lerp(focusTarget, lerpT)
          }

          // Cinematic zoom: tight during sweep, locked when stable.
          const offset = camera.position.clone().sub(controls.target)
          const normalizedOffset = offset.lengthSq() > 0.000001 ? offset.normalize() : new THREE.Vector3(0, 0, 1)
          const currentDistanceToTarget = camera.position.distanceTo(controls.target)
          const sweepProgress = cinematicRef.active
            ? clamp((elapsed - cinematicRef.startElapsed) / Math.max(cinematicRef.duration, 0.001), 0, 1)
            : 1
          const overshootEase = Math.sin(Math.min(sweepProgress, 1) * Math.PI)
          const desiredDistance = cinematicRef.active
            ? 2.35 - overshootEase * 0.22
            : currentDistanceToTarget
          const zoomLerpT = 1 - Math.exp(-8.5 * Math.min(delta, 0.05))
          const nextDistance = THREE.MathUtils.lerp(currentDistanceToTarget, desiredDistance, zoomLerpT)
          camera.position.copy(controls.target).add(normalizedOffset.multiplyScalar(nextDistance))
          if (cinematicRef.active) {
            const shakeAmplitude = (1 - sweepProgress) * 0.006
            camera.position.x += Math.sin(elapsed * 38.0) * shakeAmplitude
            camera.position.y += Math.cos(elapsed * 31.0) * shakeAmplitude * 0.8
          }

          shockUniforms.uShockPoint.value.copy(focusNormal)
          shockUniforms.uShockIntensity.value = collapseSimulationEnabled ? 1.04 + collapseIntensityRef.current * 0.22 : riskShockEnabled ? 1.05 : hoveredId ? 0.7 : 0.56
        }
      } else if (cinematicLinkRef.active && selectedLinkPairRef.current && !selectedFirmIdRef.current) {
        // Cinematic arc sweep: camera drifts to midpoint of selected relation
        const tRaw = clamp((elapsed - cinematicLinkRef.startElapsed) / cinematicLinkRef.duration, 0, 1)
        const tEased = tRaw >= 1 ? 1 : 1 - Math.pow(2, -10 * tRaw)
        controls.target.lerpVectors(cinematicLinkRef.startTarget, cinematicLinkRef.endTarget, tEased)
        controls.minDistance = GLOBE_MIN_DISTANCE
        controls.maxDistance = GLOBE_MAX_DISTANCE
        const desiredDistance = 3.8
        const offset = camera.position.clone().sub(controls.target)
        const normalizedOffset = offset.lengthSq() > 0.000001 ? offset.normalize() : new THREE.Vector3(0, 0, 1)
        const currentDistanceToTarget = camera.position.distanceTo(controls.target)
        const zoomLerpT = 1 - Math.exp(-7.0 * Math.min(delta, 0.05))
        const nextDistance = THREE.MathUtils.lerp(currentDistanceToTarget, desiredDistance, zoomLerpT)
        camera.position.copy(controls.target).add(normalizedOffset.multiplyScalar(nextDistance))
        if (tRaw >= 1) cinematicLinkRef.active = false
      } else {
        cinematicRef.active = false
        cinematicLinkRef.active = false
        controls.minDistance = GLOBE_MIN_DISTANCE
        controls.maxDistance = GLOBE_MAX_DISTANCE
        const dt = Math.min(delta, 0.05)
        const lerpT = 1 - Math.exp(-4.5 * dt)
        controls.target.lerp(new THREE.Vector3(0, 0, 0), lerpT)
        const offset = camera.position.clone().sub(controls.target)
        const normalizedOffset = offset.lengthSq() > 0.000001 ? offset.normalize() : new THREE.Vector3(0, 0, 1)
        const currentDistanceToTarget = camera.position.distanceTo(controls.target)
        const desiredDistance = wantsZoomReset ? 4.8 : currentDistanceToTarget
        if (wantsZoomReset && Math.abs(currentDistanceToTarget - 4.8) < 0.06) wantsZoomReset = false
        const zoomLerpT = 1 - Math.exp(-3.6 * Math.min(delta, 0.05))
        const nextDistance = THREE.MathUtils.lerp(currentDistanceToTarget, desiredDistance, zoomLerpT)
        camera.position.copy(controls.target).add(normalizedOffset.multiplyScalar(nextDistance))
        const hottestNode = graphData.nodes.find((node) => node.risk === 'CRITICAL' || node.risk === 'HIGH')
        const primaryShockPos = collapseSeed ? nodePositions.get(collapseSeed) : null
        const secondaryShockPos = comparisonSeed ? nodePositions.get(comparisonSeed) : null
        if (collapseSimulationEnabled && primaryShockPos && secondaryShockPos && collapseComparisonEnabledRef.current) {
          const blend = (Math.sin(elapsed * 1.4) + 1) * 0.5
          shockUniforms.uShockPoint.value.copy(primaryShockPos.clone().normalize().lerp(secondaryShockPos.clone().normalize(), blend))
        } else if (collapseSimulationEnabled && primaryShockPos) {
          shockUniforms.uShockPoint.value.copy(primaryShockPos.clone().normalize())
        } else if (hottestNode) {
          const hotPos = nodePositions.get(hottestNode.id)
          if (hotPos) {
            shockUniforms.uShockPoint.value.copy(hotPos.clone().normalize())
          }
        }
        shockUniforms.uShockIntensity.value = collapseSimulationEnabled ? 0.82 + collapseIntensityRef.current * 0.18 : riskShockEnabled ? 0.64 : 0
      }

      controls.update()

      // Skip the 7-pass EffectComposer when bloom is off → direct 1-pass render
      // This alone saves ~80% GPU on idle frames and all non-selection frames.
      if (composer && bloomPass.strength > 0.001) {
        composer.render()
      } else {
        renderer.render(scene, camera)
      }
      if (!readyReported) {
        readyReported = true
        // Fade in the canvas on first rendered frame (premium feel, no flash)
        requestAnimationFrame(() => { renderer.domElement.style.opacity = '1' })
        // Perf mark: first frame time
        try { performance.mark('globe:firstFrame') } catch { /* */ }
        onRenderReadyRef.current?.()
      }
      if (continuousAnimation || needsRender || performance.now() - lastRenderKickAt < 180) {
        rafId = requestAnimationFrame(tick)
      } else {
        renderLoopActive = false
        rafId = 0
      }
    }

    const onResize = () => {
      const measured = readViewportSize()
      const nextWidth = Math.max(measured.width, 320)
      const nextHeight = Math.max(measured.height, 520)
      camera.aspect = nextWidth / Math.max(nextHeight, 1)
      camera.updateProjectionMatrix()
      controls.update()
      renderer.setSize(nextWidth, nextHeight)
      composer?.setSize(nextWidth, nextHeight)
      bloomPass.setSize(Math.max(nextWidth / 2, 1), Math.max(nextHeight / 2, 1))
      renderer.domElement.style.width = `${nextWidth}px`
      renderer.domElement.style.height = `${nextHeight}px`
      requestRender()
    }

    const resizeObserver = new ResizeObserver(() => {
      onResize()
    })
    resizeObserver.observe(container)
    if (rootRef.current && rootRef.current !== container) {
      resizeObserver.observe(rootRef.current)
    }

    window.addEventListener('resize', onResize)
    onResize()
    const deferredResizeA = window.requestAnimationFrame(onResize)
    const deferredResizeB = window.setTimeout(onResize, 0)
    const deferredResizeC = window.setTimeout(onResize, 180)
    requestRender()

    return () => {
      cancelAnimationFrame(rafId)
      renderKickRef.current = null
      window.cancelAnimationFrame(deferredResizeA)
      window.clearTimeout(deferredResizeB)
      window.clearTimeout(deferredResizeC)
      resizeObserver.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mouseup', onPointerUp)
      window.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('mousemove', onPointerMove)
      renderer.domElement.removeEventListener('pointermove', onPointerMove as EventListener)
      renderer.domElement.removeEventListener('mousedown', onPointerDown)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown as EventListener)
      renderer.domElement.removeEventListener('mouseleave', onPointerLeave)
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave as EventListener)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.domElement.removeEventListener('dblclick', onDblClick)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.domElement.removeEventListener('webglcontextcreationerror', onContextCreationError as EventListener)
      controls.removeEventListener('change', onControlsChange)
      controls.removeEventListener('start', onControlsStart)
      controls.removeEventListener('end', onControlsEnd)
      controls.dispose()

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose?.()
          const mat = obj.material
          if (Array.isArray(mat)) mat.forEach((item) => item.dispose())
          else mat?.dispose?.()
        }
        if (obj instanceof THREE.Line) {
          obj.geometry?.dispose?.()
          ;(obj.material as THREE.Material)?.dispose?.()
        }
        if (obj instanceof THREE.Points) {
          obj.geometry?.dispose?.()
          ;(obj.material as THREE.Material)?.dispose?.()
        }
      })

      renderer.dispose()
      composer?.dispose?.()
      fallbackEarthTextures.diffuse.dispose()
      fallbackEarthTextures.normal.dispose()
      fallbackEarthTextures.specular.dispose()
      fallbackEarthTextures.bump.dispose()
      dynamicTexturesToDispose.forEach((texture) => texture.dispose())
      geographicLabelRecords.forEach((record) => {
        record.texture.dispose()
      })
      cityHubRecords.forEach((record) => {
        record.labelTexture?.dispose()
        ;(record.dot.material as THREE.SpriteMaterial).map?.dispose?.()
      })
      focusSpriteTexture.dispose()
      directSpriteTexture.dispose()
      secondarySpriteTexture.dispose()
      collapseSeedTexture.dispose()
      comparisonSeedTexture.dispose()
      orbitalDustTexture.dispose()
      anomalyRingTexture.dispose()
      dissolveRingTexture.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
      pointGeomRef.current = null
      highlightPointRef.current = null
    }
    } catch (error) {
      if (renderer) {
        renderer.dispose()
      }
      onRenderErrorRef.current?.(error instanceof Error ? error.message : 'unknown webgl initialization error')
      return
    }
  }, [
    graphData,
    activeLayer,
    regimeMode,
    riskShockEnabled,
    sectorPulseEnabled,
    collapseSimulationEnabled,
    collapseSeedId,
    collapseComparisonEnabled,
    collapseComparisonSeedId,
    collapsePropagationDepth,
    collapseIntensity,
    collapsePlaybackRunning,
    collapsePlaybackSpeed,
    collapsePlaybackStepSignal,
    collapsePlaybackResetSignal,
    autoTourEnabled,
  ])

  if (!graphData.nodes.length) {
    return (
      <div
        className="h-full min-h-[520px] w-full rounded-2xl border border-cyan-500/20 bg-slate-950/40 flex items-center justify-center text-slate-300 text-sm"
        style={{ height: '100%', width: '100%' }}
      >
        No nodes available for GTIXT Globe view.
      </div>
    )
  }

  const cardState = pinnedCard || hoverCard
  const hoverWidth = 284
  const hoverHeight = 260
  const hoverLeft = cardState
    ? Math.max(12, Math.min(cardState.x + 18, Math.max(12, (rootRef.current?.clientWidth || 0) - hoverWidth - 12)))
    : 12
  const hoverTop = cardState
    ? Math.max(12, Math.min(cardState.y + 18, Math.max(12, (rootRef.current?.clientHeight || 0) - hoverHeight - 12)))
    : 12

  const riskBadge = (risk: string | undefined) => {
    const r = (risk || '').toUpperCase()
    if (r === 'CRITICAL') return { bg: 'bg-red-500/20 border-red-400/40', text: 'text-red-300', dot: 'bg-red-400', label: 'Critical' }
    if (r === 'HIGH') return { bg: 'bg-orange-500/20 border-orange-400/40', text: 'text-orange-300', dot: 'bg-orange-400', label: 'High' }
    if (r === 'MEDIUM') return { bg: 'bg-cyan-500/15 border-cyan-400/30', text: 'text-cyan-300', dot: 'bg-cyan-400', label: 'Medium' }
    return { bg: 'bg-emerald-500/15 border-emerald-400/30', text: 'text-emerald-300', dot: 'bg-emerald-400', label: 'Low' }
  }

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full rounded-2xl overflow-hidden border border-cyan-500/20 bg-slate-950/40"
      style={{ position: 'relative', height: '100%', minHeight: 560, width: '100%' }}
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" style={{ position: 'absolute', inset: 0, minHeight: 560, height: '100%', width: '100%' }} />

      {/* Cinematic lock-on overlay — shown when a firm is selected */}
      {selectedNode && (
        <div
          className="absolute bottom-4 left-4 z-10 pointer-events-none"
          style={{ animation: 'fadeInUp 0.4s ease-out' }}
        >
          <div className="flex items-end gap-3 rounded-xl border border-cyan-400/25 bg-slate-950/85 backdrop-blur-md px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-400/80 mb-0.5">Focused Firm</p>
              <p className="text-sm font-bold text-white leading-tight max-w-[18rem] truncate">{selectedNode.label}</p>
              {selectedNode.headquarters && (
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{selectedNode.headquarters}</p>
              )}
            </div>
            {typeof selectedNode.score === 'number' && selectedNode.score > 0 && (
              <div className="flex-shrink-0 text-right">
                <p className="text-[9px] text-slate-500 uppercase tracking-wide">Score</p>
                <p className="text-lg font-black leading-none"
                   style={{ color: selectedNode.score >= 75 ? '#34d399' : selectedNode.score >= 50 ? '#facc15' : '#f87171' }}>
                  {selectedNode.score.toFixed(1)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {hoveredNode && cardState && (() => {
        const rb = riskBadge(hoveredNode.risk)
        const scoreVal = typeof hoveredNode.score === 'number' ? hoveredNode.score : null
        const riskVal = typeof hoveredNode.riskIndex === 'number' ? hoveredNode.riskIndex : null
        const payoutVal = Math.round(hoveredNode.payoutReliability || 0)
        const stabilityVal = Math.round(hoveredNode.operationalStability || 0)
        const links = connectionCountByNode.get(hoveredNode.id) || 0
        const hq = hoveredNode.headquarters || hoveredNode.region || 'Global'
        const { lat: geoLat, lon: geoLon } = resolveNodeLatLon(hoveredNode)
        const coordStr = `${Math.abs(geoLat).toFixed(2)}°${geoLat >= 0 ? 'N' : 'S'} · ${Math.abs(geoLon).toFixed(2)}°${geoLon >= 0 ? 'E' : 'W'}`
        return (
          <div
            className="absolute z-20 w-[284px] rounded-xl border border-cyan-400/25 bg-slate-950/92 p-3.5 text-[11px] text-slate-200 shadow-[0_16px_56px_rgba(0,0,0,0.5)] backdrop-blur-lg pointer-events-none transition-opacity duration-150"
            style={{ left: hoverLeft, top: hoverTop }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-400/80">Firm Intelligence</p>
                <p className="mt-0.5 truncate text-[13px] font-semibold text-white leading-tight">{hoveredNode.label}</p>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">{hq}</p>
                <p className="mt-0.5 font-mono text-[9px] text-slate-500">{coordStr}</p>
              </div>
              <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${rb.bg} ${rb.text}`}>
                <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${rb.dot}`} />
                {rb.label}
              </span>
            </div>

            {cardState.pinned && (
              <p className="mt-1.5 text-[9px] uppercase tracking-[0.08em] text-cyan-300/70">Pinned · click empty space to unpin</p>
            )}

            {hoveredNode.currentEarlyWarning && (
              <div className="mt-2 flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-950/30 px-2 py-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                <span className="text-[10px] font-medium text-amber-300">Early Warning Active</span>
              </div>
            )}

            {/* Score + Risk bars */}
            <div className="mt-3 space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">GTIXT Score</span>
                  <span className="text-[11px] font-medium text-white">{scoreVal !== null ? scoreVal.toFixed(1) : '—'}</span>
                </div>
                {scoreVal !== null && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all" style={{ width: `${Math.min(100, scoreVal)}%` }} />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Risk Index</span>
                  <span className={`text-[11px] font-medium ${rb.text}`}>{riskVal !== null ? riskVal.toFixed(1) : hoveredNode.risk || '—'}</span>
                </div>
                {riskVal !== null && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, riskVal)}%`, background: riskVal >= 65 ? '#ef4444' : riskVal >= 48 ? '#f97316' : riskVal >= 30 ? '#22d3ee' : '#34d399' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Metrics grid */}
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <div className="rounded-md border border-white/8 bg-white/[0.04] px-2 py-1.5 text-center">
                <p className="text-[9px] text-slate-500">Sector</p>
                <p className="mt-0.5 text-[10px] font-medium text-white truncate">{hoveredNode.modelType || '—'}</p>
              </div>
              <div className="rounded-md border border-white/8 bg-white/[0.04] px-2 py-1.5 text-center">
                <p className="text-[9px] text-slate-500">Payout</p>
                <p className="mt-0.5 text-[10px] font-medium text-cyan-300">{payoutVal > 0 ? payoutVal : '—'}</p>
              </div>
              <div className="rounded-md border border-white/8 bg-white/[0.04] px-2 py-1.5 text-center">
                <p className="text-[9px] text-slate-500">Stability</p>
                <p className="mt-0.5 text-[10px] font-medium text-emerald-300">{stabilityVal > 0 ? stabilityVal : '—'}</p>
              </div>
            </div>

            {/* Footer pills */}
            <div className="mt-2.5 flex items-center gap-2 text-[9px] text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">{links} link{links !== 1 ? 's' : ''}</span>
              {hoveredNode.foundedYear && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">Est. {hoveredNode.foundedYear}</span>}
              {hoveredNode.periodDelta != null && hoveredNode.periodDelta !== 0 && (
                <span className={`rounded-full border px-2 py-0.5 ${hoveredNode.periodDelta > 0 ? 'border-red-400/20 bg-red-500/10 text-red-300' : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'}`}>
                  {hoveredNode.periodDelta > 0 ? '▲' : '▼'} {Math.abs(hoveredNode.periodDelta).toFixed(1)}
                </span>
              )}
            </div>
          </div>
        )
      })()}

    </div>
  )
}
