'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { Network, Layers3, Globe2, AlertTriangle, Sparkles, Clock4, ShieldAlert, Wand2, Clapperboard, Play, Pause, Filter, Download, Maximize2, ChevronDown, ChevronUp } from 'lucide-react'
import { SearchBar } from '@/components/ui/SearchBar'
import { Dropdown } from '@/components/ui/Dropdown'
import { Modal } from '@/components/ui/Modal'
import { ToastContainer } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/hooks/useToast'

// Suppress THREE.js deprecation warnings from react-force-graph-3d dependencies
// These warnings come from three-forcegraph/three-render-objects using deprecated THREE.Clock
if (typeof window !== 'undefined') {
  const originalWarn = console.warn
  console.warn = (...args) => {
    const message = args.join(' ')
    // Filter out known THREE.js deprecation warnings from dependencies
    if (message.includes('THREE.Clock') || 
        message.includes('THREE.WebGLRenderer: Texture marked for update but no image data found')) {
      return
    }
    originalWarn.apply(console, args)
  }
}

const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d'),
  { ssr: false }
)

type NodeType = 'prop' | 'broker' | 'platform' | 'liquidity' | 'regulator' | 'aggregator' | 'cluster' | 'geo'

type GraphNode = {
  id: string
  label: string
  type: NodeType
  entityType?: 'star' | 'planet' | 'satellite' | 'nebula' | 'field' | 'cluster' | 'geo'
  score?: number
  risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  jurisdiction?: string
  platform?: string
  influence?: number
  region?: 'USA' | 'EU' | 'UAE' | 'Australia'
  cluster?: 'forex' | 'futures' | 'crypto' | 'quant'
}

type GraphLink = {
  source: string
  target: string
  type: 'broker' | 'platform' | 'regulator' | 'liquidity' | 'aggregator' | 'cluster' | 'region'
}

type RuntimeGraphData = {
  nodes: GraphNode[]
  links: GraphLink[]
}

type DiscoveryFirm = {
  firm_id: string
  name: string
  score?: number
  jurisdiction?: string
  detected_at?: string
  cluster?: 'forex' | 'futures' | 'crypto' | 'quant'
  model_type?: string
  platform?: string
}

type DiscoveryPayload = {
  hasNewFirms: boolean
  count: number
  firms: DiscoveryFirm[]
}

const CATEGORY_COLORS: Record<NodeType, string> = {
  prop: 'var(--gtixt-turquoise-primary, #00ACC1)',
  broker: 'var(--gtixt-info, #29B6F6)',
  platform: '#7C3AED',
  liquidity: 'var(--gtixt-accent-blue, #0D47A1)',
  regulator: 'var(--gtixt-gray-medium, #CFD8DC)',
  aggregator: 'var(--gtixt-accent-cyan, #0097A7)',
  cluster: 'var(--gtixt-accent-slate, #37474F)',
  geo: 'var(--gtixt-info, #29B6F6)',
}

const LOGO_ASSET_MAP: Record<string, string> = {
  ftmo: '/galaxy/logos/ftmo.png',
  fundingpips: '/galaxy/logos/fundingpips.png',
  fundednext: '/galaxy/logos/fundednext.png',
  apex: '/galaxy/logos/apex.png',
  topstep: '/galaxy/logos/topstep.png',
  alpha: '/galaxy/logos/alpha.png',
}

const CAMERA_PATH = ['ftmo', 'fundingpips', 'fundednext', 'apex', 'topstep', 'alpha']

const GALAXY_BACKGROUND_FRAMES = [
  '/galaxy/nebula/nebuleuse-cosmique.png',
  '/galaxy/nebula/nebuleuse-lumineuses.png',
  '/galaxy/backgrounds/salle-de-controle.png',
]

const REAL_SPACE_ENTITY_TEXTURES = {
  star: [
    '/galaxy/stars/soleil.png',
    '/galaxy/stars/red-supergiant.png',
    '/galaxy/stars/white-dwarf.png',
    '/galaxy/stars/blue-supergiant.png',
    '/galaxy/stars/binary-stars.png',
    '/galaxy/stars/pulsar-beams.png',
  ],
  planet: [
    '/galaxy/planets/exoplanete-terrestre.png',
    '/galaxy/planets/planete-geante.png',
    '/galaxy/planets/gas-giant-jupiter.png',
    '/galaxy/planets/ice-giant-neptune.png',
    '/galaxy/planets/rocky-mercury.png',
    '/galaxy/planets/super-earth-ocean.png',
    '/galaxy/planets/volcanic-io.png',
    '/galaxy/planets/desert-mars.png',
    '/galaxy/planets/mini-neptune.png',
    '/galaxy/planets/ringed-saturn.png',
  ],
  satellite: [
    '/galaxy/satellites/lune-detaillée.png',
    '/galaxy/satellites/satelite.png',
    '/galaxy/structures/space-station-iss.png',
    '/galaxy/structures/satellite-comm.png',
    '/galaxy/structures/cargo-vessel.png',
    '/galaxy/structures/solar-array.png',
  ],
  nebula: [
    '/galaxy/nebula/nebuleuse-cosmique.png',
    '/galaxy/nebula/nebuleuse-lumineuses.png',
    '/galaxy/nebulae/pillar-creation-green.png',
    '/galaxy/nebulae/horsehead-red.png',
    '/galaxy/nebulae/orion-blue.png',
    '/galaxy/nebulae/asteroid-belt.png',
    '/galaxy/nebulae/debris-ring.png',
    '/galaxy/nebulae/particle-stream.png',
  ],
} as const

const STAR_CLUSTER_COLORS: Record<'forex' | 'futures' | 'crypto' | 'quant', string> = {
  forex: 'var(--gtixt-turquoise-primary, #00ACC1)',
  futures: 'var(--gtixt-warning, #FFA726)',
  crypto: '#A855F7',
  quant: 'var(--gtixt-success, #4CAF50)',
}

function deterministicIndex(key: string, modulo: number) {
  if (modulo <= 1) return 0
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash) % modulo
}

function resolveCssColor(input: string, fallback = '#00ACC1') {
  if (!input) return fallback
  if (typeof window === 'undefined') return fallback
  const value = input.trim()
  if (!value.startsWith('var(')) return value

  const match = value.match(/var\((--[^,\s\)]+)(?:,\s*([^\)]+))?\)/)
  if (!match) return fallback

  const variableName = match[1]
  const fallbackValue = match[2]?.trim()
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()
  return resolved || fallbackValue || fallback
}

function toRgba(color: string, alpha: number, fallback = '#00ACC1') {
  const resolved = resolveCssColor(color, fallback)
  const threeColor = new THREE.Color(resolved)
  const red = Math.round(threeColor.r * 255)
  const green = Math.round(threeColor.g * 255)
  const blue = Math.round(threeColor.b * 255)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function sanitizeDiscoveryName(name: string): string {
  const raw = (name || '').trim()
  if (!raw) return 'Unknown Firm'

  const withoutNoise = raw
    .replace(/(Forex|Broker|Instant|Futures|Crypto)?\s*Prop\s*Firm\s*\d(?:\.\d)?$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  return withoutNoise || raw
}

// Selective bloom layer: only stars will glow
const BLOOM_LAYER = 1

type YearBucket = '2019' | '2020' | '2021' | '2022' | '2023' | '2024' | '2025'

const timelineYears: YearBucket[] = ['2019', '2020', '2021', '2022', '2023', '2024', '2025']

const graphTimeline: Record<YearBucket, { nodes: GraphNode[]; links: GraphLink[] }> = {
  '2019': {
    nodes: [
      { id: 'ftmo', label: 'FTMO', type: 'prop', entityType: 'star', score: 71, risk: 'MEDIUM', jurisdiction: 'CZ', platform: 'MT5', influence: 80, region: 'EU', cluster: 'forex' },
      { id: 'topstep', label: 'Topstep', type: 'prop', entityType: 'star', score: 68, risk: 'HIGH', jurisdiction: 'US', platform: 'cTrader', influence: 62, region: 'USA' },
      { id: 'eightcap', label: 'Eightcap', type: 'broker', entityType: 'planet', influence: 66 },
      { id: 'mt5', label: 'MT5', type: 'platform', entityType: 'satellite', influence: 74 },
      { id: 'ctrader', label: 'cTrader', type: 'platform', entityType: 'satellite', influence: 52 },
      { id: 'fca', label: 'FCA', type: 'regulator', entityType: 'field', influence: 69 },
      { id: 'sec', label: 'SEC', type: 'regulator', entityType: 'field', influence: 68 },
    ],
    links: [
      { source: 'ftmo', target: 'eightcap', type: 'broker' },
      { source: 'ftmo', target: 'mt5', type: 'platform' },
      { source: 'ftmo', target: 'fca', type: 'regulator' },
      { source: 'topstep', target: 'eightcap', type: 'broker' },
      { source: 'topstep', target: 'ctrader', type: 'platform' },
      { source: 'topstep', target: 'sec', type: 'regulator' },
    ],
  },
  '2020': {
    nodes: [
      { id: 'ftmo', label: 'FTMO', type: 'prop', entityType: 'star', score: 74, risk: 'MEDIUM', jurisdiction: 'CZ', platform: 'MT5', influence: 86, region: 'EU' },
      { id: 'topstep', label: 'Topstep', type: 'prop', entityType: 'star', score: 70, risk: 'MEDIUM', jurisdiction: 'US', platform: 'cTrader', influence: 64, region: 'USA' },
      { id: 'eightcap', label: 'Eightcap', type: 'broker', entityType: 'planet', influence: 69 },
      { id: 'mt5', label: 'MT5', type: 'platform', entityType: 'satellite', influence: 78 },
      { id: 'ctrader', label: 'cTrader', type: 'platform', entityType: 'satellite', influence: 56 },
      { id: 'jump', label: 'Jump Trading', type: 'liquidity', entityType: 'nebula', influence: 60 },
      { id: 'fca', label: 'FCA', type: 'regulator', entityType: 'field', influence: 71 },
      { id: 'sec', label: 'SEC', type: 'regulator', entityType: 'field', influence: 70 },
    ],
    links: [
      { source: 'ftmo', target: 'eightcap', type: 'broker' },
      { source: 'ftmo', target: 'mt5', type: 'platform' },
      { source: 'ftmo', target: 'jump', type: 'liquidity' },
      { source: 'ftmo', target: 'fca', type: 'regulator' },
      { source: 'topstep', target: 'eightcap', type: 'broker' },
      { source: 'topstep', target: 'ctrader', type: 'platform' },
      { source: 'topstep', target: 'sec', type: 'regulator' },
    ],
  },
  '2021': {
    nodes: [
      { id: 'ftmo', label: 'FTMO', type: 'prop', entityType: 'star', score: 78, risk: 'MEDIUM', jurisdiction: 'CZ', platform: 'MT5', influence: 92, region: 'EU', cluster: 'forex' },
      { id: 'topstep', label: 'Topstep', type: 'prop', entityType: 'star', score: 74, risk: 'MEDIUM', jurisdiction: 'US', platform: 'cTrader', influence: 68, region: 'USA', cluster: 'futures' },
      { id: 'eightcap', label: 'Eightcap', type: 'broker', entityType: 'planet', influence: 72 },
      { id: 'mt5', label: 'MT5', type: 'platform', entityType: 'satellite', influence: 82 },
      { id: 'ctrader', label: 'cTrader', type: 'platform', entityType: 'satellite', influence: 59 },
      { id: 'jump', label: 'Jump Trading', type: 'liquidity', entityType: 'nebula', influence: 65 },
      { id: 'fca', label: 'FCA', type: 'regulator', entityType: 'field', influence: 74 },
      { id: 'sec', label: 'SEC', type: 'regulator', entityType: 'field', influence: 74 },
    ],
    links: [
      { source: 'ftmo', target: 'eightcap', type: 'broker' },
      { source: 'ftmo', target: 'mt5', type: 'platform' },
      { source: 'ftmo', target: 'jump', type: 'liquidity' },
      { source: 'ftmo', target: 'fca', type: 'regulator' },
      { source: 'topstep', target: 'eightcap', type: 'broker' },
      { source: 'topstep', target: 'ctrader', type: 'platform' },
      { source: 'topstep', target: 'sec', type: 'regulator' },
    ],
  },
  '2022': {
    nodes: [
      { id: 'ftmo', label: 'FTMO', type: 'prop', entityType: 'star', score: 84, risk: 'LOW', jurisdiction: 'CZ', platform: 'MT5', influence: 95, region: 'EU', cluster: 'forex' },
      { id: 'topstep', label: 'Topstep', type: 'prop', entityType: 'star', score: 79, risk: 'MEDIUM', jurisdiction: 'US', platform: 'cTrader', influence: 72, region: 'USA', cluster: 'futures' },
      { id: 'fundednext', label: 'FundedNext', type: 'prop', entityType: 'star', score: 77, risk: 'MEDIUM', jurisdiction: 'AE', platform: 'MT5', influence: 69, region: 'UAE', cluster: 'crypto' },
      { id: 'eightcap', label: 'Eightcap', type: 'broker', entityType: 'planet', influence: 74 },
      { id: 'mt5', label: 'MT5', type: 'platform', entityType: 'satellite', influence: 84 },
      { id: 'ctrader', label: 'cTrader', type: 'platform', entityType: 'satellite', influence: 61 },
      { id: 'jump', label: 'Jump Trading', type: 'liquidity', entityType: 'nebula', influence: 67 },
      { id: 'wintermute', label: 'Wintermute', type: 'liquidity', entityType: 'nebula', influence: 63 },
      { id: 'fca', label: 'FCA', type: 'regulator', entityType: 'field', influence: 75 },
      { id: 'sec', label: 'SEC', type: 'regulator', entityType: 'field', influence: 76 },
      { id: 'asic', label: 'ASIC', type: 'regulator', entityType: 'field', influence: 73 },
    ],
    links: [
      { source: 'ftmo', target: 'eightcap', type: 'broker' },
      { source: 'ftmo', target: 'mt5', type: 'platform' },
      { source: 'ftmo', target: 'jump', type: 'liquidity' },
      { source: 'topstep', target: 'eightcap', type: 'broker' },
      { source: 'topstep', target: 'ctrader', type: 'platform' },
      { source: 'fundednext', target: 'mt5', type: 'platform' },
      { source: 'fundednext', target: 'wintermute', type: 'liquidity' },
      { source: 'fundednext', target: 'asic', type: 'regulator' },
      { source: 'topstep', target: 'sec', type: 'regulator' },
      { source: 'ftmo', target: 'fca', type: 'regulator' },
    ],
  },
  '2023': {
    nodes: [
      { id: 'ftmo', label: 'FTMO', type: 'prop', entityType: 'star', score: 88, risk: 'LOW', jurisdiction: 'CZ', platform: 'MT5', influence: 98, region: 'EU' },
      { id: 'fundingpips', label: 'FundingPips', type: 'prop', entityType: 'star', score: 83, risk: 'LOW', jurisdiction: 'AE', platform: 'MT5', influence: 81, region: 'UAE' },
      { id: 'topstep', label: 'Topstep', type: 'prop', entityType: 'star', score: 82, risk: 'MEDIUM', jurisdiction: 'US', platform: 'cTrader', influence: 74, region: 'USA' },
      { id: 'fundednext', label: 'FundedNext', type: 'prop', entityType: 'star', score: 84, risk: 'LOW', jurisdiction: 'AE', platform: 'MT5', influence: 82, region: 'UAE' },
      { id: 'eightcap', label: 'Eightcap', type: 'broker', entityType: 'planet', influence: 76 },
      { id: 'purpletrading', label: 'Purple Trading', type: 'broker', entityType: 'planet', influence: 64 },
      { id: 'mt5', label: 'MT5', type: 'platform', entityType: 'satellite', influence: 86 },
      { id: 'ctrader', label: 'cTrader', type: 'platform', entityType: 'satellite', influence: 65 },
      { id: 'jump', label: 'Jump Trading', type: 'liquidity', entityType: 'nebula', influence: 68 },
      { id: 'wintermute', label: 'Wintermute', type: 'liquidity', entityType: 'nebula', influence: 66 },
      { id: 'onezero', label: 'oneZero', type: 'aggregator', influence: 61 },
      { id: 'fca', label: 'FCA', type: 'regulator', entityType: 'field', influence: 75 },
      { id: 'sec', label: 'SEC', type: 'regulator', entityType: 'field', influence: 77 },
      { id: 'asic', label: 'ASIC', type: 'regulator', entityType: 'field', influence: 76 },
    ],
    links: [
      { source: 'ftmo', target: 'eightcap', type: 'broker' },
      { source: 'ftmo', target: 'mt5', type: 'platform' },
      { source: 'ftmo', target: 'jump', type: 'liquidity' },
      { source: 'fundingpips', target: 'purpletrading', type: 'broker' },
      { source: 'fundingpips', target: 'mt5', type: 'platform' },
      { source: 'fundednext', target: 'mt5', type: 'platform' },
      { source: 'topstep', target: 'ctrader', type: 'platform' },
      { source: 'fundednext', target: 'wintermute', type: 'liquidity' },
      { source: 'topstep', target: 'sec', type: 'regulator' },
      { source: 'fundingpips', target: 'asic', type: 'regulator' },
      { source: 'ftmo', target: 'fca', type: 'regulator' },
      { source: 'ftmo', target: 'onezero', type: 'aggregator' },
    ],
  },
  '2024': {
    nodes: [
      { id: 'ftmo', label: 'FTMO', type: 'prop', entityType: 'star', score: 91, risk: 'LOW', jurisdiction: 'CZ', platform: 'MT5', influence: 99, region: 'EU', cluster: 'forex' },
      { id: 'fundingpips', label: 'FundingPips', type: 'prop', entityType: 'star', score: 88, risk: 'LOW', jurisdiction: 'AE', platform: 'MT5', influence: 86, region: 'UAE', cluster: 'forex' },
      { id: 'fundednext', label: 'FundedNext', type: 'prop', entityType: 'star', score: 89, risk: 'LOW', jurisdiction: 'AE', platform: 'MT5', influence: 85, region: 'UAE', cluster: 'futures' },
      { id: 'apex', label: 'Apex Trader', type: 'prop', entityType: 'star', score: 86, risk: 'MEDIUM', jurisdiction: 'US', platform: 'MT5', influence: 79, region: 'USA', cluster: 'forex' },
      { id: 'topstep', label: 'Topstep', type: 'prop', entityType: 'star', score: 85, risk: 'MEDIUM', jurisdiction: 'US', platform: 'cTrader', influence: 76, region: 'USA', cluster: 'futures' },
      { id: 'eightcap', label: 'Eightcap', type: 'broker', entityType: 'planet', influence: 78 },
      { id: 'purpletrading', label: 'Purple Trading', type: 'broker', entityType: 'planet', influence: 66 },
      { id: 'mt5', label: 'MT5', type: 'platform', entityType: 'satellite', influence: 88 },
      { id: 'ctrader', label: 'cTrader', type: 'platform', entityType: 'satellite', influence: 68 },
      { id: 'jump', label: 'Jump Trading', type: 'liquidity', entityType: 'nebula', influence: 69 },
      { id: 'wintermute', label: 'Wintermute', type: 'liquidity', entityType: 'nebula', influence: 68 },
      { id: 'onezero', label: 'oneZero', type: 'aggregator', influence: 63 },
      { id: 'fca', label: 'FCA', type: 'regulator', entityType: 'field', influence: 76 },
      { id: 'sec', label: 'SEC', type: 'regulator', entityType: 'field', influence: 78 },
      { id: 'asic', label: 'ASIC', type: 'regulator', entityType: 'field', influence: 77 },
    ],
    links: [
      { source: 'ftmo', target: 'eightcap', type: 'broker' },
      { source: 'ftmo', target: 'mt5', type: 'platform' },
      { source: 'ftmo', target: 'jump', type: 'liquidity' },
      { source: 'fundingpips', target: 'purpletrading', type: 'broker' },
      { source: 'fundingpips', target: 'mt5', type: 'platform' },
      { source: 'fundednext', target: 'mt5', type: 'platform' },
      { source: 'apex', target: 'eightcap', type: 'broker' },
      { source: 'apex', target: 'mt5', type: 'platform' },
      { source: 'topstep', target: 'ctrader', type: 'platform' },
      { source: 'fundednext', target: 'wintermute', type: 'liquidity' },
      { source: 'apex', target: 'sec', type: 'regulator' },
      { source: 'fundingpips', target: 'asic', type: 'regulator' },
      { source: 'ftmo', target: 'fca', type: 'regulator' },
      { source: 'ftmo', target: 'onezero', type: 'aggregator' },
    ],
  },
  '2025': {
    nodes: [
      { id: 'ftmo', label: 'FTMO', type: 'prop', entityType: 'star', score: 92.4, risk: 'LOW', jurisdiction: 'CZ', platform: 'MT5', influence: 100, region: 'EU', cluster: 'forex' },
      { id: 'fundingpips', label: 'FundingPips', type: 'prop', entityType: 'star', score: 90.5, risk: 'LOW', jurisdiction: 'AE', platform: 'MT5', influence: 89, region: 'UAE', cluster: 'forex' },
      { id: 'fundednext', label: 'FundedNext', type: 'prop', entityType: 'star', score: 91.2, risk: 'LOW', jurisdiction: 'AE', platform: 'MT5', influence: 90, region: 'UAE', cluster: 'futures' },
      { id: 'apex', label: 'Apex Trader', type: 'prop', entityType: 'star', score: 88.1, risk: 'LOW', jurisdiction: 'US', platform: 'MT5', influence: 84, region: 'USA', cluster: 'forex' },
      { id: 'topstep', label: 'Topstep', type: 'prop', entityType: 'star', score: 87.3, risk: 'MEDIUM', jurisdiction: 'US', platform: 'cTrader', influence: 81, region: 'USA', cluster: 'futures' },
      { id: 'alpha', label: 'Alpha Capital', type: 'prop', entityType: 'star', score: 83.4, risk: 'MEDIUM', jurisdiction: 'AU', platform: 'MT5', influence: 70, region: 'Australia', cluster: 'crypto' },
      { id: 'myfundedfx', label: 'MyFundedFX', type: 'prop', entityType: 'star', score: 82.8, risk: 'MEDIUM', jurisdiction: 'US', platform: 'MatchTrader', influence: 67, region: 'USA', cluster: 'crypto' },
      { id: 'eightcap', label: 'Eightcap', type: 'broker', entityType: 'planet', influence: 82 },
      { id: 'purpletrading', label: 'Purple Trading', type: 'broker', entityType: 'planet', influence: 69 },
      { id: 'mt5', label: 'MT5', type: 'platform', entityType: 'satellite', influence: 90 },
      { id: 'ctrader', label: 'cTrader', type: 'platform', entityType: 'satellite', influence: 70 },
      { id: 'dxtrade', label: 'DXtrade', type: 'platform', entityType: 'satellite', influence: 58 },
      { id: 'matchtrader', label: 'MatchTrader', type: 'platform', entityType: 'satellite', influence: 61 },
      { id: 'jump', label: 'Jump Trading', type: 'liquidity', entityType: 'nebula', influence: 71 },
      { id: 'wintermute', label: 'Wintermute', type: 'liquidity', entityType: 'nebula', influence: 70 },
      { id: 'onezero', label: 'oneZero', type: 'aggregator', influence: 66 },
      { id: 'primexm', label: 'PrimeXM', type: 'aggregator', influence: 64 },
      { id: 'fca', label: 'FCA', type: 'regulator', entityType: 'field', influence: 77 },
      { id: 'sec', label: 'SEC', type: 'regulator', entityType: 'field', influence: 79 },
      { id: 'asic', label: 'ASIC', type: 'regulator', entityType: 'field', influence: 79 },
      { id: 'cysec', label: 'CySEC', type: 'regulator', entityType: 'field', influence: 75 },
    ],
    links: [
      { source: 'ftmo', target: 'eightcap', type: 'broker' },
      { source: 'ftmo', target: 'mt5', type: 'platform' },
      { source: 'ftmo', target: 'jump', type: 'liquidity' },
      { source: 'fundingpips', target: 'purpletrading', type: 'broker' },
      { source: 'fundingpips', target: 'mt5', type: 'platform' },
      { source: 'fundednext', target: 'mt5', type: 'platform' },
      { source: 'apex', target: 'eightcap', type: 'broker' },
      { source: 'apex', target: 'mt5', type: 'platform' },
      { source: 'topstep', target: 'ctrader', type: 'platform' },
      { source: 'alpha', target: 'dxtrade', type: 'platform' },
      { source: 'myfundedfx', target: 'matchtrader', type: 'platform' },
      { source: 'myfundedfx', target: 'primexm', type: 'aggregator' },
      { source: 'myfundedfx', target: 'eightcap', type: 'broker' },
      { source: 'fundednext', target: 'wintermute', type: 'liquidity' },
      { source: 'apex', target: 'sec', type: 'regulator' },
      { source: 'fundingpips', target: 'asic', type: 'regulator' },
      { source: 'ftmo', target: 'fca', type: 'regulator' },
      { source: 'ftmo', target: 'onezero', type: 'aggregator' },
      { source: 'fundednext', target: 'primexm', type: 'aggregator' },
      { source: 'fundingpips', target: 'cysec', type: 'regulator' },
      { source: 'alpha', target: 'cysec', type: 'regulator' },
    ],
  },
}

const displayGroups = [
  { key: 'prop', label: 'Prop firms' },
  { key: 'broker', label: 'Brokers' },
  { key: 'platform', label: 'Platforms' },
  { key: 'liquidity', label: 'Liquidity' },
  { key: 'regulator', label: 'Regulators' },
] as const

type GraphMode = 'network' | 'cluster' | 'geo'

function createLogoSprite(label: string, color = '#00D4C6') {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) return new THREE.Sprite()

  const initials = label
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()

  const gradient = context.createRadialGradient(128, 128, 24, 128, 128, 128)
  gradient.addColorStop(0, toRgba(color, 0.93))
  gradient.addColorStop(1, '#020617')
  context.fillStyle = gradient
  context.beginPath()
  context.arc(128, 128, 120, 0, Math.PI * 2)
  context.fill()

  context.strokeStyle = 'rgba(255,255,255,0.35)'
  context.lineWidth = 8
  context.beginPath()
  context.arc(128, 128, 116, 0, Math.PI * 2)
  context.stroke()

  context.fillStyle = 'white'
  context.font = 'bold 72px Inter, Arial, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(initials, 128, 136)

  const texture = new THREE.CanvasTexture(canvas)
  // needsUpdate is automatically set by CanvasTexture constructor
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(4.2, 4.2, 1)
  return sprite
}

function createLensFlare(color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) return new THREE.Sprite()

  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 120)
  gradient.addColorStop(0, toRgba(color, 1))
  gradient.addColorStop(0.4, toRgba(color, 0.4))
  gradient.addColorStop(1, toRgba(color, 0))
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 256)

  const texture = new THREE.CanvasTexture(canvas)
  // needsUpdate is automatically set by CanvasTexture constructor
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    alphaTest: 0.02,
    blending: THREE.AdditiveBlending,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(7.6, 7.6, 1)
  sprite.renderOrder = 28
  sprite.userData.pulse = true
  return sprite
}

function createTextBillboard(text: string, color = '#D9F8FF') {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 160
  const context = canvas.getContext('2d')
  if (!context) return new THREE.Sprite()

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = 'rgba(2, 6, 23, 0.72)'
  context.fillRect(16, 32, 480, 96)
  context.strokeStyle = 'rgba(34, 230, 218, 0.55)'
  context.lineWidth = 3
  context.strokeRect(16, 32, 480, 96)

  context.font = '700 48px Inter, Arial, sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = color
  context.fillText(text, 256, 82)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(8.4, 2.6, 1)
  return sprite
}

function getScoreTier(score?: number) {
  if (score === undefined) return 'N/A'
  if (score >= 90) return 'Tier 1'
  if (score >= 80) return 'Tier 2'
  if (score >= 70) return 'Tier 3'
  return 'Tier 4'
}

function createPlanetTexture(primary = '#0EA5E9', secondary = '#1E3A8A') {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) return null

  context.fillStyle = '#020617'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const baseGradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
  baseGradient.addColorStop(0, primary)
  baseGradient.addColorStop(0.6, secondary)
  baseGradient.addColorStop(1, '#0F172A')
  context.globalAlpha = 0.8
  context.fillStyle = baseGradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.globalAlpha = 0.35
  for (let stripe = 0; stripe < 14; stripe++) {
    const y = (stripe / 14) * canvas.height
    const height = 8 + Math.random() * 16
    context.fillStyle = stripe % 2 === 0 ? '#7DD3FC' : '#1E40AF'
    context.fillRect(0, y, canvas.width, height)
  }

  context.globalAlpha = 0.15
  for (let spot = 0; spot < 24; spot++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const r = 6 + Math.random() * 20
    context.beginPath()
    context.fillStyle = '#E0F2FE'
    context.arc(x, y, r, 0, Math.PI * 2)
    context.fill()
  }

  context.globalAlpha = 1
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

function createRealSpaceOverlaySprite(
  texture: THREE.Texture,
  opacity: number,
  scale: number,
  color?: string
) {
  const materialConfig: THREE.SpriteMaterialParameters = {
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }

  if (color) {
    materialConfig.color = color
  }

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial(materialConfig)
  )
  const spriteMaterial = sprite.material as THREE.SpriteMaterial
  spriteMaterial.depthTest = false
  spriteMaterial.depthWrite = false
  spriteMaterial.alphaTest = 0.02
  sprite.scale.set(scale, scale, 1)
  sprite.renderOrder = 26
  sprite.userData.realSpaceSprite = true
  return sprite
}

function createSpaceDome() {
  const starCount = 4000
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(starCount * 3)

  for (let index = 0; index < starCount * 3; index += 3) {
    const radius = 900 + Math.random() * 300
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[index] = radius * Math.sin(phi) * Math.cos(theta)
    positions[index + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[index + 2] = radius * Math.cos(phi)
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    color: '#9AE6FF',
    size: 1.2,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  })

  const stars = new THREE.Points(geometry, material)
  stars.userData.spaceDome = true
  return stars
}

function createNebulaCloud(color: string, scale = 1) {
  const geometry = new THREE.SphereGeometry(26 * scale, 18, 18)
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.028,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
  const cloud = new THREE.Mesh(geometry, material)
  cloud.renderOrder = 4
  cloud.userData.nebula = true
  return cloud
}

export default function IndustryMapGraph({ runtimeGraph }: { runtimeGraph?: RuntimeGraphData }) {
  const graphRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const flyThroughTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flyThroughIndexRef = useRef(0)
  const lastNodeClickRef = useRef<{ id: string; ts: number } | null>(null)
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null)
  const textureCacheRef = useRef<Record<string, THREE.Texture>>({})
  const spriteMaterialCacheRef = useRef<Record<string, THREE.SpriteMaterial>>({})
  const geometryCacheRef = useRef<Record<string, THREE.BufferGeometry>>({})
  const materialCacheRef = useRef<Record<string, THREE.Material>>({})
  const spinObjectsRef = useRef<any[]>([])
  const bobObjectsRef = useRef<any[]>([])
  const pulseObjectsRef = useRef<any[]>([])
  const gravityObjectsRef = useRef<any[]>([])
  const starBreathingObjectsRef = useRef<any[]>([])
  const animatedRegistryRef = useRef<WeakSet<any>>(new WeakSet())
  const [mode, setMode] = useState<GraphMode>('network')
  const [year, setYear] = useState<YearBucket>('2025')
  const [showTypes, setShowTypes] = useState<Record<string, boolean>>({
    prop: true,
    broker: true,
    platform: true,
    liquidity: true,
    regulator: true,
    aggregator: true,
  })
  const [scoreThreshold, setScoreThreshold] = useState(70)
  const [riskPropagation, setRiskPropagation] = useState(false)
  const [crisisMode, setCrisisMode] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [explainCluster, setExplainCluster] = useState(false)
  const [flyThroughActive, setFlyThroughActive] = useState(false)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)
  const [livePulseMode, setLivePulseMode] = useState(true) // NEW: Live pulse enabled by default
  const [bgFrameIndex, setBgFrameIndex] = useState(0)
  const [realSpaceEnabled, setRealSpaceEnabled] = useState(true)
  const [backgroundIntensity, setBackgroundIntensity] = useState(55)
  const [institutionalOverlay, setInstitutionalOverlay] = useState(true)
  const [cameraInertia, setCameraInertia] = useState(true)
  const [densityLevel, setDensityLevel] = useState(92)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [liveDiscoveryGraph, setLiveDiscoveryGraph] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
    nodes: [],
    links: [],
  })
  
  // New: Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [filterCluster, setFilterCluster] = useState<string>('all')
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [mobileControlsExpanded, setMobileControlsExpanded] = useState(false)
  
  // Toast notifications
  const { toasts, success, error, info, warning } = useToast()
  const hoverClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoveredNodeIdRef = useRef<string | null>(null)
  const discoveryNodeIdsRef = useRef<Set<string>>(new Set())
  const discoveryLinkIdsRef = useRef<Set<string>>(new Set())
  const activeBackgroundFrames = GALAXY_BACKGROUND_FRAMES.length
    ? GALAXY_BACKGROUND_FRAMES
    : ['/galaxy/nebula/nebuleuse-cosmique.png']

  const toSafeId = (value: string, prefix = 'node') => {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return normalized || `${prefix}-${Date.now()}`
  }

  const inferRegionFromJurisdiction = (jurisdiction?: string): NonNullable<GraphNode['region']> => {
    if (!jurisdiction) return 'EU'
    const token = jurisdiction.trim().toUpperCase()
    if (['US', 'USA', 'UNITED STATES'].includes(token)) return 'USA'
    if (['AE', 'UAE', 'DUBAI'].includes(token)) return 'UAE'
    if (['AU', 'AUS', 'AUSTRALIA'].includes(token)) return 'Australia'
    return 'EU'
  }

  const inferRiskFromScore = (score: number): GraphNode['risk'] => {
    if (score >= 85) return 'LOW'
    if (score >= 75) return 'MEDIUM'
    if (score >= 65) return 'HIGH'
    return 'CRITICAL'
  }

  const normalizePlatformId = (platform?: string) => {
    if (!platform) return null
    const value = platform.toLowerCase()
    if (value.includes('mt5') || value.includes('metatrader 5')) return 'mt5'
    if (value.includes('ctrader')) return 'ctrader'
    if (value.includes('dxtrade')) return 'dxtrade'
    if (value.includes('matchtrader')) return 'matchtrader'
    return `platform-${toSafeId(platform, 'platform')}`
  }

  const regulatorByJurisdiction = (jurisdiction?: string) => {
    if (!jurisdiction) return null
    const token = jurisdiction.trim().toUpperCase()
    if (['UK', 'GB', 'UNITED KINGDOM'].includes(token)) return 'fca'
    if (['US', 'USA', 'UNITED STATES'].includes(token)) return 'sec'
    if (['AU', 'AUS', 'AUSTRALIA'].includes(token)) return 'asic'
    if (['CY', 'CYPRUS'].includes(token)) return 'cysec'
    return null
  }

  const registerAnimatedObject = (object: any) => {
    if (!object || animatedRegistryRef.current.has(object)) return
    animatedRegistryRef.current.add(object)
    if (object.userData.spinY) spinObjectsRef.current.push(object)
    if (object.userData.bob) bobObjectsRef.current.push(object)
    if (object.userData.pulse) pulseObjectsRef.current.push(object)
    if (object.userData.gravityWell) gravityObjectsRef.current.push(object)
    if (object.userData.starBreathing) starBreathingObjectsRef.current.push(object)
  }

  const getSharedGeometry = <T extends THREE.BufferGeometry>(key: string, factory: () => T): T => {
    if (!geometryCacheRef.current[key]) {
      geometryCacheRef.current[key] = factory()
    }
    return geometryCacheRef.current[key] as T
  }

  const getSharedMaterial = <T extends THREE.Material>(key: string, factory: () => T): T => {
    if (!materialCacheRef.current[key]) {
      materialCacheRef.current[key] = factory()
    }
    return materialCacheRef.current[key] as T
  }

  useEffect(() => {
    hoveredNodeIdRef.current = hoveredNodeId
  }, [hoveredNodeId])

  useEffect(() => {
    return () => {
      if (hoverClearTimerRef.current) {
        clearTimeout(hoverClearTimerRef.current)
        hoverClearTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()

    const pollDiscoveries = async () => {
      try {
        const response = await fetch('/api/galaxy/discoveries', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) return

        const payload = (await response.json()) as DiscoveryPayload
        if (!mounted || !payload?.firms?.length) return

        const nextNodes: GraphNode[] = []
        const nextLinks: GraphLink[] = []

        for (const firm of payload.firms) {
          if (!firm?.firm_id || !firm?.name) continue

          const sanitizedName = sanitizeDiscoveryName(firm.name)

          const propId = toSafeId(firm.firm_id, 'prop')
          if (!discoveryNodeIdsRef.current.has(propId)) {
            const rawScore = Number(firm.score)
            const effectiveScore = Number.isFinite(rawScore) && rawScore > 0 ? rawScore : 72
            const score = Math.max(50, Math.min(99, effectiveScore))
            const region = inferRegionFromJurisdiction(firm.jurisdiction)
            nextNodes.push({
              id: propId,
              label: sanitizedName,
              type: 'prop',
              entityType: 'star',
              score,
              risk: inferRiskFromScore(score),
              jurisdiction: firm.jurisdiction,
              platform: firm.platform,
              influence: Math.max(58, Math.round(score + 6)),
              region,
              cluster: firm.cluster,
            })
            discoveryNodeIdsRef.current.add(propId)
          }

          const region = inferRegionFromJurisdiction(firm.jurisdiction)
          const brokerId = `broker-${region.toLowerCase()}-hub`
          if (!discoveryNodeIdsRef.current.has(brokerId)) {
            nextNodes.push({
              id: brokerId,
              label: `${region} Prime Broker`,
              type: 'broker',
              entityType: 'planet',
              influence: 64,
            })
            discoveryNodeIdsRef.current.add(brokerId)
          }

          const brokerLinkId = `${propId}->${brokerId}:broker`
          if (!discoveryLinkIdsRef.current.has(brokerLinkId)) {
            nextLinks.push({ source: propId, target: brokerId, type: 'broker' })
            discoveryLinkIdsRef.current.add(brokerLinkId)
          }

          const platformId = normalizePlatformId(firm.platform)
          if (platformId) {
            if (!discoveryNodeIdsRef.current.has(platformId)) {
              nextNodes.push({
                id: platformId,
                label: firm.platform || platformId.toUpperCase(),
                type: 'platform',
                entityType: 'satellite',
                influence: 62,
              })
              discoveryNodeIdsRef.current.add(platformId)
            }

            const platformLinkId = `${propId}->${platformId}:platform`
            if (!discoveryLinkIdsRef.current.has(platformLinkId)) {
              nextLinks.push({ source: propId, target: platformId, type: 'platform' })
              discoveryLinkIdsRef.current.add(platformLinkId)
            }
          }

          const regulatorId = regulatorByJurisdiction(firm.jurisdiction)
          if (regulatorId) {
            const regulatorLinkId = `${propId}->${regulatorId}:regulator`
            if (!discoveryLinkIdsRef.current.has(regulatorLinkId)) {
              nextLinks.push({ source: propId, target: regulatorId, type: 'regulator' })
              discoveryLinkIdsRef.current.add(regulatorLinkId)
            }
          }
        }

        if (nextNodes.length === 0 && nextLinks.length === 0) return

        setLiveDiscoveryGraph((prev) => ({
          nodes: [...prev.nodes, ...nextNodes],
          links: [...prev.links, ...nextLinks],
        }))
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }

    pollDiscoveries()
    const interval = setInterval(pollDiscoveries, 30000)

    return () => {
      mounted = false
      controller.abort()
      clearInterval(interval)
    }
  }, [])

  const updateHoveredNode = (nextNodeId: string | null) => {
    if (nextNodeId) {
      if (hoverClearTimerRef.current) {
        clearTimeout(hoverClearTimerRef.current)
        hoverClearTimerRef.current = null
      }
      if (hoveredNodeIdRef.current === nextNodeId) return
      hoveredNodeIdRef.current = nextNodeId
      setHoveredNodeId(nextNodeId)
      return
    }

    if (hoverClearTimerRef.current) return
    hoverClearTimerRef.current = setTimeout(() => {
      hoverClearTimerRef.current = null
      if (hoveredNodeIdRef.current === null) return
      hoveredNodeIdRef.current = null
      setHoveredNodeId(null)
    }, 80)
  }

  const clearHoveredNodeImmediately = () => {
    if (hoverClearTimerRef.current) {
      clearTimeout(hoverClearTimerRef.current)
      hoverClearTimerRef.current = null
    }
    if (hoveredNodeIdRef.current === null) return
    hoveredNodeIdRef.current = null
    setHoveredNodeId(null)
  }

  const getTextureByPath = (assetPath: string) => {
    if (!textureLoaderRef.current) {
      textureLoaderRef.current = new THREE.TextureLoader()
    }

    if (!textureCacheRef.current[assetPath]) {
      const texture = textureLoaderRef.current.load(
        assetPath,
        (loadedTexture) => {
          loadedTexture.colorSpace = THREE.SRGBColorSpace
          loadedTexture.needsUpdate = true
        },
        undefined,
        (error) => {
          console.error('[RealSpace] ✗ Failed to load texture:', assetPath, error)
        }
      )
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
      textureCacheRef.current[assetPath] = texture
    }

    return textureCacheRef.current[assetPath]
  }

  const getEntityTexture = (
    entityType: keyof typeof REAL_SPACE_ENTITY_TEXTURES,
    nodeId: string
  ) => {
    const pool = REAL_SPACE_ENTITY_TEXTURES[entityType]
    if (!pool.length) {
      console.warn('[RealSpace] No textures in pool for:', entityType)
      return undefined
    }
    const texturePath = pool[deterministicIndex(`${entityType}:${nodeId}`, pool.length)]
    return getTextureByPath(texturePath)
  }

  // Pre-load all real-space textures on mount
  useEffect(() => {
    if (!realSpaceEnabled) {
      return
    }
    Object.entries(REAL_SPACE_ENTITY_TEXTURES).forEach(([, paths]) => {
      paths.forEach((path) => {
        getTextureByPath(path)
      })
    })
    activeBackgroundFrames.forEach((path) => {
      getTextureByPath(path)
    })
  }, [activeBackgroundFrames, realSpaceEnabled])

  useEffect(() => {
    return () => {
      Object.values(textureCacheRef.current).forEach((texture) => texture.dispose())
      Object.values(spriteMaterialCacheRef.current).forEach((material) => material.dispose())
      Object.values(geometryCacheRef.current).forEach((geometry) => geometry.dispose())
      Object.values(materialCacheRef.current).forEach((material) => material.dispose())

      textureCacheRef.current = {}
      spriteMaterialCacheRef.current = {}
      geometryCacheRef.current = {}
      materialCacheRef.current = {}

      spinObjectsRef.current = []
      bobObjectsRef.current = []
      pulseObjectsRef.current = []
      gravityObjectsRef.current = []
      starBreathingObjectsRef.current = []
      animatedRegistryRef.current = new WeakSet()
    }
  }, [])

  useEffect(() => {
    if (activeBackgroundFrames.length <= 1) {
      setBgFrameIndex(0)
      return
    }
    const timer = setInterval(() => {
      setBgFrameIndex((prev) => (prev + 1) % activeBackgroundFrames.length)
    }, 9000)
    return () => clearInterval(timer)
  }, [activeBackgroundFrames.length])

  useEffect(() => {
    let mounted = true

    const setupScene = () => {
      if (!mounted || !graphRef.current) return false

      const graph = graphRef.current as any
      const scene = graph.scene?.()
      if (!scene) return false

      const renderer = graph.renderer?.()
      if (renderer) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.15
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.physicallyCorrectLights = true
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      }

      const controls = graph.controls?.()
      if (controls) {
        controls.enableDamping = true
        controls.dampingFactor = cameraInertia ? 0.11 : 0.06
        controls.rotateSpeed = 0.44
        controls.zoomSpeed = 0.72
        controls.panSpeed = 0.62
        controls.autoRotate = cameraInertia
        controls.autoRotateSpeed = 0.24

        // Compatible smoothing/range knobs across Orbit/Trackball-like controls
        if ('dynamicDampingFactor' in controls) {
          controls.dynamicDampingFactor = cameraInertia ? 0.2 : 0.14
        }
        if ('staticMoving' in controls) {
          controls.staticMoving = false
        }
        if ('minDistance' in controls) {
          controls.minDistance = 34
        }
        if ('maxDistance' in controls) {
          controls.maxDistance = 980
        }
      }

      const composer = graph.postProcessingComposer?.()
      if (composer && !scene.userData.realBloomEnabled) {
        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          1.08,
          0.32,
          0.9
        )
        composer.addPass(bloomPass)
        scene.userData.realBloomEnabled = true
        scene.userData.bloomPass = bloomPass
      }

      if (!scene.userData.galaxyEnhanced) {
        scene.userData.galaxyEnhanced = true

        const ambient = new THREE.AmbientLight('#5FD7FF', 0.65)
        const keyLight = new THREE.PointLight('#00D4C6', 1.2, 0, 2)
        keyLight.position.set(180, 120, 90)
        const fillLight = new THREE.PointLight('#0EA5E9', 0.9, 0, 2)
        fillLight.position.set(-220, -80, -120)

        scene.add(ambient)
        scene.add(keyLight)
        scene.add(fillLight)
        scene.add(createSpaceDome())

        const nebulaA = createNebulaCloud('#00D4C6', 0.72)
        nebulaA.position.set(180, -40, -360)
        const nebulaB = createNebulaCloud('#0EA5E9', 0.62)
        nebulaB.position.set(-220, 120, -300)
        scene.add(nebulaA)
        scene.add(nebulaB)

        scene.fog = new THREE.FogExp2('#020617', 0.00095)
      }

      return true
    }

    const animate = () => {
      if (!mounted || !graphRef.current) return
      const time = performance.now() * 0.001

      spinObjectsRef.current = spinObjectsRef.current.filter((object) => {
        if (!object?.parent) return false
        object.rotation.y += object.userData.spinY
        return true
      })

      bobObjectsRef.current = bobObjectsRef.current.filter((object) => {
        if (!object?.parent) return false
        object.position.y = object.userData.baseY + Math.sin(time * object.userData.bob.speed + object.userData.bob.phase) * object.userData.bob.amp
        return true
      })

      pulseObjectsRef.current = pulseObjectsRef.current.filter((object) => {
        if (!object?.parent) return false
        if (object.material) {
          object.material.opacity = 0.38 + Math.sin(time * 2.6) * 0.18
        }
        return true
      })

      gravityObjectsRef.current = gravityObjectsRef.current.filter((object) => {
        if (!object?.parent) return false
        const pulse = 1 + Math.sin(time * object.userData.speed + object.userData.phase) * 0.05
        object.scale.setScalar(pulse)
        if (object.material) {
          object.material.opacity = 0.2 + Math.sin(time * object.userData.speed + object.userData.phase) * 0.06
        }
        return true
      })

      starBreathingObjectsRef.current = starBreathingObjectsRef.current.filter((object) => {
        if (!object?.parent) return false
        if (object.material && object.material.emissiveIntensity !== undefined) {
          if (livePulseMode) {
            const pulseSpeed = object.userData.pulseSpeed || 2.0
            const pulseAmplitude = object.userData.pulseAmplitude || 0.35
            const baseIntensity = object.userData.baseIntensity || 0.65
            object.material.emissiveIntensity = baseIntensity + Math.sin(time * pulseSpeed) * pulseAmplitude
          } else {
            object.material.emissiveIntensity = object.userData.baseIntensity || 0.65
          }
        }
        return true
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    const waitUntilReady = () => {
      if (setupScene()) {
        animate()
      } else {
        animationFrameRef.current = requestAnimationFrame(waitUntilReady)
      }
    }

    waitUntilReady()

    const onResize = () => {
      const graph = graphRef.current as any
      const scene = graph?.scene?.()
      const bloomPass = scene?.userData?.bloomPass as UnrealBloomPass | undefined
      if (bloomPass) {
        bloomPass.resolution.set(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener('resize', onResize)

    return () => {
      mounted = false
      window.removeEventListener('resize', onResize)
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [cameraInertia])

  useEffect(() => {
    const graph = graphRef.current as any
    const scene = graph?.scene?.()
    if (!scene || mode !== 'network') return

    const staleWells: THREE.Object3D[] = []
    scene.traverse((object: any) => {
      if (object.userData?.gravityWell) staleWells.push(object)
    })
    staleWells.forEach((well) => scene.remove(well))

    const timer = setTimeout(() => {
      const runtimeData = graph.graphData?.()
      const props = ((runtimeData?.nodes ?? []) as any[]).filter(
        (node) => node.type === 'prop' && node.cluster && node.x !== undefined
      )
      if (!props.length) return

      const centroids = new Map<string, { x: number; y: number; z: number; count: number }>()
      for (const node of props) {
        const key = node.cluster as string
        const current = centroids.get(key) ?? { x: 0, y: 0, z: 0, count: 0 }
        current.x += node.x
        current.y += node.y
        current.z += node.z
        current.count += 1
        centroids.set(key, current)
      }

      centroids.forEach((entry, key) => {
        if (entry.count <= 0) return
        const color = STAR_CLUSTER_COLORS[key as keyof typeof STAR_CLUSTER_COLORS] ?? '#22E6DA'
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(12 + entry.count * 1.4, 16 + entry.count * 1.7, 72),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
        )
        ring.userData.gravityWell = true
        ring.userData.speed = 1.4 + entry.count * 0.08
        ring.userData.phase = Math.random() * Math.PI * 2
        ring.position.set(entry.x / entry.count, entry.y / entry.count - 1.5, entry.z / entry.count)
        ring.rotation.x = Math.PI / 2
        registerAnimatedObject(ring)
        scene.add(ring)
      })
    }, 900)

    return () => clearTimeout(timer)
  }, [crisisMode, densityLevel, mode, scoreThreshold, showTypes, year])

  // Export PNG functionality
  const exportGraphAsPNG = useCallback(() => {
    if (!graphRef.current) {
      error('Export failed', 'Graph not ready. Please wait for it to load.')
      return
    }

    try {
      setIsExporting(true)
      info('Preparing export...', 'Generating PNG image of the current view.')
      
      const canvas = graphRef.current.renderer()?.domElement
      if (!canvas) {
        throw new Error('Canvas not found')
      }

      // Create a high-res snapshot
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to generate image')
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `gtixt-galaxy-${year}-${mode}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        success('Export successful!', 'Galaxy map saved as PNG.')
        setIsExporting(false)
      }, 'image/png', 1.0)
    } catch (err) {
      error('Export failed', err instanceof Error ? err.message : 'Unknown error occurred')
      setIsExporting(false)
    }
  }, [year, mode, error, info, success])

  // Clear filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setFilterRegion('all')
    setFilterRisk('all')
    setFilterCluster('all')
    setScoreThreshold(70)
    info('Filters cleared', 'All filters have been reset to defaults.')
  }, [info])

  // Initialize loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const graphData = useMemo(() => {
    const seed = graphTimeline[year]
    const hasRuntimeGraph = year === '2025' && Boolean(runtimeGraph?.nodes?.length)
    const baseSeedNodes = hasRuntimeGraph ? runtimeGraph!.nodes : seed.nodes
    const baseSeedLinks = hasRuntimeGraph ? (runtimeGraph?.links || []) : seed.links
    const liveNodes = year === '2025' ? liveDiscoveryGraph.nodes : []
    const liveLinks = year === '2025' ? liveDiscoveryGraph.links : []

    const mergedSeedNodes = [...baseSeedNodes, ...liveNodes]
    const mergedSeedLinks = [...baseSeedLinks, ...liveLinks]

    const baseNodes = mergedSeedNodes.filter((node) => {
      // Type filter
      if (!showTypes[node.type]) return false

      const query = searchQuery.trim().toLowerCase()
      const matchesSearch = query
        ? Boolean(
            node.label?.toLowerCase().includes(query) ||
              node.jurisdiction?.toLowerCase().includes(query) ||
              node.platform?.toLowerCase().includes(query)
          )
        : false
      
      // Score threshold filter
      if (node.type === 'prop' && (node.score ?? 0) < scoreThreshold && !matchesSearch) return false
      
      // Search query filter
      if (query && !matchesSearch) {
        return false
      }
      
      // Region filter
      if (filterRegion !== 'all' && node.region && node.region !== filterRegion) {
        return false
      }
      
      // Risk filter
      if (filterRisk !== 'all' && node.risk && node.risk !== filterRisk) {
        return false
      }
      
      // Cluster filter
      if (filterCluster !== 'all' && node.cluster && node.cluster !== filterCluster) {
        return false
      }
      
      return true
    })

    const baseNodeIds = new Set(baseNodes.map((node) => node.id))
    const baseLinks = mergedSeedLinks.filter((link) => {
      if (!baseNodeIds.has(link.source) || !baseNodeIds.has(link.target)) return false
      if (densityLevel >= 100) return true
      const signature = `${year}:${mode}:${link.source}->${link.target}:${link.type}`
      return deterministicIndex(signature, 100) < densityLevel
    })

    if (mode === 'network') {
      return {
        nodes: baseNodes.map((node) =>
          crisisMode && node.type === 'prop'
            ? {
                ...node,
                risk: node.risk === 'LOW' ? 'MEDIUM' : node.risk === 'MEDIUM' ? 'HIGH' : 'CRITICAL',
                score: Math.max(50, (node.score ?? 70) - 8),
              }
            : node
        ),
        links: baseLinks,
      }
    }

    if (mode === 'cluster') {
      const clusterNodes: GraphNode[] = [
        { id: 'cluster-mt5', label: 'Cluster MT5 Firms', type: 'cluster' },
        { id: 'cluster-ctrader', label: 'Cluster cTrader Firms', type: 'cluster' },
      ]

      const clusterLinks: GraphLink[] = baseNodes
        .filter((node) => node.type === 'prop')
        .map((node) => ({
          source: node.id,
          target: node.platform === 'cTrader' ? 'cluster-ctrader' : 'cluster-mt5',
          type: 'cluster',
        }))

      return {
        nodes: [...baseNodes, ...clusterNodes],
        links: [...baseLinks, ...clusterLinks],
      }
    }

    const geoNodes: GraphNode[] = [
      { id: 'geo-usa', label: 'USA', type: 'geo' },
      { id: 'geo-eu', label: 'EU', type: 'geo' },
      { id: 'geo-uae', label: 'UAE', type: 'geo' },
      { id: 'geo-aus', label: 'Australia', type: 'geo' },
    ]

    const regionTarget = (region?: GraphNode['region']) => {
      if (region === 'USA') return 'geo-usa'
      if (region === 'EU') return 'geo-eu'
      if (region === 'UAE') return 'geo-uae'
      return 'geo-aus'
    }

    const geoLinks: GraphLink[] = baseNodes
      .filter((node) => node.type === 'prop')
      .map((node) => ({ source: node.id, target: regionTarget(node.region), type: 'region' }))

    return {
      nodes: [...baseNodes, ...geoNodes],
      links: [...baseLinks, ...geoLinks],
    }
  }, [
    crisisMode,
    densityLevel,
    liveDiscoveryGraph.links,
    liveDiscoveryGraph.nodes,
    mode,
    runtimeGraph,
    scoreThreshold,
    showTypes,
    year,
    searchQuery,
    filterRegion,
    filterRisk,
    filterCluster,
  ])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return (graphData.nodes as GraphNode[])
      .filter((node) => {
        const inLabel = node.label?.toLowerCase().includes(query)
        const inJurisdiction = node.jurisdiction?.toLowerCase().includes(query)
        const inPlatform = node.platform?.toLowerCase().includes(query)
        return Boolean(inLabel || inJurisdiction || inPlatform)
      })
      .slice(0, 8)
  }, [graphData.nodes, searchQuery])

  const hoverNeighborSet = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>()
    const connected = new Set<string>([hoveredNodeId])
    for (const link of graphData.links as GraphLink[]) {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id
      if (sourceId === hoveredNodeId) connected.add(targetId)
      if (targetId === hoveredNodeId) connected.add(sourceId)
    }
    return connected
  }, [graphData.links, hoveredNodeId])

  const hoveredNode = useMemo(
    () => (hoveredNodeId ? (graphData.nodes as GraphNode[]).find((node) => node.id === hoveredNodeId) ?? null : null),
    [graphData.nodes, hoveredNodeId]
  )

  const hoveredNodeDescription = useMemo(() => {
    if (!hoveredNode) return ''
    if (hoveredNode.type === 'prop') {
      return 'Prop firm node: GTIXT score, risk profile, and ecosystem connectivity anchor.'
    }
    if (hoveredNode.type === 'broker') {
      return 'Broker node: execution and market access infrastructure connected to prop firms.'
    }
    if (hoveredNode.type === 'platform') {
      return 'Tooling node: trading platform and operational technology stack for firms.'
    }
    if (hoveredNode.type === 'liquidity') {
      return 'Data/Liquidity node: market depth and counterparty flow dependency layer.'
    }
    if (hoveredNode.type === 'regulator') {
      return 'Regulatory node: supervisory perimeter and jurisdictional governance influence.'
    }
    if (hoveredNode.type === 'aggregator') {
      return 'Aggregator node: bridge infrastructure across brokers, venues and execution paths.'
    }
    if (hoveredNode.type === 'cluster') {
      return 'Cluster node: grouped institutional relationships by shared infrastructure.'
    }
    return 'Geographic node: regional concentration and ecosystem distribution indicator.'
  }, [hoveredNode])

  const scoreHistoryByNode = useMemo(() => {
    const history: Record<string, Array<{ year: YearBucket; score: number }>> = {}
    for (const y of timelineYears) {
      for (const node of graphTimeline[y].nodes) {
        if (node.score === undefined) continue
        if (!history[node.id]) history[node.id] = []
        history[node.id].push({ year: y, score: node.score })
      }
    }
    return history
  }, [])

  const selectedScoreHistory = useMemo(
    () => (selectedNode ? scoreHistoryByNode[selectedNode.id] ?? [] : []),
    [scoreHistoryByNode, selectedNode]
  )

  const selectedTrend = useMemo(() => {
    if (selectedScoreHistory.length < 2) return 0
    return Number((selectedScoreHistory[selectedScoreHistory.length - 1].score - selectedScoreHistory[0].score).toFixed(1))
  }, [selectedScoreHistory])

  const selectedSparkline = useMemo(() => {
    if (selectedScoreHistory.length < 2) return ''
    const width = 240
    const height = 56
    const padding = 6
    const values = selectedScoreHistory.map((item) => item.score)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = Math.max(max - min, 1)
    return selectedScoreHistory
      .map((item, index) => {
        const x = padding + (index / (selectedScoreHistory.length - 1)) * (width - padding * 2)
        const y = height - padding - ((item.score - min) / span) * (height - padding * 2)
        return `${index === 0 ? 'M' : 'L'}${x},${y}`
      })
      .join(' ')
  }, [selectedScoreHistory])

  const selectedRiskSet = useMemo(() => {
    if (!riskPropagation || !selectedNode?.id) return new Set<string>()

    const connected = new Set<string>([selectedNode.id])
    for (const link of graphData.links as GraphLink[]) {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id
      if (sourceId === selectedNode.id) connected.add(targetId)
      if (targetId === selectedNode.id) connected.add(sourceId)
    }
    return connected
  }, [graphData.links, riskPropagation, selectedNode])

  const clusterNarrative = useMemo(() => {
    if (!selectedNode) {
      return 'Select a star or cluster, then run AI Explain Cluster to receive a relationship summary.'
    }

    const neighbors = (graphData.links as GraphLink[]).reduce<string[]>((acc, link) => {
      const src = typeof link.source === 'string' ? link.source : (link.source as any).id
      const tgt = typeof link.target === 'string' ? link.target : (link.target as any).id
      if (src === selectedNode.id) acc.push(tgt)
      if (tgt === selectedNode.id) acc.push(src)
      return acc
    }, [])

    const linked = (graphData.nodes as GraphNode[]).filter((node) => neighbors.includes(node.id))
    const byType = linked.reduce<Record<string, number>>((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1
      return acc
    }, {})

    const relations = Object.entries(byType)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ')

    return `${selectedNode.label} is positioned as a ${selectedNode.type} anchor in ${year}, linked to ${relations || 'isolated entities'}. This cluster indicates shared infrastructure (broker/platform) and potential risk coupling through common liquidity and regulatory dependencies.`
  }, [graphData.links, graphData.nodes, selectedNode, year])

  const focusNode = (node: GraphNode, duration = 900) => {
    setSelectedNode(node)

    if (!graphRef.current) return
    const graphNode = (graphData.nodes as any[]).find((n) => n.id === node.id)
    if (graphNode?.x !== undefined && graphNode?.y !== undefined && graphNode?.z !== undefined) {
      const graph = graphRef.current as any
      if (graph.cameraPosition) {
        const nodeDistance = Math.hypot(graphNode.x, graphNode.y, graphNode.z) || 1
        const cameraDistance = Math.max(85, nodeDistance * 0.5)
        const ratio = (nodeDistance + cameraDistance) / nodeDistance
        graph.cameraPosition(
          { x: graphNode.x * ratio, y: graphNode.y * ratio, z: graphNode.z * ratio },
          { x: graphNode.x, y: graphNode.y, z: graphNode.z },
          duration
        )
      }
    }
  }

  const centerNode = (node: GraphNode) => {
    setSelectedNode(node)
    if (!graphRef.current) return
    const graphNode = (graphData.nodes as any[]).find((n) => n.id === node.id)
    if (graphNode?.x === undefined || graphNode?.y === undefined || graphNode?.z === undefined) return
    const graph = graphRef.current as any
    graph.cameraPosition(
      { x: graphNode.x * 1.18, y: graphNode.y * 1.18, z: graphNode.z * 1.18 },
      { x: graphNode.x, y: graphNode.y, z: graphNode.z },
      620
    )
  }

  const handleNodeClick = (node: GraphNode) => {
    const now = Date.now()
    const previous = lastNodeClickRef.current
    if (previous && previous.id === node.id && now - previous.ts < 320) {
      centerNode(node)
      lastNodeClickRef.current = null
      return
    }
    lastNodeClickRef.current = { id: node.id, ts: now }
    focusNode(node)
  }

  const focusNodeById = (nodeId: string) => {
    const node = (graphData.nodes as GraphNode[]).find((item) => item.id === nodeId)
    if (!node) return
    focusNode(node)
  }

  const resetCamera = () => {
    setSelectedNode(null)
    clearHoveredNodeImmediately()
    if (!graphRef.current) return
    const graph = graphRef.current as any
    graph.cameraPosition?.({ x: 0, y: 40, z: 220 }, { x: 0, y: 0, z: 0 }, 850)
  }

  const isHighRiskConnectedLink = (link: any) => {
    if (!(riskPropagation && selectedNode?.risk === 'HIGH')) return false
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
    const targetId = typeof link.target === 'object' ? link.target.id : link.target
    return selectedRiskSet.has(sourceId) && selectedRiskSet.has(targetId)
  }

  const isHoverConnectedLink = (link: any) => {
    if (!hoveredNodeId) return false
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
    const targetId = typeof link.target === 'object' ? link.target.id : link.target
    return hoverNeighborSet.has(sourceId) && hoverNeighborSet.has(targetId)
  }

  // Auto-start cinematic intro on page load (10 seconds)
  useEffect(() => {
    if (!hasAutoStarted && graphData.nodes.length > 0) {
      setHasAutoStarted(true)
      setFlyThroughActive(true)
      
      // Auto-stop after 10 seconds
      const autoStopTimer = setTimeout(() => {
        setFlyThroughActive(false)
      }, 10000)

      return () => clearTimeout(autoStopTimer)
    }
  }, [hasAutoStarted, graphData.nodes.length])

  useEffect(() => {
    if (!flyThroughActive) {
      if (flyThroughTimerRef.current) {
        clearInterval(flyThroughTimerRef.current)
        flyThroughTimerRef.current = null
      }
      return
    }

    const availablePath = CAMERA_PATH.filter((nodeId) =>
      (graphData.nodes as GraphNode[]).some((node) => node.id === nodeId)
    )
    if (availablePath.length === 0) {
      setFlyThroughActive(false)
      return
    }

    const moveCameraToNext = () => {
      const currentNodeId = availablePath[flyThroughIndexRef.current % availablePath.length]
      focusNodeById(currentNodeId)
      flyThroughIndexRef.current += 1
    }

    moveCameraToNext()
    flyThroughTimerRef.current = setInterval(moveCameraToNext, 4200)

    return () => {
      if (flyThroughTimerRef.current) {
        clearInterval(flyThroughTimerRef.current)
        flyThroughTimerRef.current = null
      }
    }
  }, [flyThroughActive, graphData.nodes])

  const nodeThreeObject = (nodeRaw: any) => {
    interface GraphNodeWithCluster extends GraphNode {
      cluster?: 'forex' | 'futures' | 'crypto' | 'quant'
    }
    const node = nodeRaw as GraphNodeWithCluster
    const group = new THREE.Group()
    const score = node.score ?? 70
    // Keep the root group fixed so force-graph links stay attached to node anchors.
    // (Applying bob on root groups desynchronizes visual meshes from link endpoints.)

    if (node.type === 'prop') {
      // Get star color: prioritize cluster-based coloring, then fallback to score-based
      const getStarColor = () => {
        if (node.cluster && STAR_CLUSTER_COLORS[node.cluster]) {
          return STAR_CLUSTER_COLORS[node.cluster]
        }

        // Fallback to score-based coloring
        return score >= 85 ? '#00D4C6' : score >= 75 ? '#22E6DA' : score >= 65 ? '#F59E0B' : '#EF4444'
      }
      
      const starColor = institutionalOverlay
        ? node.risk === 'CRITICAL'
          ? '#EF4444'
          : node.risk === 'HIGH'
            ? '#F59E0B'
            : getStarColor()
        : getStarColor()
      const radius = Math.max(2.8, (node.influence ?? score) / 24)
      const isSelected = selectedNode?.id === node.id
      const isHovered = hoveredNodeId === node.id
      const isImportant = score >= 86 || node.risk === 'LOW'
      const starTexture = realSpaceEnabled ? getEntityTexture('star', node.id) : undefined

      const getFirmSprite = () => {
        const assetPath = LOGO_ASSET_MAP[node.id]
        if (!assetPath) {
          return createLogoSprite(node.label, starColor)
        }

        if (!textureLoaderRef.current) {
          textureLoaderRef.current = new THREE.TextureLoader()
        }

        if (!textureCacheRef.current[assetPath]) {
          const texture = textureLoaderRef.current.load(assetPath)
          texture.colorSpace = THREE.SRGBColorSpace
          texture.needsUpdate = true
          textureCacheRef.current[assetPath] = texture
          spriteMaterialCacheRef.current[assetPath] = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
          })
        }

        const material = spriteMaterialCacheRef.current[assetPath]
        const sprite = new THREE.Sprite(material)
        sprite.scale.set(4.4, 4.4, 1)
        return sprite
      }

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 24, 24),
        new THREE.MeshPhysicalMaterial({
          color: starColor,
          emissive: starColor,
          emissiveIntensity: isSelected ? 0.82 : isHovered ? 0.72 : 0.52,
          roughness: 0.25,
          metalness: 0.05,
          clearcoat: 0.6,
          clearcoatRoughness: 0.3,
        })
      )
      // Enable bloom layer for selective glow - only stars will have bloom
      sphere.layers.enable(BLOOM_LAYER)
      sphere.userData.starBreathing = true
      registerAnimatedObject(sphere)
      
      // Calculate live pulse parameters based on firm score (0-100)
      const firmScore = node.score || 70
      sphere.userData.baseIntensity = 0.5
      // Higher score = faster pulse (1.5x to 2.5x base speed)
      sphere.userData.pulseSpeed = 1.35 + (firmScore / 100) * 0.85
      // Higher score = stronger pulse (0.25 to 0.45 amplitude)
      sphere.userData.pulseAmplitude = 0.14 + (firmScore / 100) * 0.12
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(radius * (isSelected ? 1.85 : isHovered ? 1.72 : 1.55), 16, 16),
        new THREE.MeshBasicMaterial({ color: starColor, transparent: true, opacity: isSelected ? 0.2 : isHovered ? 0.16 : 0.11 })
      )
      halo.userData.pulse = true
      halo.renderOrder = 24
      registerAnimatedObject(halo)

      const institutionalHalo = new THREE.Mesh(
        new THREE.SphereGeometry(radius * (isSelected ? 2.22 : isHovered ? 2.06 : isImportant ? 1.98 : 1.82), 20, 20),
        new THREE.MeshBasicMaterial({
          color: '#06B6D4',
          transparent: true,
          opacity: isSelected ? 0.2 : isHovered ? 0.16 : isImportant ? 0.13 : 0.08,
        })
      )
      institutionalHalo.userData.pulse = true
      institutionalHalo.renderOrder = 23
      registerAnimatedObject(institutionalHalo)

      const flare = createLensFlare(starColor)
      flare.position.set(0, 0, 0)
      registerAnimatedObject(flare)

      if (starTexture) {
        const corona = createRealSpaceOverlaySprite(
          starTexture,
          Math.min(0.38 * (backgroundIntensity / 100), 0.42),
          radius * 3.9,
          starColor
        )
        group.add(corona)
      }

      const logoSprite = getFirmSprite()
      logoSprite.position.set(0, radius + 3.2, 0)

      const labelSprite = createTextBillboard(`${node.label} • ${getScoreTier(score)}`, '#9EEBFF')
      labelSprite.position.set(0, radius + 6.4, 0)
      labelSprite.material.opacity = isSelected || isHovered ? 0.95 : isImportant ? 0.84 : 0.68

      const orbitPivot = new THREE.Group()
      orbitPivot.userData.spinY = 0.02 + Math.random() * 0.018
      registerAnimatedObject(orbitPivot)
      const orbitDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 10, 10),
        new THREE.MeshBasicMaterial({ color: '#E2F8FF', transparent: true, opacity: 0.8 })
      )
      orbitDot.position.set(radius * 2.2, 0, 0)
      orbitPivot.add(orbitDot)

      group.add(sphere)
      group.add(institutionalHalo)
      group.add(halo)
      group.add(flare)
      group.add(logoSprite)
      group.add(labelSprite)
      group.add(orbitPivot)
      return group
    }

    if (node.type === 'broker') {
      const radius = Math.max(2, (node.influence ?? 60) / 38)
      const fallbackPlanetTexture = createPlanetTexture('#0EA5E9', '#1D4ED8')
      const planetTexture = realSpaceEnabled
        ? getEntityTexture('planet', node.id) ?? fallbackPlanetTexture
        : fallbackPlanetTexture
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 20, 20),
        new THREE.MeshPhysicalMaterial({
          color: '#0EA5E9',
          map: planetTexture ?? undefined,
          metalness: 0.12,
          roughness: 0.58,
          clearcoat: 0.45,
          clearcoatRoughness: 0.42,
        })
      )
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius * 1.3, radius * 1.9, 36),
        new THREE.MeshBasicMaterial({ color: '#22E6DA', side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
      )
      ring.rotation.x = Math.PI / 2.6

      const moonPivot = new THREE.Group()
      moonPivot.userData.spinY = 0.028 + Math.random() * 0.015
      registerAnimatedObject(moonPivot)
      const moon = new THREE.Mesh(
        getSharedGeometry('broker-moon-geometry', () => new THREE.SphereGeometry(0.45, 12, 12)),
        getSharedMaterial('broker-moon-material', () => new THREE.MeshStandardMaterial({ color: '#A5F3FC' }))
      )
      moon.position.set(radius * 2.5, 0, 0)
      moonPivot.add(moon)

      group.add(planet)
      group.add(ring)
      group.add(moonPivot)
      if ((node.influence ?? 0) > 72) {
        const label = createTextBillboard(node.label, '#C7F4FF')
        label.position.set(0, radius + 4.2, 0)
        label.material.opacity = 0.56
        group.add(label)
      }
      return group
    }

    if (node.type === 'platform') {
      const satellite = new THREE.Mesh(
        getSharedGeometry('platform-satellite-geometry', () => new THREE.BoxGeometry(2.2, 0.9, 1.2)),
        getSharedMaterial('platform-satellite-material', () => new THREE.MeshStandardMaterial({ color: '#7C3AED', metalness: 0.5, roughness: 0.35 }))
      )
      const panel = new THREE.Mesh(
        getSharedGeometry('platform-panel-geometry', () => new THREE.BoxGeometry(3.6, 0.08, 0.9)),
        getSharedMaterial('platform-panel-material', () => new THREE.MeshStandardMaterial({ color: '#A78BFA', metalness: 0.35, roughness: 0.4 }))
      )
      panel.position.set(0, 0, -1.15)

      const orbit = new THREE.Mesh(
        getSharedGeometry('platform-orbit-geometry', () => new THREE.RingGeometry(2.4, 2.55, 32)),
        getSharedMaterial('platform-orbit-material', () => new THREE.MeshBasicMaterial({ color: '#A78BFA', side: THREE.DoubleSide, transparent: true, opacity: 0.4 }))
      )
      orbit.rotation.x = Math.PI / 2
      orbit.userData.spinY = 0.04
      registerAnimatedObject(orbit)

      if (realSpaceEnabled) {
        const satelliteTexture = getEntityTexture('satellite', node.id)
        if (satelliteTexture) {
          const halo = createRealSpaceOverlaySprite(
            satelliteTexture,
            Math.min(0.5 * (backgroundIntensity / 100), 0.7),
            8.2
          )
          halo.renderOrder = 25
          group.add(halo)
        }
      }

      group.add(satellite)
      group.add(panel)
      group.add(orbit)
      return group
    }

    if (node.type === 'liquidity') {
      const particleCount = 110
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 8
        positions[i + 1] = (Math.random() - 0.5) * 8
        positions[i + 2] = (Math.random() - 0.5) * 8
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const points = new THREE.Points(
        geometry,
        getSharedMaterial('liquidity-points-material', () => new THREE.PointsMaterial({ color: '#1E40AF', size: 0.45, transparent: true, opacity: 0.85 }))
      )
      points.userData.spinY = 0.008
      registerAnimatedObject(points)

      if (realSpaceEnabled) {
        const nebulaTexture = getEntityTexture('nebula', node.id)
        if (nebulaTexture) {
          const cloud = createRealSpaceOverlaySprite(
            nebulaTexture,
            Math.min(0.45 * (backgroundIntensity / 100), 0.65),
            14
          )
          group.add(cloud)
        }
      }

      group.add(points)
      return group
    }

    if (node.type === 'regulator') {
      const field = new THREE.Mesh(
        getSharedGeometry('regulator-field-geometry', () => new THREE.SphereGeometry(3.1, 18, 18)),
        getSharedMaterial('regulator-field-material', () => new THREE.MeshBasicMaterial({ color: '#94A3B8', wireframe: true, transparent: true, opacity: 0.4 }))
      )
      field.userData.spinY = 0.016
      registerAnimatedObject(field)

      const shell = new THREE.Mesh(
        getSharedGeometry('regulator-shell-geometry', () => new THREE.SphereGeometry(4.4, 24, 24)),
        getSharedMaterial('regulator-shell-material', () => new THREE.MeshBasicMaterial({ color: '#CBD5E1', transparent: true, opacity: 0.08 }))
      )
      shell.userData.pulse = true
      registerAnimatedObject(shell)
      const regLabel = createTextBillboard(node.label, '#E2E8F0')
      regLabel.position.set(0, 5.8, 0)
      regLabel.material.opacity = 0.62
      group.add(field)
      group.add(shell)
      group.add(regLabel)
      return group
    }

    const fallback = new THREE.Mesh(
      new THREE.SphereGeometry(2, 12, 12),
      new THREE.MeshStandardMaterial({ color: CATEGORY_COLORS[node.type] ?? '#64748B' })
    )
    group.add(fallback)
    return group
  }

  return (
    <>
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />
      
      {/* Filters Modal */}
      <Modal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Advanced Filters"
        size="md"
        footer={
          <>
            <button onClick={clearAllFilters} className="button button-secondary">
              Clear All
            </button>
            <button onClick={() => setShowFiltersModal(false)} className="button">
              Apply Filters
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[var(--gtixt-gray-dark)] mb-2 block">
              Region
            </label>
            <Dropdown
              options={[
                { value: 'all', label: 'All Regions' },
                { value: 'USA', label: 'United States' },
                { value: 'EU', label: 'European Union' },
                { value: 'UAE', label: 'United Arab Emirates' },
                { value: 'Australia', label: 'Australia' },
              ]}
              value={filterRegion}
              onChange={setFilterRegion}
            />
          </div>
          
          <div>
            <label className="text-sm font-semibold text-[var(--gtixt-gray-dark)] mb-2 block">
              Risk Level
            </label>
            <Dropdown
              options={[
                { value: 'all', label: 'All Risk Levels' },
                { value: 'LOW', label: 'Low Risk' },
                { value: 'MEDIUM', label: 'Medium Risk' },
                { value: 'HIGH', label: 'High Risk' },
                { value: 'CRITICAL', label: 'Critical Risk' },
              ]}
              value={filterRisk}
              onChange={setFilterRisk}
            />
          </div>
          
          <div>
            <label className="text-sm font-semibold text-[var(--gtixt-gray-dark)] mb-2 block">
              Cluster
            </label>
            <Dropdown
              options={[
                { value: 'all', label: 'All Clusters' },
                { value: 'forex', label: 'Forex' },
                { value: 'futures', label: 'Futures' },
                { value: 'crypto', label: 'Crypto' },
                { value: 'quant', label: 'Quant' },
              ]}
              value={filterCluster}
              onChange={setFilterCluster}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[var(--gtixt-gray-dark)] mb-2 block">
              Minimum Score: {scoreThreshold}
            </label>
            <input
              type="range"
              min={50}
              max={95}
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--gtixt-turquoise-primary)' }}
            />
          </div>
        </div>
      </Modal>

      <section className="rounded-2xl border border-white/[0.06] bg-[#0F172A]/82 shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-sm p-4 sm:p-6 md:p-8">
        <div className="mb-6 border border-white/[0.06] rounded-2xl bg-[#0B132B]/60 px-5 py-4">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                The GTIXT Industry Galaxy
              </h2>
              <p className="mt-1 text-slate-300 text-sm md:text-base">
                A structural map of the global proprietary trading ecosystem.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center rounded-xl border border-white/[0.06] bg-[#020617]/70 p-1">
                <button
                  onClick={() => setMode('network')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === 'network' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40' : 'text-slate-300 hover:text-cyan-200'}`}
                  aria-label="Network view"
                  aria-pressed={mode === 'network'}
                >
                  Network
                </button>
                <button
                  onClick={() => setMode('cluster')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === 'cluster' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40' : 'text-slate-300 hover:text-cyan-200'}`}
                  aria-label="Cluster view"
                  aria-pressed={mode === 'cluster'}
                >
                  Cluster
                </button>
                <button
                  onClick={() => setMode('geo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === 'geo' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40' : 'text-slate-300 hover:text-cyan-200'}`}
                  aria-label="Geographic view"
                  aria-pressed={mode === 'geo'}
                >
                  Geo
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#020617]/70 px-3 py-2">
                <span className="text-[11px] text-slate-300">Density</span>
                <input
                  type="range"
                  min={45}
                  max={100}
                  value={densityLevel}
                  onChange={(event) => setDensityLevel(Number(event.target.value))}
                  className="w-24 accent-cyan-400"
                  aria-label={`Density control: ${densityLevel}%`}
                />
                <span className="text-[11px] text-cyan-300 font-semibold">{densityLevel}%</span>
              </div>

              <button
                onClick={() => setShowFiltersModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#020617]/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-cyan-200 hover:border-cyan-400/40 transition-all"
                aria-label="Open filters"
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
              </button>

              <button
                onClick={exportGraphAsPNG}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#020617]/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-cyan-200 hover:border-cyan-400/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Export as PNG"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? 'Exporting...' : 'Export'}
              </button>

              <button
                onClick={resetCamera}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#020617]/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-cyan-200 hover:border-cyan-400/40 transition-all"
                aria-label="Reset camera view"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Reset
              </button>

              <button
                onClick={() => setFlyThroughActive((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-[#020617]/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-cyan-200 hover:border-cyan-400/40 transition-all"
                aria-label={flyThroughActive ? 'Pause tour' : 'Start cinematic tour'}
              >
                {flyThroughActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                Tour
              </button>
            </div>
          </div>
        </div>

    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
      <aside className="order-2 xl:order-1 xl:col-span-3 rounded-2xl bg-[#0B132B]/66 border border-white/[0.06] backdrop-blur-xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.22)]">
        {/* Search Bar */}
        <div className="mb-6">
          <h2 className="text-white font-semibold mb-3">Search</h2>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search entities..."
            onClear={() => setSearchQuery('')}
          />
          {searchQuery && (
            <p className="text-xs text-slate-400 mt-2">
              {graphData.nodes.length} result{graphData.nodes.length !== 1 ? 's' : ''} found
            </p>
          )}
          {searchQuery && searchResults.length > 0 && (
            <div className="mt-3 max-h-52 overflow-y-auto rounded-lg border border-white/[0.08] bg-[#020617]/70 p-2 space-y-1">
              {searchResults.map((node) => (
                <button
                  key={`search-${node.id}`}
                  onClick={() => {
                    focusNode(node, 720)
                    setHoveredNodeId(node.id)
                  }}
                  className="w-full text-left rounded-md px-2.5 py-2 hover:bg-cyan-500/10 transition-colors"
                  aria-label={`Focus ${node.label}`}
                >
                  <div className="text-xs font-semibold text-cyan-200 truncate">{node.label}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                    {node.type}{node.region ? ` • ${node.region}` : ''}{node.score !== undefined ? ` • Score ${node.score}` : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchQuery && searchResults.length === 0 && (
            <div className="mt-3 rounded-lg border border-white/[0.08] bg-[#020617]/70 p-3 text-xs text-slate-400">
              No entity matches “{searchQuery}”.
            </div>
          )}
        </div>

        <h2 className="text-white font-semibold mb-4">Type Filters</h2>
        <div className="space-y-3 mb-6">
          {displayGroups.map((item) => (
            <label key={item.key} className="flex items-center gap-3 text-dark-300 text-sm cursor-pointer hover:text-dark-200 transition-colors">
              <input
                type="checkbox"
                checked={!!showTypes[item.key]}
                onChange={(event) =>
                  setShowTypes((prev) => ({
                    ...prev,
                    [item.key]: event.target.checked,
                  }))
                }
                className="accent-primary-500"
                aria-label={`Toggle ${item.label}`}
              />
              {item.label}
            </label>
          ))}
        </div>

        <div className="xl:hidden mb-4">
          <button
            onClick={() => setMobileControlsExpanded((prev) => !prev)}
            className="w-full inline-flex items-center justify-between rounded-xl border border-white/[0.12] bg-[#020617]/80 px-3 py-2.5 text-xs font-semibold text-cyan-200"
            aria-expanded={mobileControlsExpanded}
            aria-label="Toggle advanced controls"
          >
            <span>Advanced controls</span>
            {mobileControlsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <div className={`${mobileControlsExpanded ? 'block' : 'hidden'} xl:block`}>

        <div className="mb-6 pb-5 border-b border-white/[0.08]">
          <label className="flex items-center gap-3 text-dark-300 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={livePulseMode}
              onChange={(event) => setLivePulseMode(event.target.checked)}
              className="accent-primary-500"
            />
            <span className="flex items-center gap-2">
              <span className={livePulseMode ? 'text-primary-400' : ''}><Sparkles className="w-3.5 h-3.5 inline mr-1" />Live Pulse Mode</span>
              {livePulseMode && <span className="text-[10px] text-primary-400 font-medium animate-pulse">(Active)</span>}
            </span>
          </label>
          <p className="text-[11px] text-dark-500 ml-6 mt-1">Stars pulse faster based on firm activity</p>
        </div>

        <div className="mb-6 pb-5 border-b border-white/[0.08]">
          <label className="flex items-center gap-3 text-dark-300 text-sm cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={institutionalOverlay}
              onChange={(event) => setInstitutionalOverlay(event.target.checked)}
              className="accent-primary-500"
            />
            <span className="flex items-center gap-2">
              <span className={institutionalOverlay ? 'text-primary-400' : ''}>Institutional overlay</span>
              <span className="text-[10px] text-dark-500">risk/tier/heat</span>
            </span>
          </label>

          <label className="flex items-center gap-3 text-dark-300 text-sm cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={cameraInertia}
              onChange={(event) => setCameraInertia(event.target.checked)}
              className="accent-primary-500"
            />
            <span className="flex items-center gap-2">
              <span className={cameraInertia ? 'text-primary-400' : ''}>Camera inertia</span>
              <span className="text-[10px] text-dark-500">subtle auto-rotation</span>
            </span>
          </label>

          <label className="flex items-center gap-3 text-dark-300 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={realSpaceEnabled}
              onChange={(event) => setRealSpaceEnabled(event.target.checked)}
              className="accent-primary-500"
            />
            <span className="flex items-center gap-2">
              <span className={realSpaceEnabled ? 'text-primary-400' : ''}>Real Space</span>
              <span className="text-[10px] text-dark-500">{realSpaceEnabled ? 'ON' : 'OFF'}</span>
            </span>
          </label>

          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-dark-300">Background intensity</span>
              <span className="text-primary-400 font-semibold">{backgroundIntensity}%</span>
            </div>
            <input
              type="range"
              min={15}
              max={95}
              value={backgroundIntensity}
              onChange={(event) => setBackgroundIntensity(Number(event.target.value))}
              disabled={!realSpaceEnabled}
              className="w-full accent-primary-500 disabled:opacity-40"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-dark-300">Network density</span>
            <span className="text-primary-400 font-semibold">{densityLevel}%</span>
          </div>
          <input
            type="range"
            min={45}
            max={100}
            value={densityLevel}
            onChange={(event) => setDensityLevel(Number(event.target.value))}
            className="w-full accent-primary-500"
          />
          <p className="text-[11px] text-dark-500 mt-1">Reduce/expand visible relations in real-time</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-dark-300">Score ≥</span>
            <span className="text-primary-400 font-semibold">{scoreThreshold}</span>
          </div>
          <input
            type="range"
            min={50}
            max={95}
            value={scoreThreshold}
            onChange={(event) => setScoreThreshold(Number(event.target.value))}
            className="w-full accent-primary-500"
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-dark-300 flex items-center gap-2"><Clock4 className="w-4 h-4" /> Timeline</span>
            <span className="text-primary-400 font-semibold">{year}</span>
          </div>
          <input
            type="range"
            min={0}
            max={timelineYears.length - 1}
            value={timelineYears.indexOf(year)}
            onChange={(event) => setYear(timelineYears[Number(event.target.value)])}
            className="w-full accent-primary-500"
          />
          <div className="flex justify-between mt-2 text-[11px] text-dark-500">
            {timelineYears.map((timelineYear) => (
              <span key={timelineYear}>{timelineYear}</span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-white text-sm font-medium mb-3">View mode</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMode('network')}
              className={`px-2 py-2 rounded text-xs font-medium ${
                mode === 'network' ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300'
              }`}
            >
              <Network className="w-4 h-4 mx-auto mb-1" />
              Network
            </button>
            <button
              onClick={() => setMode('cluster')}
              className={`px-2 py-2 rounded text-xs font-medium ${
                mode === 'cluster' ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300'
              }`}
            >
              <Layers3 className="w-4 h-4 mx-auto mb-1" />
              Cluster
            </button>
            <button
              onClick={() => setMode('geo')}
              className={`px-2 py-2 rounded text-xs font-medium ${
                mode === 'geo' ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300'
              }`}
            >
              <Globe2 className="w-4 h-4 mx-auto mb-1" />
              Geo
            </button>
          </div>
        </div>

        <label className="flex items-center gap-3 text-dark-300 text-sm">
          <input
            type="checkbox"
            checked={riskPropagation}
            onChange={(event) => setRiskPropagation(event.target.checked)}
            className="accent-danger"
          />
          Risk propagation highlight
        </label>

        <label className="mt-4 flex items-center gap-3 text-dark-300 text-sm">
          <input
            type="checkbox"
            checked={crisisMode}
            onChange={(event) => setCrisisMode(event.target.checked)}
            className="accent-danger"
          />
          Broker collapse simulation
        </label>

        <button
          onClick={() => setExplainCluster((prev) => !prev)}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-primary-500/20 to-primary-800/20 border border-primary-500/30 text-primary-300 hover:text-primary-200 transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          {explainCluster ? 'Hide' : 'Explain'} cluster
        </button>

        <button
          onClick={() => setFlyThroughActive((prev) => !prev)}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-[#020617]/80 border border-white/[0.14] text-white hover:border-primary-400/60 transition-colors"
        >
          {flyThroughActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {flyThroughActive ? 'Stop' : 'Restart'} cinematic tour
        </button>

        <div className="mt-3 inline-flex items-center gap-2 text-xs text-dark-300">
          <Clapperboard className="w-3.5 h-3.5 text-primary-300" />
          Auto-plays on load • FTMO → FundingPips → FundedNext → Apex → Topstep
        </div>
        </div>
      </aside>

      <div className="order-1 xl:order-2 xl:col-span-6 relative rounded-2xl bg-[#0B132B]/68 border border-white/[0.06] p-2 sm:p-4 h-[520px] sm:h-[620px] xl:h-[700px] shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-xl overflow-hidden" style={{ touchAction: 'none' }}>
                {/* Loading Overlay */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 z-50 flex items-center justify-center bg-[#0B132B]/90 backdrop-blur-md"
                    >
                      <LoadingSpinner 
                        size="lg" 
                        color="var(--gtixt-turquoise-primary, #00ACC1)" 
                        message="Loading Galaxy..."
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

        {realSpaceEnabled && (
          <>
            <motion.div
              key={bgFrameIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: backgroundIntensity / 100 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `url(${activeBackgroundFrames[bgFrameIndex % activeBackgroundFrames.length]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <motion.div
              className="pointer-events-none absolute inset-0"
              animate={{ scale: [1, 1.045, 1], rotate: [0, 0.6, 0] }}
              transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                backgroundImage: `url(${activeBackgroundFrames[(bgFrameIndex + 1) % activeBackgroundFrames.length]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: Math.min((backgroundIntensity / 100) * 0.22, 0.22),
                mixBlendMode: 'screen',
              }}
            />
          </>
        )}
        <ForceGraph3D
          ref={graphRef}
          graphData={graphData}
          nodeLabel={(node: any) => {
            const scoreLabel = typeof node.score === 'number' ? ` • Score ${node.score}` : ''
            const riskLabel = node.risk ? ` • Risk ${node.risk}` : ''
            return `${node.label || node.id} (${node.type})${scoreLabel}${riskLabel}`
          }}
          nodeThreeObject={nodeThreeObject}
          nodeRelSize={4}
          linkColor={(link: any) => {
            if (isHighRiskConnectedLink(link)) return '#EF4444'
            if (isHoverConnectedLink(link)) return '#22D3EE'
            if (crisisMode) return '#F87171'
            return '#334155'
          }}
          linkWidth={(link: any) => {
            if (isHighRiskConnectedLink(link)) return 2.5
            if (isHoverConnectedLink(link)) return 2.8
            return crisisMode ? 2 : 1.2
          }}
          linkOpacity={hoveredNodeId ? 0.62 : crisisMode ? 0.54 : 0.32}
          linkCurvature={(link: any) => (link.type === 'region' ? 0.24 : link.type === 'cluster' ? 0.12 : 0.06)}
          linkDirectionalParticles={(link: any) => {
            if (isHighRiskConnectedLink(link)) return 3
            if (isHoverConnectedLink(link)) return 4
            return crisisMode ? 2 : 1
          }}
          linkDirectionalParticleColor={(link: any) => {
            if (isHighRiskConnectedLink(link)) return '#FCA5A5'
            if (isHoverConnectedLink(link)) return '#22D3EE'
            return crisisMode ? '#FCA5A5' : '#67E8F9'
          }}
          linkDirectionalParticleSpeed={(link: any) => {
            if (isHighRiskConnectedLink(link)) return 0.0048
            if (isHoverConnectedLink(link)) return 0.0054
            return crisisMode ? 0.0042 : 0.0022
          }}
          linkDirectionalParticleWidth={(link: any) => {
            if (isHighRiskConnectedLink(link)) return 2.3
            if (isHoverConnectedLink(link)) return 2.8
            return 1.2
          }}
          onNodeHover={(node: any) => updateHoveredNode(node?.id ?? null)}
          onNodeClick={(node: any) => handleNodeClick(node as GraphNode)}
          onBackgroundClick={() => {
            setSelectedNode(null)
            clearHoveredNodeImmediately()
          }}
          enableNodeDrag
          cooldownTicks={180}
          warmupTicks={70}
          d3VelocityDecay={0.24}
          d3AlphaDecay={0.015}
          backgroundColor="rgba(0,0,0,0)"
          showNavInfo={false}
          enableNavigationControls
        />

        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(6,182,212,0.08),transparent_55%)]"
          style={{ opacity: realSpaceEnabled ? Math.max(backgroundIntensity / 100, 0.35) : 1 }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(6,182,212,0.08)_0%,rgba(30,64,175,0.05)_52%,rgba(15,23,42,0.08)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_58%,rgba(2,6,23,0.70)_100%)]" />
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="pointer-events-none absolute left-4 top-14 z-40 max-w-[360px] rounded-xl border border-white/[0.06] bg-[#020617]/86 backdrop-blur-xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-cyan-200 truncate">{hoveredNode.label}</div>
              <span className="text-[10px] uppercase tracking-wide text-slate-400">{hoveredNode.type}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{hoveredNodeDescription}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
              {typeof hoveredNode.score === 'number' && (
                <span className="rounded-full border border-cyan-500/35 bg-cyan-500/10 px-2 py-1 text-cyan-200">Score {hoveredNode.score}</span>
              )}
              {hoveredNode.risk && (
                <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-rose-200">Risk {hoveredNode.risk}</span>
              )}
              {hoveredNode.region && (
                <span className="rounded-full border border-slate-400/30 bg-slate-500/10 px-2 py-1 text-slate-200">Region {hoveredNode.region}</span>
              )}
              {hoveredNode.jurisdiction && (
                <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-1 text-blue-200">Reg {hoveredNode.jurisdiction}</span>
              )}
            </div>
          </motion.div>
        )}
        <div className="pointer-events-none absolute top-4 right-4 px-3 py-1 rounded-full border border-primary-500/30 bg-[#020617]/75 text-[11px] font-semibold text-primary-300 tracking-wide">
          SELECTIVE BLOOM
        </div>
        {flyThroughActive && !hasAutoStarted && (
          <div className="pointer-events-none absolute top-4 left-4 px-3 py-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-[11px] font-semibold text-yellow-300 tracking-wide animate-pulse">
            🎬 CINEMATIC MODE
          </div>
        )}
        {flyThroughActive && hasAutoStarted && (
          <div className="pointer-events-none absolute top-4 left-4 px-3 py-1 rounded-full border border-primary-500/40 bg-primary-500/10 text-[11px] font-semibold text-primary-300 tracking-wide">
            🌌 AUTO INTRO
          </div>
        )}
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-white/[0.12] bg-[#020617]/75 backdrop-blur-lg px-3 py-2 text-[11px] text-dark-200">
          Scroll: zoom • Drag: pan/orbit • Double-click node: center
        </div>
        
        {/* Premium Floating Legend with Icons & Glows */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute top-4 right-4 mr-28 rounded-xl border border-white/[0.12] bg-[#0B1C2B]/85 backdrop-blur-xl px-4 py-3.5 min-w-[220px] shadow-[0_8px_32px_rgba(0,212,198,0.15)]"
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.08]">
            <Layers3 className="w-3.5 h-3.5 text-primary-300" />
            <div className="text-[10px] tracking-[0.16em] uppercase text-white font-semibold">Galaxy Legend</div>
          </div>
          <div className="space-y-2 text-[11px]">
            {/* Prop Firms (Stars) */}
            <div className="flex items-center gap-2.5 group cursor-default transition-all hover:translate-x-0.5">
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-[#00D4C6] shadow-[0_0_8px_rgba(0,212,198,0.7)] group-hover:shadow-[0_0_12px_rgba(0,212,198,0.9)]" />
                <span className="absolute w-5 h-5 rounded-full bg-[#00D4C6] opacity-20 animate-ping" />
              </div>
              <span className="text-dark-200 group-hover:text-white transition-colors font-medium">Prop firms (stars)</span>
            </div>
            
            {/* Brokers (Planets) */}
            <div className="flex items-center gap-2.5 group cursor-default transition-all hover:translate-x-0.5">
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-[#0EA5E9] shadow-[0_0_6px_rgba(14,165,233,0.6)] group-hover:shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
                <span className="absolute w-4 h-4 rounded-full border border-[#0EA5E9]/30 opacity-60" />
              </div>
              <span className="text-dark-200 group-hover:text-white transition-colors font-medium">Brokers (planets)</span>
            </div>
            
            {/* Platforms (Satellites) */}
            <div className="flex items-center gap-2.5 group cursor-default transition-all hover:translate-x-0.5">
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded bg-[#7C3AED] shadow-[0_0_6px_rgba(124,58,237,0.6)] group-hover:shadow-[0_0_10px_rgba(124,58,237,0.8)]" />
              </div>
              <span className="text-dark-200 group-hover:text-white transition-colors font-medium">Tools (satellites)</span>
            </div>
            
            {/* Data Providers (Nebula) */}
            <div className="flex items-center gap-2.5 group cursor-default transition-all hover:translate-x-0.5">
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-[#1E3A8A] shadow-[0_0_6px_rgba(30,58,138,0.6)] group-hover:shadow-[0_0_10px_rgba(30,58,138,0.8)] blur-[1px] opacity-80" />
                <span className="absolute w-5 h-5 rounded-full bg-[#1E40AF] opacity-10 blur-sm" />
              </div>
              <span className="text-dark-200 group-hover:text-white transition-colors font-medium">Data providers (nebula)</span>
            </div>
            
            {/* Regulators (Fields) */}
            <div className="flex items-center gap-2.5 group cursor-default transition-all hover:translate-x-0.5">
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full border border-[#94A3B8] bg-[#94A3B8]/25 shadow-[0_0_8px_rgba(148,163,184,0.45)] group-hover:shadow-[0_0_12px_rgba(148,163,184,0.65)]" />
              </div>
              <span className="text-dark-200 group-hover:text-white transition-colors font-medium">Regulators (fields)</span>
            </div>
            
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent my-2.5" />
            
            {/* Link Types */}
            <div className="flex items-center gap-2.5 text-[10px] text-dark-300 group cursor-default">
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#22E6DA]/70 to-[#0EA5E9]/70 rounded-full shadow-[0_0_4px_rgba(34,230,218,0.4)]" />
              <span className="group-hover:text-dark-100 transition-colors">Infrastructure links</span>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] text-danger-400 group cursor-default">
              <div className="w-8 h-0.5 bg-gradient-to-r from-danger/90 to-danger/70 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse" />
              <span className="group-hover:text-danger-300 transition-colors font-medium">Risk entities</span>
            </div>
          </div>
        </motion.div>
      </div>

      <aside className="order-3 xl:col-span-3 rounded-2xl bg-[#0B132B]/66 border border-white/[0.06] backdrop-blur-xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.22)]">
        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-500 bg-clip-text text-transparent">Entity details</h2>

        {!selectedNode && (
          <p className="text-dark-400 text-sm">Click a node to inspect score, risk, jurisdiction and ecosystem links.</p>
        )}

        {selectedNode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-xl border border-primary-500/25 bg-gradient-to-br from-primary-500/10 via-transparent to-cyan-500/10 p-4">
              <div className="text-2xl font-bold text-white">{selectedNode.label}</div>
              <div className="text-xs text-dark-400 uppercase tracking-wide mb-2">{selectedNode.type}</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-full text-[10px] font-semibold border border-primary-500/35 text-primary-300 bg-primary-500/10">
                  {getScoreTier(selectedNode.score)}
                </span>
                <span className="px-2 py-1 rounded-full text-[10px] font-semibold border border-white/[0.2] text-dark-200 bg-white/[0.04]">
                  {selectedNode.risk ?? 'No risk tag'}
                </span>
                {selectedNode.region && (
                  <span className="px-2 py-1 rounded-full text-[10px] font-semibold border border-cyan-500/30 text-cyan-300 bg-cyan-500/10">
                    {selectedNode.region}
                  </span>
                )}
                {selectedNode.jurisdiction && (
                  <span className="px-2 py-1 rounded-full text-[10px] font-semibold border border-slate-500/30 text-slate-300 bg-slate-500/10">
                    Reg: {selectedNode.jurisdiction}
                  </span>
                )}
              </div>
            </div>

            {selectedNode.score !== undefined && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-dark-950/75 border border-white/[0.06] p-3">
                  <div className="text-dark-400">Score</div>
                  <div className="text-white font-semibold">{selectedNode.score}</div>
                </div>
                <div className="rounded-lg bg-dark-950/75 border border-white/[0.06] p-3">
                  <div className="text-dark-400">Trend 2019→{year}</div>
                  <div className={`font-semibold ${selectedTrend >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {selectedTrend >= 0 ? '+' : ''}{selectedTrend}
                  </div>
                </div>
              </div>
            )}

            {selectedSparkline && (
              <div className="rounded-lg bg-dark-950/75 border border-white/[0.06] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-dark-300 text-xs uppercase tracking-wide">Score history</div>
                  <div className="text-[10px] text-dark-400">mini-sparkline</div>
                </div>
                <svg viewBox="0 0 240 56" className="w-full h-14">
                  <defs>
                    <linearGradient id="sparkLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22E6DA" />
                      <stop offset="100%" stopColor="#0EA5E9" />
                    </linearGradient>
                  </defs>
                  <path d={selectedSparkline} fill="none" stroke="url(#sparkLineGradient)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            )}

            {selectedNode.jurisdiction && (
              <div className="rounded-lg bg-dark-950/75 border border-white/[0.06] p-3 text-sm">
                <div className="text-dark-400">Jurisdiction</div>
                <div className="text-white font-semibold">{selectedNode.jurisdiction}</div>
              </div>
            )}

            {selectedNode.type === 'prop' && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/firms/${selectedNode.id}`}
                  className="inline-flex px-4 py-2 rounded-lg bg-gradient-turquoise text-white text-sm font-semibold"
                >
                  View tearsheet →
                </Link>
                <Link
                  href="/rankings"
                  className="inline-flex px-4 py-2 rounded-lg border border-white/[0.15] text-white text-sm font-semibold hover:bg-white/[0.05]"
                >
                  Compare
                </Link>
                <button
                  onClick={() => setYear('2025')}
                  className="inline-flex px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/10"
                >
                  Jump to latest snapshot
                </button>
                <button
                  onClick={() => setRiskPropagation(true)}
                  className="inline-flex px-4 py-2 rounded-lg border border-primary-500/30 text-primary-300 text-sm font-semibold hover:bg-primary-500/10"
                >
                  View connections
                </button>
              </div>
            )}

            {riskPropagation && selectedNode.risk === 'HIGH' && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                Connected nodes are highlighted to visualize potential risk propagation.
              </div>
            )}

            {crisisMode && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5" />
                Crisis mode is active: scores are stressed, risk overlays are elevated, and links intensify.
              </div>
            )}
          </motion.div>
        )}

        {explainCluster && (
          <div className="mt-6 rounded-xl border border-primary-500/30 bg-primary-500/10 p-4">
            <div className="text-sm font-semibold text-primary-300 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Explainer
            </div>
            <p className="text-sm text-dark-200 leading-relaxed">{clusterNarrative}</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/[0.06]">
          <h3 className="text-white text-sm font-medium mb-3">Institutional legend</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(CATEGORY_COLORS)
              .filter(([type]) => !['cluster', 'geo'].includes(type))
              .map(([type, color]) => (
                <div key={type} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#020617]/55 px-3 py-2 text-dark-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="capitalize">{type}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">GTIXT</span>
                </div>
              ))}
          </div>
        </div>
      </aside>
    </div>
    </section>
    </>
  )
}
