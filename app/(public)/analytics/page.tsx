'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { TimeframeKey } from '@/components/analytics/TradingTerminalChart'

const TradingTerminalChart = dynamic(() => import('@/components/analytics/TradingTerminalChart'), {
  loading: () => (
    <div style={{ height: 360, border: '1px solid #1A2333', borderRadius: 10, background: '#070D1A' }} />
  ),
  ssr: false,
})

// ── Types ──────────────────────────────────────────────────────────
type TerminalTF    = '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'ALL'
type DataMode      = 'score' | 'risk' | 'stability' | 'concentration' | 'payout'
type SectorFilter  = 'all' | 'top20' | 'high-risk' | 'new'
type TerminalView  = 'sector' | 'firm' | 'compare'
type PanelPreset   = 'score' | 'risk' | 'resilience' | 'concentration'
type FsrRegime     = 'Stable' | 'Expansion' | 'Stress' | 'Instability' | 'Critical'
type SectorRegimeState = 'Stable' | 'Expansion' | 'Stress' | 'Instability' | 'Collapse'
type TraderStyle = 'scalper' | 'swing' | 'algo' | 'news'
type TraderMarket = 'futures' | 'forex' | 'cfd' | 'crypto'
type DrawdownTolerance = 'low' | 'medium' | 'high'
type StrategyProfile = TraderStyle
type DensityWindow = {
  timeframe: string
  interval: string
  bucketCount: number
  target: number
  coveragePct: number
  surplusBuckets: number
  multiPointBucketPct: number
  avgPointsPerBucket: number
  integrityScore: number
  bucketRatePerDay: number
  etaDaysToTarget: number | null
  expectedBucketRatePerDay: number
  etaDaysAtExpectedRate: number | null
  firstTimestamp: string | null
  lastTimestamp: string | null
}

type TimeframeQualityRow = {
  label: TerminalTF
  apiTimeframe: TimeframeKey
  integrityScore: number
  coveragePct: number
  bucketInterval: string
  count: number
}

const TRADER_STYLE_VALUES: TraderStyle[] = ['scalper', 'swing', 'algo', 'news']
const TRADER_MARKET_VALUES: TraderMarket[] = ['futures', 'forex', 'cfd', 'crypto']
const DRAWDOWN_VALUES: DrawdownTolerance[] = ['low', 'medium', 'high']
const STRATEGY_PROFILE_VALUES: StrategyProfile[] = ['scalper', 'swing', 'algo', 'news']

// ── Mappings ───────────────────────────────────────────────────────
const TF_MAP: Record<TerminalTF, TimeframeKey> = {
  '1H': '1H', '4H': '4H', '1D': '1D', '1W': '7D', '1M': '30D', '1Y': '1Y', 'ALL': 'ALL',
}
const QUALITY_CERT_WINDOWS: TerminalTF[] = ['1H', '4H', '1D', '1W', '1M', 'ALL']
const MODE_PRESET: Record<DataMode, PanelPreset> = {
  score: 'score', risk: 'risk', stability: 'resilience', concentration: 'concentration', payout: 'score',
}

// ── Terminal palette ────────────────────────────────────────────────
const T = {
  bg:     '#050A14',
  panel:  '#070D1A',
  cell:   '#0D1526',
  border: '#1A2333',
  text1:  '#E2E8F0',
  text2:  '#A9B6CC',
  text3:  '#8B9BB4',
  cyan:   '#1ED6FF',
  amber:  '#FFD166',
  rose:   '#FF6B6B',
  purple: '#A78BFA',
  green:  '#22C55E',
  blue:   '#1ED6FF',
  orange: '#F59E0B',
  red:    '#EF4444',
  darkRed:'#7F1D1D',
}

// ── Static intelligence data ───────────────────────────────────────
const FIRM_SIGNALS = [
  { name: 'FundingPips',       signal: 'Payout delay rising',         risk: 'Elevated', score: 64, tone: 'amber',   isNew: false, payoutDelay: 48, ruleChangeRate: 62, complaintVelocity: 55, trafficDrop: 34, liquidityShare: 16, migration: 7, challengePrice: 109, maxCapital: 200000, drawdownDiscipline: 58, payoutReliability: 66, scalingScore: 71, ruleStability: 62, basePassProbability: 6.2, markets: ['forex', 'cfd', 'crypto'], styles: ['scalper', 'swing', 'news'] },
  { name: 'FTMO',              signal: 'Strong track record',         risk: 'Low',      score: 89, tone: 'emerald', isNew: false, payoutDelay: 14, ruleChangeRate: 18, complaintVelocity: 21, trafficDrop: 12, liquidityShare: 34, migration: 11, challengePrice: 155, maxCapital: 200000, drawdownDiscipline: 86, payoutReliability: 91, scalingScore: 88, ruleStability: 90, basePassProbability: 7.1, markets: ['forex', 'cfd', 'crypto'], styles: ['swing', 'algo', 'news'] },
  { name: 'Apex Trader',       signal: 'Rule tightening detected',    risk: 'Moderate', score: 71, tone: 'cyan',    isNew: true,  payoutDelay: 27, ruleChangeRate: 52, complaintVelocity: 39, trafficDrop: 24, liquidityShare: 12, migration: 9, challengePrice: 137, maxCapital: 300000, drawdownDiscipline: 67, payoutReliability: 73, scalingScore: 79, ruleStability: 65, basePassProbability: 6.5, markets: ['futures'], styles: ['scalper', 'algo', 'news'] },
  { name: 'MyForexFunds',      signal: 'Regulatory pressure rising',  risk: 'Critical', score: 42, tone: 'rose',    isNew: false, payoutDelay: 77, ruleChangeRate: 72, complaintVelocity: 84, trafficDrop: 69, liquidityShare: 9, migration: -14, challengePrice: 95, maxCapital: 100000, drawdownDiscipline: 43, payoutReliability: 39, scalingScore: 52, ruleStability: 41, basePassProbability: 4.1, markets: ['forex', 'cfd'], styles: ['scalper', 'swing'] },
  { name: 'The Funded Trader', signal: 'Payout freeze signal',        risk: 'Elevated', score: 58, tone: 'amber',   isNew: true,  payoutDelay: 61, ruleChangeRate: 58, complaintVelocity: 64, trafficDrop: 41, liquidityShare: 11, migration: -5, challengePrice: 99, maxCapital: 200000, drawdownDiscipline: 54, payoutReliability: 57, scalingScore: 68, ruleStability: 56, basePassProbability: 5.2, markets: ['forex', 'cfd'], styles: ['scalper', 'news'] },
  { name: 'TopStep',           signal: 'Stable rule environment',     risk: 'Low',      score: 84, tone: 'emerald', isNew: false, payoutDelay: 18, ruleChangeRate: 24, complaintVelocity: 25, trafficDrop: 17, liquidityShare: 18, migration: 6, challengePrice: 129, maxCapital: 150000, drawdownDiscipline: 79, payoutReliability: 86, scalingScore: 84, ruleStability: 85, basePassProbability: 6.8, markets: ['futures'], styles: ['scalper', 'swing', 'algo'] },
  { name: 'E8 Markets',        signal: 'Execution quality stable',    risk: 'Low',      score: 81, tone: 'emerald', isNew: false, payoutDelay: 22, ruleChangeRate: 26, complaintVelocity: 24, trafficDrop: 14, liquidityShare: 17, migration: 5, challengePrice: 138, maxCapital: 200000, drawdownDiscipline: 77, payoutReliability: 82, scalingScore: 80, ruleStability: 83, basePassProbability: 6.7, markets: ['forex', 'cfd', 'crypto'], styles: ['scalper', 'swing', 'algo'] },
  { name: 'FundedNext',        signal: 'Competitive pricing',         risk: 'Moderate', score: 69, tone: 'cyan',    isNew: true,  payoutDelay: 29, ruleChangeRate: 46, complaintVelocity: 34, trafficDrop: 22, liquidityShare: 13, migration: 8, challengePrice: 89, maxCapital: 200000, drawdownDiscipline: 66, payoutReliability: 72, scalingScore: 76, ruleStability: 68, basePassProbability: 6.1, markets: ['forex', 'cfd', 'crypto'], styles: ['scalper', 'swing'] },
  { name: 'Blue Guardian',     signal: 'Balanced rule stack',         risk: 'Low',      score: 79, tone: 'emerald', isNew: false, payoutDelay: 21, ruleChangeRate: 29, complaintVelocity: 26, trafficDrop: 18, liquidityShare: 15, migration: 6, challengePrice: 117, maxCapital: 200000, drawdownDiscipline: 74, payoutReliability: 80, scalingScore: 78, ruleStability: 79, basePassProbability: 6.4, markets: ['forex', 'cfd'], styles: ['swing', 'algo', 'news'] },
  { name: 'The 5%ers',         signal: 'Conservative model strength', risk: 'Low',      score: 83, tone: 'emerald', isNew: false, payoutDelay: 19, ruleChangeRate: 23, complaintVelocity: 22, trafficDrop: 15, liquidityShare: 19, migration: 7, challengePrice: 139, maxCapital: 250000, drawdownDiscipline: 81, payoutReliability: 85, scalingScore: 82, ruleStability: 84, basePassProbability: 6.9, markets: ['forex'], styles: ['swing', 'news'] },
  { name: 'Alpha Capital',     signal: 'Institutional image intact',  risk: 'Low',      score: 78, tone: 'cyan',    isNew: false, payoutDelay: 24, ruleChangeRate: 31, complaintVelocity: 28, trafficDrop: 17, liquidityShare: 14, migration: 5, challengePrice: 147, maxCapital: 200000, drawdownDiscipline: 73, payoutReliability: 79, scalingScore: 77, ruleStability: 78, basePassProbability: 6.3, markets: ['forex', 'cfd'], styles: ['swing', 'algo'] },
  { name: 'Tradeify',          signal: 'Retail traction rising',      risk: 'Moderate', score: 67, tone: 'cyan',    isNew: true,  payoutDelay: 33, ruleChangeRate: 42, complaintVelocity: 31, trafficDrop: 23, liquidityShare: 11, migration: 9, challengePrice: 101, maxCapital: 150000, drawdownDiscipline: 64, payoutReliability: 69, scalingScore: 74, ruleStability: 67, basePassProbability: 5.9, markets: ['futures'], styles: ['scalper', 'algo'] },
  { name: 'Funding Traders',   signal: 'Scaling rules in review',     risk: 'Moderate', score: 63, tone: 'amber',   isNew: true,  payoutDelay: 35, ruleChangeRate: 48, complaintVelocity: 37, trafficDrop: 28, liquidityShare: 10, migration: 4, challengePrice: 97, maxCapital: 200000, drawdownDiscipline: 61, payoutReliability: 65, scalingScore: 70, ruleStability: 63, basePassProbability: 5.7, markets: ['forex', 'cfd'], styles: ['scalper', 'swing'] },
  { name: 'Lux Trading Firm',  signal: 'Premium challenge friction',  risk: 'Moderate', score: 72, tone: 'cyan',    isNew: false, payoutDelay: 26, ruleChangeRate: 37, complaintVelocity: 30, trafficDrop: 19, liquidityShare: 16, migration: 5, challengePrice: 199, maxCapital: 250000, drawdownDiscipline: 69, payoutReliability: 75, scalingScore: 76, ruleStability: 72, basePassProbability: 6.0, markets: ['forex', 'cfd'], styles: ['swing', 'algo'] },
  { name: 'City Traders Imperium', signal: 'Scaling engine stable',   risk: 'Low',      score: 77, tone: 'emerald', isNew: false, payoutDelay: 23, ruleChangeRate: 28, complaintVelocity: 27, trafficDrop: 16, liquidityShare: 18, migration: 6, challengePrice: 149, maxCapital: 200000, drawdownDiscipline: 75, payoutReliability: 81, scalingScore: 79, ruleStability: 80, basePassProbability: 6.5, markets: ['forex'], styles: ['swing', 'news'] },
  { name: 'BrightFunded',      signal: 'Fast growth, medium control', risk: 'Moderate', score: 66, tone: 'cyan',    isNew: true,  payoutDelay: 31, ruleChangeRate: 44, complaintVelocity: 36, trafficDrop: 24, liquidityShare: 12, migration: 8, challengePrice: 119, maxCapital: 200000, drawdownDiscipline: 63, payoutReliability: 68, scalingScore: 73, ruleStability: 66, basePassProbability: 5.8, markets: ['forex', 'crypto'], styles: ['scalper', 'news'] },
  { name: 'Instant Funding',   signal: 'One-step appeal holding',     risk: 'Moderate', score: 68, tone: 'amber',   isNew: false, payoutDelay: 34, ruleChangeRate: 41, complaintVelocity: 33, trafficDrop: 26, liquidityShare: 11, migration: 6, challengePrice: 129, maxCapital: 100000, drawdownDiscipline: 62, payoutReliability: 70, scalingScore: 72, ruleStability: 65, basePassProbability: 5.6, markets: ['forex', 'cfd'], styles: ['scalper', 'swing'] },
  { name: 'Maven Trading',     signal: 'Good futures consistency',    risk: 'Low',      score: 80, tone: 'emerald', isNew: false, payoutDelay: 20, ruleChangeRate: 25, complaintVelocity: 24, trafficDrop: 15, liquidityShare: 17, migration: 6, challengePrice: 119, maxCapital: 150000, drawdownDiscipline: 78, payoutReliability: 83, scalingScore: 81, ruleStability: 82, basePassProbability: 6.6, markets: ['futures'], styles: ['scalper', 'algo', 'swing'] },
  { name: 'Funded Trading Plus', signal: 'Mixed sentiment expansion', risk: 'Moderate', score: 65, tone: 'amber',   isNew: true,  payoutDelay: 37, ruleChangeRate: 45, complaintVelocity: 38, trafficDrop: 27, liquidityShare: 10, migration: 3, challengePrice: 109, maxCapital: 200000, drawdownDiscipline: 60, payoutReliability: 67, scalingScore: 71, ruleStability: 64, basePassProbability: 5.5, markets: ['forex', 'cfd'], styles: ['scalper', 'news'] },
  { name: 'Fintokei',          signal: 'Challenge structure improving', risk: 'Low',     score: 76, tone: 'emerald', isNew: false, payoutDelay: 22, ruleChangeRate: 30, complaintVelocity: 29, trafficDrop: 16, liquidityShare: 15, migration: 7, challengePrice: 129, maxCapital: 200000, drawdownDiscipline: 74, payoutReliability: 78, scalingScore: 77, ruleStability: 79, basePassProbability: 6.2, markets: ['forex', 'cfd'], styles: ['swing', 'algo'] },
  { name: 'Audacity Capital',  signal: 'Premium rules, tighter pass', risk: 'Moderate', score: 73, tone: 'cyan',    isNew: false, payoutDelay: 25, ruleChangeRate: 34, complaintVelocity: 30, trafficDrop: 20, liquidityShare: 14, migration: 4, challengePrice: 199, maxCapital: 500000, drawdownDiscipline: 71, payoutReliability: 76, scalingScore: 75, ruleStability: 74, basePassProbability: 5.9, markets: ['forex'], styles: ['swing', 'news'] },
  { name: 'Funded Engineer',   signal: 'Trader feedback improving',   risk: 'Low',      score: 75, tone: 'emerald', isNew: true,  payoutDelay: 24, ruleChangeRate: 31, complaintVelocity: 27, trafficDrop: 18, liquidityShare: 13, migration: 8, challengePrice: 87, maxCapital: 200000, drawdownDiscipline: 72, payoutReliability: 77, scalingScore: 76, ruleStability: 78, basePassProbability: 6.1, markets: ['forex', 'crypto'], styles: ['scalper', 'swing'] },
  { name: 'Goat Funded Trader', signal: 'Aggressive growth monitored', risk: 'Elevated', score: 59, tone: 'amber',  isNew: true,  payoutDelay: 43, ruleChangeRate: 53, complaintVelocity: 41, trafficDrop: 29, liquidityShare: 9, migration: 6, challengePrice: 99, maxCapital: 200000, drawdownDiscipline: 57, payoutReliability: 62, scalingScore: 69, ruleStability: 60, basePassProbability: 5.1, markets: ['forex', 'cfd', 'crypto'], styles: ['scalper', 'news'] },
]

const PROFILE_PRESETS: Record<StrategyProfile, { style: TraderStyle; market: TraderMarket; drawdown: DrawdownTolerance; budget: number; capital: number }> = {
  scalper: { style: 'scalper', market: 'futures', drawdown: 'low', budget: 120, capital: 100000 },
  swing: { style: 'swing', market: 'forex', drawdown: 'medium', budget: 150, capital: 100000 },
  algo: { style: 'algo', market: 'futures', drawdown: 'medium', budget: 180, capital: 200000 },
  news: { style: 'news', market: 'forex', drawdown: 'high', budget: 100, capital: 100000 },
}

const RCI_EVENTS = [
  { date: '2024-01-18', firm: 'Apex Trader', change: 'Daily drawdown threshold adjusted', impact: 8, type: 'rules' },
  { date: '2024-03-07', firm: 'The Funded Trader', change: 'Payout cadence shifted to longer cycle', impact: 12, type: 'payout' },
  { date: '2024-06-02', firm: 'FundingPips', change: 'New restriction on weekend exposure', impact: 6, type: 'restriction' },
  { date: '2024-09-14', firm: 'MyForexFunds', change: 'Minimum payout threshold increased', impact: 14, type: 'payout' },
  { date: '2025-01-22', firm: 'TopStep', change: 'Scaling policy updated with stricter checkpoints', impact: 5, type: 'scaling' },
]

const BOTTOM_PANELS: { preset: PanelPreset; label: string; desc: string }[] = [
  { preset: 'resilience',    label: 'Stability Index',    desc: 'Operator stability'         },
  { preset: 'risk',          label: 'Risk Index',         desc: 'Operational risk regime'    },
  { preset: 'concentration', label: 'Concentration',      desc: 'Capital concentration'      },
  { preset: 'score',         label: 'Payout Reliability', desc: 'Score as payout proxy'      },
]

// ── Tone helper ────────────────────────────────────────────────────
const TONE: Record<string, { text: string; bg: string; border: string }> = {
  emerald: { text: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)'  },
  cyan:    { text: '#1ED6FF', bg: 'rgba(30,214,255,0.10)',  border: 'rgba(30,214,255,0.25)' },
  amber:   { text: '#FFD166', bg: 'rgba(255,209,102,0.10)', border: 'rgba(255,209,102,0.3)' },
  rose:    { text: '#FF6B6B', bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.3)' },
}

type StaticFirmSignal = typeof FIRM_SIGNALS[number]
type FirmSignal = StaticFirmSignal

type LiveRankingFirm = {
  name: string
  score: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  payoutReliability: number
  status: string | null
  rule_changes_frequency: string | null
  externalCoverage?: {
    activeSources?: number
    sourceNames?: string[]
    lastCollectedAt?: string | null
  }
}

type RankingFreshness = {
  generated_at?: string | null
  snapshot_created_at?: string | null
  fallback_collected_at?: string | null
}
const STALE_THRESHOLD_HOURS = 8

function normalizeFirmName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function mapLiveRiskToSignalRisk(risk: LiveRankingFirm['risk']): FirmSignal['risk'] {
  if (risk === 'LOW') return 'Low'
  if (risk === 'MEDIUM') return 'Moderate'
  return 'Elevated'
}

function mapRiskTone(risk: FirmSignal['risk']): FirmSignal['tone'] {
  if (risk === 'Low') return 'emerald'
  if (risk === 'Moderate') return 'cyan'
  if (risk === 'Elevated') return 'amber'
  return 'rose'
}

function mapRuleFrequencyScore(value: string | null): number {
  const normalized = (value || '').toLowerCase()
  if (!normalized) return 38
  if (normalized.includes('high') || normalized.includes('daily') || normalized.includes('frequent')) return 66
  if (normalized.includes('low') || normalized.includes('stable')) return 24
  return 44
}

function evidenceCoverageScore(firm: FirmSignal): number {
  return clampPct((firm.ruleStability * 0.58) + (firm.liquidityShare * 1.35))
}

function signalFromLiveRow(row: LiveRankingFirm): string {
  const status = (row.status || '').toLowerCase()
  if (status.includes('inactive') || status.includes('suspend')) return 'Operational status flagged'
  if (status.includes('watch')) return 'Watchlist monitoring active'
  const rule = mapRuleFrequencyScore(row.rule_changes_frequency)
  if (rule >= 60) return 'Rule velocity accelerating'
  if (rule <= 28) return 'Rule framework stable'
  return 'Mixed operating signals'
}

const FSR_TONE: Record<FsrRegime, { color: string; bg: string }> = {
  Stable: { color: T.green, bg: 'rgba(34,197,94,0.12)' },
  Expansion: { color: T.blue, bg: 'rgba(30,214,255,0.12)' },
  Stress: { color: T.orange, bg: 'rgba(245,158,11,0.14)' },
  Instability: { color: T.red, bg: 'rgba(239,68,68,0.14)' },
  Critical: { color: T.darkRed, bg: 'rgba(127,29,29,0.24)' },
}

const PFRE_TONE: Record<SectorRegimeState, { color: string; bg: string }> = {
  Stable: { color: T.green, bg: 'rgba(34,197,94,0.12)' },
  Expansion: { color: T.blue, bg: 'rgba(30,214,255,0.12)' },
  Stress: { color: T.orange, bg: 'rgba(245,158,11,0.14)' },
  Instability: { color: T.red, bg: 'rgba(239,68,68,0.14)' },
  Collapse: { color: T.darkRed, bg: 'rgba(127,29,29,0.24)' },
}

function classifyFsr(score: number): FsrRegime {
  if (score >= 82) return 'Stable'
  if (score >= 70) return 'Expansion'
  if (score >= 55) return 'Stress'
  if (score >= 40) return 'Instability'
  return 'Critical'
}

function fsrScoreForFirm(firm: FirmSignal): number {
  const coverage = evidenceCoverageScore(firm)
  return Math.round(clampPct(
    (firm.score * 0.42) +
    (firm.payoutReliability * 0.28) +
    (firm.ruleStability * 0.18) +
    (coverage * 0.12)
  ))
}

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function classifyPfreRegime(score: number): SectorRegimeState {
  if (score >= 78) return 'Stable'
  if (score >= 64) return 'Expansion'
  if (score >= 50) return 'Stress'
  if (score >= 36) return 'Instability'
  return 'Collapse'
}

// ── Page ────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [tf, setTf]                     = useState<TerminalTF>('1D')
  const [mode, setMode]                 = useState<DataMode>('score')
  const [filter, setFilter]             = useState<SectorFilter>('all')
  const [view, setView]                 = useState<TerminalView>('sector')
  const [focusedFirm, setFocusedFirm]  = useState<FirmSignal | null>(null)
  const [compareSelection, setCompareSelection] = useState<string[]>([])
  const [targetCapital, setTargetCapital] = useState(100000)
  const [traderStyle, setTraderStyle] = useState<TraderStyle>('scalper')
  const [traderMarket, setTraderMarket] = useState<TraderMarket>('futures')
  const [drawdownTolerance, setDrawdownTolerance] = useState<DrawdownTolerance>('low')
  const [challengeBudget, setChallengeBudget] = useState(100)
  const [strategyProfile, setStrategyProfile] = useState<StrategyProfile>('scalper')
  const [shareCopied, setShareCopied] = useState(false)
  const [imageExporting, setImageExporting] = useState(false)
  const [pfmeHydrated, setPfmeHydrated] = useState(false)
  const [densityWindows, setDensityWindows] = useState<DensityWindow[]>([])
  const [densityGeneratedAt, setDensityGeneratedAt] = useState<string | null>(null)
  const [overallIntegrityScore, setOverallIntegrityScore] = useState(0)
  const [densityLoading, setDensityLoading] = useState(true)
  const [densityError, setDensityError] = useState<string | null>(null)
  const [timeframeQuality, setTimeframeQuality] = useState<TimeframeQualityRow[]>([])
  const [timeframeQualityLoading, setTimeframeQualityLoading] = useState(true)
  const [explainAudience, setExplainAudience] = useState<'retail' | 'investor' | 'data'>('retail')
  const [liveRankingSignals, setLiveRankingSignals] = useState<LiveRankingFirm[]>([])
  const [firmSignalsAsOf, setFirmSignalsAsOf] = useState(() => new Date().toISOString().slice(0, 10))
  const [firmSignalsTimestamp, setFirmSignalsTimestamp] = useState<string | null>(null)
  const [firmSignalsSourceLabel, setFirmSignalsSourceLabel] = useState('fallback')
  const pfmeCardRef = useRef<HTMLDivElement | null>(null)

  const mergedFirmSignals = useMemo(() => {
    if (liveRankingSignals.length === 0) return FIRM_SIGNALS

    const staticByName = new Map(FIRM_SIGNALS.map((firm) => [normalizeFirmName(firm.name), firm]))
    const liveMapped = liveRankingSignals.map((row): FirmSignal => {
      const staticMatch = staticByName.get(normalizeFirmName(row.name))
      const score = Math.max(0, Math.min(100, Number(row.score || 0)))
      const payoutReliability = Math.max(0, Math.min(100, Number(row.payoutReliability || staticMatch?.payoutReliability || 0)))
      const risk = mapLiveRiskToSignalRisk(row.risk)
      const ruleChangeRate = staticMatch?.ruleChangeRate ?? mapRuleFrequencyScore(row.rule_changes_frequency)
      const payoutDelay = staticMatch?.payoutDelay ?? Math.round(Math.max(10, 72 - payoutReliability * 0.62))
      const complaintVelocity = staticMatch?.complaintVelocity ?? Math.round(Math.max(16, 92 - score * 0.78))
      const trafficDrop = staticMatch?.trafficDrop ?? Math.round(Math.max(8, 86 - score * 0.65))
      const activeSources = Math.max(0, Number(row.externalCoverage?.activeSources || 0))
      const liquidityShare = staticMatch?.liquidityShare ?? Math.round(Math.min(35, 10 + activeSources * 4))
      const migration = staticMatch?.migration ?? Math.round((score - 60) / 5)
      const ruleStability = staticMatch?.ruleStability ?? Math.round(Math.max(35, 100 - ruleChangeRate * 0.72))

      return {
        ...(staticMatch || FIRM_SIGNALS[0]),
        name: row.name,
        signal: signalFromLiveRow(row),
        risk,
        tone: mapRiskTone(risk),
        isNew: !staticMatch,
        score,
        payoutReliability,
        payoutDelay,
        ruleChangeRate,
        complaintVelocity,
        trafficDrop,
        liquidityShare,
        migration,
        ruleStability,
      }
    })

    const liveNames = new Set(liveMapped.map((firm) => normalizeFirmName(firm.name)))
    const staticFallback = FIRM_SIGNALS.filter((firm) => !liveNames.has(normalizeFirmName(firm.name)))
    return [...liveMapped, ...staticFallback]
  }, [liveRankingSignals])

  const rankedFirmSignals = [...mergedFirmSignals].sort((a, b) => b.score - a.score)
  const trackedFirmCount = rankedFirmSignals.length
  const filteredFirms = (() => {
    if (filter === 'all') return rankedFirmSignals
    if (filter === 'top20') return rankedFirmSignals.slice(0, 20)
    if (filter === 'high-risk') return rankedFirmSignals.filter((firm) => firm.risk === 'Elevated' || firm.risk === 'Critical')
    return rankedFirmSignals.filter((firm) => firm.isNew)
  })()

    const freshnessState = useMemo(() => {
      if (!firmSignalsTimestamp) {
        return {
          badge: 'UNKNOWN',
          color: T.text3,
          ageHours: null as number | null,
        }
      }

      const ageMs = Date.now() - new Date(firmSignalsTimestamp).getTime()
      const ageHours = Number((ageMs / (1000 * 60 * 60)).toFixed(1))

      if (ageHours <= STALE_THRESHOLD_HOURS) {
        return { badge: 'LIVE', color: T.green, ageHours }
      }

      return { badge: 'STALE', color: T.rose, ageHours }
    }, [firmSignalsTimestamp])
  const fsrByFirm = filteredFirms.map((firm) => {
    const fsrScore = fsrScoreForFirm(firm)
    return {
      ...firm,
      fsrScore,
      regime: classifyFsr(fsrScore),
    }
  })

  const fsrCounts = fsrByFirm.reduce<Record<FsrRegime, number>>((acc, firm) => {
    acc[firm.regime] += 1
    return acc
  }, {
    Stable: 0,
    Expansion: 0,
    Stress: 0,
    Instability: 0,
    Critical: 0,
  })

  const liquidityMap = [...filteredFirms]
    .sort((a, b) => b.liquidityShare - a.liquidityShare)

  const top3Liquidity = liquidityMap.slice(0, 3).reduce((sum, firm) => sum + firm.liquidityShare, 0)
  const avgMigration = liquidityMap.length > 0
    ? Number((liquidityMap.reduce((sum, firm) => sum + firm.migration, 0) / liquidityMap.length).toFixed(1))
    : 0
  const rapidInflow = liquidityMap.filter((firm) => firm.migration >= 8)
  const rapidOutflow = liquidityMap.filter((firm) => firm.migration <= -8)

  const rciFeed = RCI_EVENTS
    .filter((event) => filter === 'all' || filteredFirms.some((firm) => firm.name === event.firm))
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const topStabilityFirms = [...fsrByFirm]
    .sort((a, b) => b.fsrScore - a.fsrScore)
    .slice(0, 3)

  const fsrAlerts = fsrByFirm.filter((firm) => firm.regime === 'Instability' || firm.regime === 'Critical')

  const pfreOperationalStability = filteredFirms.length
    ? Number((fsrByFirm.reduce((sum, firm) => sum + firm.fsrScore, 0) / filteredFirms.length).toFixed(1))
    : 0
  const pfrePayoutReliability = filteredFirms.length
    ? Number((filteredFirms.reduce((sum, firm) => sum + firm.payoutReliability, 0) / filteredFirms.length).toFixed(1))
    : 0
  const pfreEvidenceCoverage = filteredFirms.length
    ? Number((filteredFirms.reduce((sum, firm) => sum + evidenceCoverageScore(firm), 0) / filteredFirms.length).toFixed(1))
    : 0
  const pfreRiskSignals = filteredFirms.length
    ? Number((filteredFirms.reduce((sum, firm) => {
        const riskSignal = clampPct(
          ((100 - firm.score) * 0.34) +
          ((100 - firm.payoutReliability) * 0.24) +
          (firm.ruleChangeRate * 0.24) +
          ((100 - firm.ruleStability) * 0.18)
        )
        return sum + riskSignal
      }, 0) / filteredFirms.length).toFixed(1))
    : 0
  const pfreRuleStability = filteredFirms.length
    ? Number((filteredFirms.reduce((sum, firm) => sum + firm.ruleStability, 0) / filteredFirms.length).toFixed(1))
    : 0
  const pfreRegimeScore = clampPct(
    (pfreOperationalStability * 0.34) +
    (pfrePayoutReliability * 0.26) +
    (pfreEvidenceCoverage * 0.18) +
    (pfreRuleStability * 0.14) -
    (pfreRiskSignals * 0.18)
  )
  const pfreRegimeState = classifyPfreRegime(pfreRegimeScore)
  const pfreHeadline =
    pfreRegimeState === 'Stable' ? 'Sector remains institutionally navigable.' :
    pfreRegimeState === 'Expansion' ? 'Recovery breadth is widening across monitored firms.' :
    pfreRegimeState === 'Stress' ? 'Stress regime active, requiring selective exposure.' :
    pfreRegimeState === 'Instability' ? 'Instability regime detected, capital discipline required.' :
    'Collapse risk regime active, avoid expansion.'
  const collapsePredictor = [...filteredFirms]
    .map((firm) => {
      const coverage = evidenceCoverageScore(firm)
      const collapseProbability = clampPct(
        ((100 - firm.score) * 0.31) +
        ((100 - firm.payoutReliability) * 0.23) +
        (firm.ruleChangeRate * 0.22) +
        ((100 - firm.ruleStability) * 0.14) +
        ((100 - coverage) * 0.1) +
        (Math.max(0, -firm.migration) * 1.35) +
        (Math.max(0, 60 - firm.score) * 0.12)
      )
      const warningBand = collapseProbability >= 65 ? 'Critical' : collapseProbability >= 45 ? 'Elevated' : collapseProbability >= 30 ? 'Watch' : 'Contained'
      return {
        ...firm,
        evidenceCoverage: coverage,
        collapseProbability: Math.round(collapseProbability),
        warningBand,
      }
    })
    .sort((a, b) => b.collapseProbability - a.collapseProbability)
  const drawdownTarget = drawdownTolerance === 'low' ? 84 : drawdownTolerance === 'medium' ? 64 : 44
  const pfmeResults = [...mergedFirmSignals]
    .map((firm) => {
      const styleFit = firm.styles.includes(traderStyle) ? 100 : 45
      const marketFit = firm.markets.includes(traderMarket) ? 100 : 30
      const budgetFit = firm.challengePrice <= challengeBudget
        ? 100
        : clampPct(100 - ((firm.challengePrice - challengeBudget) / Math.max(challengeBudget, 1)) * 60)
      const capitalFit = clampPct(100 - (Math.abs(firm.maxCapital - targetCapital) / Math.max(targetCapital, 1)) * 45)
      const drawdownFit = clampPct(100 - Math.abs(firm.drawdownDiscipline - drawdownTarget))
      const riskFit = firm.score
      const compatibilityRaw =
        styleFit * 0.18 +
        marketFit * 0.16 +
        budgetFit * 0.16 +
        capitalFit * 0.12 +
        drawdownFit * 0.14 +
        firm.payoutReliability * 0.12 +
        riskFit * 0.08 +
        firm.ruleStability * 0.04

      const compatibility = Math.round(clampPct(compatibilityRaw))
      const passProbability = Number(((firm.basePassProbability * 0.55) + (compatibility / 100) * 4.4).toFixed(1))
      const avgPayoutDelayDays = Number((firm.payoutDelay / 6.4).toFixed(1))
      const operationalRisk = compatibility >= 82 ? 'Low' : compatibility >= 64 ? 'Moderate' : compatibility >= 50 ? 'Elevated' : 'High'
      return {
        ...firm,
        compatibility,
        passProbability,
        avgPayoutDelayDays,
        operationalRisk,
      }
    })
    .sort((a, b) => b.compatibility - a.compatibility)

  const bestMatch = pfmeResults[0]
  const profileRegimeFit = bestMatch
    ? clampPct((bestMatch.compatibility * 0.58) + (pfreRegimeScore * 0.42))
    : pfreRegimeScore
  const shareText = bestMatch
    ? `My GTIXT Prop Match: ${bestMatch.name} (${bestMatch.compatibility}%) | Pass ${bestMatch.passProbability}% | Risk ${bestMatch.operationalRisk}`
    : 'My GTIXT Prop Match'
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/analytics?profile=${strategyProfile}&capital=${targetCapital}&style=${traderStyle}&market=${traderMarket}&drawdown=${drawdownTolerance}&budget=${challengeBudget}`
    : ''
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
  const redditShareUrl = `https://www.reddit.com/submit?title=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  const selectedCompareFirms = filteredFirms.filter((firm) => compareSelection.includes(firm.name))
  const overallDensityCoverage = densityWindows.length
    ? Number((densityWindows.reduce((sum, row) => sum + row.coveragePct, 0) / densityWindows.length).toFixed(1))
    : 0
  const mostReadyWindow = [...densityWindows].sort((a, b) => b.coveragePct - a.coveragePct)[0] || null
  const bestIntegrityWindow = [...densityWindows].sort((a, b) => b.integrityScore - a.integrityScore)[0] || null

  const chartTf    = TF_MAP[tf]
  const integrityBand = overallIntegrityScore >= 80 ? 'Institutional' : overallIntegrityScore >= 65 ? 'Acceptable' : 'Sparse'
  const integrityBandColor = overallIntegrityScore >= 80 ? T.green : overallIntegrityScore >= 65 ? T.amber : T.rose
  const mainPreset: PanelPreset =
    view === 'firm' && focusedFirm
      ? (focusedFirm.score >= 75 ? 'score' : focusedFirm.score >= 55 ? 'resilience' : 'risk')
      : MODE_PRESET[mode]
  const mainTitle =
    view === 'firm' && focusedFirm ? `${focusedFirm.name} — Score Evolution`
    : view === 'compare' && selectedCompareFirms.length > 0 ? `Compare Basket — ${selectedCompareFirms.length} Firms`
    : mode === 'score'         ? 'GTIXT Sector Score'
    : mode === 'risk'          ? 'Sector Risk Index'
    : mode === 'stability'     ? 'Stability Regime'
    : mode === 'concentration' ? 'Concentration Pressure'
    : 'Payout Reliability Index'
  const topCollapse = collapsePredictor[0]
  const chartRegimeContext = {
    regimeState: pfreRegimeState,
    regimeScore: pfreRegimeScore,
    profileFit: profileRegimeFit,
    topCollapseProbability: topCollapse?.collapseProbability || 0,
    topCollapseFirm: topCollapse?.name || 'N/A',
    highRiskFirmCount: collapsePredictor.filter((firm) => firm.warningBand === 'Critical' || firm.warningBand === 'Elevated').length,
    eventSignals: rciFeed.slice(0, 4).map((event) => ({ label: `${event.firm}: ${event.type}`, impact: event.impact })),
  }
  const sectorHealthScore = filteredFirms.length
    ? Number((filteredFirms.reduce((sum, firm) => sum + firm.score, 0) / filteredFirms.length).toFixed(1))
    : 0
  const sectorState = {
    health: sectorHealthScore,
    riskLabel: pfreRegimeState === 'Stable' || pfreRegimeState === 'Expansion' ? 'Contained' : pfreRegimeState === 'Stress' ? 'Selective' : 'Elevated',
    firmCount: trackedFirmCount,
    activeAlerts: collapsePredictor.filter((firm) => firm.warningBand === 'Critical' || firm.warningBand === 'Elevated').length,
  }
  const stabilityBands = (Object.keys(fsrCounts) as FsrRegime[]).map((regime) => ({
    label: regime,
    pct: filteredFirms.length ? Math.round((fsrCounts[regime] / filteredFirms.length) * 100) : 0,
    color: FSR_TONE[regime].color,
  }))
  const scoreBands = [
    { tier: 'Premium 85+', count: filteredFirms.filter((firm) => firm.score >= 85).length, label: 'Benchmark leaders', color: T.cyan },
    { tier: 'Established 75-84', count: filteredFirms.filter((firm) => firm.score >= 75 && firm.score < 85).length, label: 'Institutional quality', color: T.green },
    { tier: 'Monitored 65-74', count: filteredFirms.filter((firm) => firm.score >= 65 && firm.score < 75).length, label: 'Selective coverage', color: T.amber },
    { tier: 'Fragile <65', count: filteredFirms.filter((firm) => firm.score < 65).length, label: 'Escalation watch', color: T.rose },
  ].map((band) => ({
    ...band,
    value: filteredFirms.length ? `${Math.round((band.count / filteredFirms.length) * 100)}%` : '0%',
  }))
  const risingCount = filteredFirms.filter((firm) => firm.ruleChangeRate >= 45 || firm.complaintVelocity >= 45).length
  const atRiskCount = filteredFirms.filter((firm) => firm.score < 65 || firm.risk === 'Elevated' || firm.risk === 'Critical').length
  const stableCoreCount = filteredFirms.filter((firm) => firm.score >= 75 && (firm.risk === 'Low' || firm.risk === 'Moderate')).length
  const marketStressPct = Math.round(clampPct((sectorState.activeAlerts / Math.max(filteredFirms.length, 1)) * 100))
  const liveWarningItems = [
    sectorState.activeAlerts > 0
      ? { level: 'warn', text: `${sectorState.activeAlerts} firms currently sit in elevated or critical instability watch.` }
      : { level: 'info', text: 'No firms are currently in elevated collapse watch.' },
    filteredFirms.filter((firm) => firm.ruleChangeRate >= 50).length > 0
      ? { level: 'warn', text: `${filteredFirms.filter((firm) => firm.ruleChangeRate >= 50).length} firms show accelerated rule-change velocity.` }
      : { level: 'info', text: 'Rule-change velocity remains contained across the active scope.' },
    freshnessState.badge === 'LIVE'
      ? { level: 'info', text: `Published evidence is live with ${freshnessState.ageHours ?? 0}h latency.` }
      : { level: 'warn', text: 'Published evidence is stale; terminal overlays are being served from the latest available GTIXT source.' },
  ]
  const evidenceMatrix = [
    {
      label: 'Rankings Source',
      value: liveRankingSignals.length > 0 ? 'Live GTIXT rankings' : 'GTIXT baseline reference set',
      color: liveRankingSignals.length > 0 ? T.green : T.amber,
    },
    {
      label: 'Publication State',
      value: firmSignalsSourceLabel === 'snapshot' ? 'Published snapshot' : firmSignalsSourceLabel === 'collection-fallback' ? 'Collection fallback' : 'Generated state',
      color: firmSignalsSourceLabel === 'snapshot' ? T.cyan : firmSignalsSourceLabel === 'collection-fallback' ? T.amber : T.text2,
    },
    {
      label: 'Signal Freshness',
      value: freshnessState.ageHours !== null ? `${freshnessState.badge} ${freshnessState.ageHours}h` : freshnessState.badge,
      color: freshnessState.color,
    },
    {
      label: 'History Density',
      value: densityLoading ? 'Loading' : `${overallIntegrityScore.toFixed(1)} / ${overallDensityCoverage.toFixed(1)}%`,
      color: integrityBandColor,
    },
  ]

  function focusFirm(firm: FirmSignal) {
    setFocusedFirm(firm)
    setCompareSelection([])
    setView('firm')
  }

  function toggleCompareFirm(firm: FirmSignal) {
    setView('compare')
    setFocusedFirm(null)
    setCompareSelection((current) => {
      if (current.includes(firm.name)) return current.filter((name) => name !== firm.name)
      if (current.length >= 4) return current
      return [...current, firm.name]
    })
  }

  function clearFocus() {
    setFocusedFirm(null)
    setCompareSelection([])
    setView('sector')
  }

  useEffect(() => {
    const applyParamsFromUrl = (query: string) => {
      const params = new URLSearchParams(query)
      const profile = params.get('profile')
      const capital = Number(params.get('capital'))
      const style = params.get('style')
      const market = params.get('market')
      const drawdown = params.get('drawdown')
      const budget = Number(params.get('budget'))

      if (profile && STRATEGY_PROFILE_VALUES.includes(profile as StrategyProfile)) {
        setStrategyProfile(profile as StrategyProfile)
      }
      if (Number.isFinite(capital) && capital > 0) setTargetCapital(capital)
      if (style && TRADER_STYLE_VALUES.includes(style as TraderStyle)) setTraderStyle(style as TraderStyle)
      if (market && TRADER_MARKET_VALUES.includes(market as TraderMarket)) setTraderMarket(market as TraderMarket)
      if (drawdown && DRAWDOWN_VALUES.includes(drawdown as DrawdownTolerance)) setDrawdownTolerance(drawdown as DrawdownTolerance)
      if (Number.isFinite(budget) && budget > 0) setChallengeBudget(budget)
      setPfmeHydrated(true)
    }

    applyParamsFromUrl(window.location.search)

    const handlePopstate = () => {
      applyParamsFromUrl(window.location.search)
    }

    window.addEventListener('popstate', handlePopstate)
    return () => {
      window.removeEventListener('popstate', handlePopstate)
    }
  }, [])

  useEffect(() => {
    if (!pfmeHydrated) return

    const params = new URLSearchParams(window.location.search)
    params.set('profile', strategyProfile)
    params.set('capital', String(targetCapital))
    params.set('style', traderStyle)
    params.set('market', traderMarket)
    params.set('drawdown', drawdownTolerance)
    params.set('budget', String(challengeBudget))

    const nextUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', nextUrl)
  }, [pfmeHydrated, strategyProfile, targetCapital, traderStyle, traderMarket, drawdownTolerance, challengeBudget])

  useEffect(() => {
    let active = true
    let pollTimer: ReturnType<typeof setInterval> | null = null

    const loadLiveFirmSignals = async () => {
      try {
        const response = await fetch('/api/rankings?limit=120', { cache: 'no-store' })
        if (!response.ok) return
        const payload = await response.json()
        if (!active) return
        const rows = Array.isArray(payload?.data) ? payload.data : []
        const freshness = (payload?.freshness || {}) as RankingFreshness
        const latestPerFirmCollectedAt = rows.reduce((latest: string | null, row: Record<string, unknown>) => {
          const candidate = (row?.externalCoverage as Record<string, unknown>)?.lastCollectedAt
          if (typeof candidate !== 'string' || !candidate) return latest
          if (!latest || candidate > latest) return candidate
          return latest
        }, null as string | null)

        const normalizedRows: LiveRankingFirm[] = rows
          .filter((row: Record<string, unknown>) => typeof row?.name === 'string' && (row.name as string).trim().length > 0)
          .map((row: Record<string, unknown>) => ({
            name: String(row.name).trim(),
            score: Number(row.score || 0),
            risk: (String(row.risk || 'MEDIUM').toUpperCase() === 'LOW'
              ? 'LOW'
              : String(row.risk || 'MEDIUM').toUpperCase() === 'HIGH'
                ? 'HIGH'
                : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
            payoutReliability: Number(row.payoutReliability || 0),
            status: row.status ? String(row.status) : null,
            rule_changes_frequency: row.rule_changes_frequency ? String(row.rule_changes_frequency) : null,
            externalCoverage: row.externalCoverage && typeof row.externalCoverage === 'object'
              ? {
                  activeSources: Number((row.externalCoverage as { activeSources?: number }).activeSources || 0),
                  sourceNames: Array.isArray((row.externalCoverage as { sourceNames?: unknown[] }).sourceNames)
                    ? (row.externalCoverage as { sourceNames?: unknown[] }).sourceNames?.map((value) => String(value))
                    : [],
                  lastCollectedAt: typeof (row.externalCoverage as { lastCollectedAt?: unknown }).lastCollectedAt === 'string'
                    ? String((row.externalCoverage as { lastCollectedAt?: unknown }).lastCollectedAt)
                    : null,
                }
              : undefined,
          }))

        setLiveRankingSignals(normalizedRows)

        const primaryTs =
          freshness.snapshot_created_at ||
          freshness.fallback_collected_at ||
          latestPerFirmCollectedAt ||
          freshness.generated_at ||
          null

        setFirmSignalsTimestamp(primaryTs)
        setFirmSignalsAsOf((primaryTs || new Date().toISOString()).slice(0, 10))
        setFirmSignalsSourceLabel(
          freshness.snapshot_created_at
            ? 'snapshot'
            : freshness.fallback_collected_at || latestPerFirmCollectedAt
              ? 'collection-fallback'
              : 'generated'
        )
      } catch {
        // Keep static fallback when live API is unavailable.
      }
    }

    loadLiveFirmSignals()
    pollTimer = setInterval(loadLiveFirmSignals, 60000)

    return () => {
      active = false
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadDensity = async () => {
      setDensityLoading(true)
      setDensityError(null)

      try {
        const response = await fetch('/api/analytics/density', { cache: 'no-store' })
        if (!response.ok) throw new Error(`Density API failed (${response.status})`)

        const payload = await response.json()
        if (!active) return

        setDensityWindows(Array.isArray(payload?.windows) ? payload.windows : [])
        setOverallIntegrityScore(Number(payload?.overallIntegrityScore || 0))
        setDensityGeneratedAt(typeof payload?.generatedAt === 'string' ? payload.generatedAt : null)
      } catch (error) {
        if (!active) return
        setDensityError(error instanceof Error ? error.message : 'Density unavailable')
        setDensityWindows([])
        setOverallIntegrityScore(0)
        setDensityGeneratedAt(null)
      } finally {
        if (active) setDensityLoading(false)
      }
    }

    loadDensity()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadTimeframeQuality = async () => {
      setTimeframeQualityLoading(true)

      try {
        const results = await Promise.all(
          QUALITY_CERT_WINDOWS.map(async (label) => {
            const apiTimeframe = TF_MAP[label]
            const response = await fetch(`/api/analytics/terminal?preset=score&timeframe=${apiTimeframe}`, { cache: 'no-store' })
            if (!response.ok) throw new Error(`Quality API failed for ${label}`)

            const payload = await response.json()

            return {
              label,
              apiTimeframe,
              integrityScore: Number(payload?.ohlcIntegrityScore || 0),
              coveragePct: Number(payload?.densityCoveragePct || 0),
              bucketInterval: typeof payload?.bucketInterval === 'string' ? payload.bucketInterval : 'auto',
              count: Number(payload?.count || 0),
            }
          })
        )

        if (!active) return
        setTimeframeQuality(results)
      } catch {
        if (!active) return
        setTimeframeQuality([])
      } finally {
        if (active) setTimeframeQualityLoading(false)
      }
    }

    loadTimeframeQuality()

    return () => {
      active = false
    }
  }, [])

  function applyStrategyProfile(profile: StrategyProfile) {
    const preset = PROFILE_PRESETS[profile]
    setStrategyProfile(profile)
    setTraderStyle(preset.style)
    setTraderMarket(preset.market)
    setDrawdownTolerance(preset.drawdown)
    setChallengeBudget(preset.budget)
    setTargetCapital(preset.capital)
  }

  async function copyShareCard() {
    try {
      await navigator.clipboard.writeText(shareText)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1600)
    } catch {
      setShareCopied(false)
    }
  }

  async function downloadShareCard() {
    if (!pfmeCardRef.current || !bestMatch) return

    try {
      setImageExporting(true)
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(pfmeCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#050A14',
      })

      const link = document.createElement('a')
      link.download = `gtixt-prop-match-${bestMatch.name.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = dataUrl
      link.click()
    } finally {
      setImageExporting(false)
    }
  }

  function exportFirmSignalsCsv() {
    const rows = filteredFirms.map((firm) => ({
      name: firm.name,
      score: firm.score,
      risk: firm.risk,
      payoutReliability: firm.payoutReliability,
      ruleStability: firm.ruleStability,
      signal: firm.signal,
    }))

    const header = ['name', 'score', 'risk', 'payout_reliability', 'rule_stability', 'signal']
    const lines = rows.map((row) => [
      row.name,
      row.score,
      row.risk,
      row.payoutReliability,
      row.ruleStability,
      `"${String(row.signal).replace(/"/g, '""')}"`,
    ].join(','))

    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `gtixt-firm-signals-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const btn = (active: boolean, accentColor: string) => ({
    padding: '3px 9px',
    fontSize: 11,
    fontWeight: 500,
    borderRadius: 5,
    border: '1px solid',
    borderColor:  active ? accentColor                              : T.border,
    background:   active ? `${accentColor}1A`                      : 'transparent',
    color:        active ? accentColor                              : T.text3,
    transition:   'all 0.15s',
    cursor:       'pointer' as const,
    textTransform: 'none' as const,
  })

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text1, fontFamily: 'IBM Plex Sans, Inter, system-ui, sans-serif' }}>

      {/* ── 1. TOP CONTROL BAR ──────────────────────────────────── */}
      <div
        style={{ background: 'rgba(5,10,20,0.98)', borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 30, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: '8px 16px' }}
      >
        {/* Brand token */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.cyan, boxShadow: `0 0 8px ${T.cyan}`, flexShrink: 0 }} />
          <span style={{ color: T.cyan, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>GTIXT Intelligence Terminal</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 2, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: integrityBandColor, border: `1px solid ${integrityBandColor}`, borderRadius: 999, padding: '2px 8px', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
            {integrityBand} Quality
          </span>
          <span style={{ fontSize: 10, color: T.text3 }}>
            Integrity {overallIntegrityScore.toFixed(1)} | Coverage {overallDensityCoverage.toFixed(1)}%
          </span>
        </div>

        <span style={{ width: 1, height: 18, background: T.border }} />

        {/* Timeframes */}
        <div style={{ display: 'flex', gap: 3 }}>
          {(['1H','4H','1D','1W','1M','1Y','ALL'] as TerminalTF[]).map((t) => (
            <button key={t} onClick={() => setTf(t)} style={btn(tf === t, T.cyan)}>{t}</button>
          ))}
        </div>

        <span style={{ width: 1, height: 18, background: T.border }} />

        {/* Data Mode */}
        <div style={{ display: 'flex', gap: 3 }}>
          {(['score','risk','stability','concentration','payout'] as DataMode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ ...btn(mode === m, T.amber), textTransform: 'capitalize' }}>{m}</button>
          ))}
        </div>

        <span style={{ width: 1, height: 18, background: T.border }} />

        {/* Sector filter */}
        <div style={{ display: 'flex', gap: 3 }}>
          {([['all','All Firms'],['top20','Top 20'],['high-risk','High Risk'],['new','New Firms']] as [SectorFilter, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={btn(filter === k, T.purple)}>{l}</button>
          ))}
        </div>

        {/* Right: focus badge + compare */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {focusedFirm && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${T.cyan}14`, border: `1px solid ${T.cyan}4D`, borderRadius: 6, padding: '3px 10px' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.cyan }} />
              <span style={{ fontSize: 11, color: T.cyan }}>{focusedFirm.name}</span>
              <button onClick={clearFocus} style={{ fontSize: 12, color: T.text3, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 4px', lineHeight: 1 }}>✕</button>
            </div>
          )}
          <button onClick={() => {
            if (view === 'compare') {
              setCompareSelection([])
              setView('sector')
            } else {
              setFocusedFirm(null)
              setView('compare')
            }
          }}
            style={btn(view === 'compare', T.purple)}>
            Compare
          </button>
          <button onClick={exportFirmSignalsCsv} style={btn(false, T.green)}>
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Context strip (firm focus / compare) ─────────────────── */}
      {view === 'firm' && focusedFirm && (
        <div style={{ background: `${T.cyan}07`, borderBottom: `1px solid ${T.cyan}1F`, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, color: T.cyan, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Firm Focus</span>
          <span style={{ color: T.border, fontSize: 14 }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{focusedFirm.name}</span>
          <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: TONE[focusedFirm.tone]?.bg, border: `1px solid ${TONE[focusedFirm.tone]?.border}`, color: TONE[focusedFirm.tone]?.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {focusedFirm.risk}
          </span>
          <span style={{ fontSize: 11, color: T.text3, fontStyle: 'italic' }}>{focusedFirm.signal}</span>
        </div>
      )}
      {view === 'compare' && (
        <div style={{ background: `${T.purple}07`, borderBottom: `1px solid ${T.purple}1F`, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, color: T.purple, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Compare Mode</span>
          <span style={{ color: T.border, fontSize: 14 }}>·</span>
          <span style={{ fontSize: 11, color: T.text3 }}>
            Multi-firm intelligence - select firms from the signals panel ({selectedCompareFirms.length}/4 selected)
          </span>
        </div>
      )}

      <div style={{ padding: '10px 16px 0 16px' }}>
        <section style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.panel, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Decision Brief</div>
              <div style={{ fontSize: 15, color: T.text1, fontWeight: 700 }}>Market stress and allocation posture</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['retail', 'investor', 'data'] as const).map((audience) => (
                <button
                  key={audience}
                  type="button"
                  onClick={() => setExplainAudience(audience)}
                  style={btn(explainAudience === audience, T.cyan)}
                >
                  {audience}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }} className="md:grid-cols-4">
            <div style={{ border: `1px solid ${T.rose}55`, borderRadius: 8, background: `${T.rose}14`, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Market Stress</div>
              <div style={{ fontSize: 18, color: T.rose, fontWeight: 700 }}>{marketStressPct}%</div>
            </div>
            <div style={{ border: `1px solid ${T.amber}55`, borderRadius: 8, background: `${T.amber}12`, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rising</div>
              <div style={{ fontSize: 18, color: T.amber, fontWeight: 700 }}>{risingCount}</div>
            </div>
            <div style={{ border: `1px solid ${T.rose}55`, borderRadius: 8, background: `${T.rose}12`, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>At Risk</div>
              <div style={{ fontSize: 18, color: T.rose, fontWeight: 700 }}>{atRiskCount}</div>
            </div>
            <div style={{ border: `1px solid ${T.green}55`, borderRadius: 8, background: `${T.green}12`, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Stable Core</div>
              <div style={{ fontSize: 18, color: T.green, fontWeight: 700 }}>{stableCoreCount}</div>
            </div>
          </div>

          <div style={{ marginTop: 8, fontSize: 11, color: T.text2 }}>
            {explainAudience === 'retail' && 'Retail: focus on At Risk first. Use Stable Core firms as your baseline universe.'}
            {explainAudience === 'investor' && 'Investor: stress + rising clusters indicate repricing zones; rotate exposure toward stable core and monitor liquidity shifts.'}
            {explainAudience === 'data' && 'Data: stress = elevated/critical share; rising = rule-change or complaint velocity >= 45; stable core = score >= 75 with contained risk.'}
          </div>
        </section>
      </div>

      <div style={{ padding: '10px 16px 0 16px' }}>
        <section style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.panel, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Timeframe Certification</div>
              <div style={{ fontSize: 15, color: T.text1, fontWeight: 700 }}>Live Candle Quality Matrix</div>
            </div>
            <div style={{ fontSize: 11, color: T.text3 }}>Institutional status by timeframe, from live terminal telemetry.</div>
          </div>

          {timeframeQualityLoading && <div style={{ fontSize: 12, color: T.text3 }}>Loading timeframe quality...</div>}

          {!timeframeQualityLoading && timeframeQuality.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }} className="md:grid-cols-3 xl:grid-cols-6">
              {timeframeQuality.map((row) => {
                const band = row.integrityScore >= 80 ? 'Institutional' : row.integrityScore >= 60 ? 'Acceptable' : row.integrityScore >= 35 ? 'Developing' : 'Sparse'
                const tone = row.integrityScore >= 80 ? T.green : row.integrityScore >= 60 ? T.amber : row.integrityScore >= 35 ? T.cyan : T.rose

                return (
                  <button
                    key={row.label}
                    type="button"
                    onClick={() => setTf(row.label)}
                    style={{
                      textAlign: 'left',
                      border: `1px solid ${tf === row.label ? tone : T.border}`,
                      borderRadius: 8,
                      background: tf === row.label ? `${tone}12` : T.cell,
                      padding: '9px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase' }}>{row.label}</span>
                      <span style={{ fontSize: 10, color: tone, fontWeight: 700 }}>{band}</span>
                    </div>
                    <div style={{ fontSize: 18, color: T.text1, fontWeight: 700, lineHeight: 1 }}>{row.integrityScore.toFixed(1)}</div>
                    <div style={{ fontSize: 10, color: T.text3, marginTop: 5 }}>Coverage {row.coveragePct.toFixed(1)}%</div>
                    <div style={{ fontSize: 10, color: T.text3 }}>Candles {row.count}</div>
                    <div style={{ fontSize: 10, color: T.text3 }}>Bucket {row.bucketInterval}</div>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <div style={{ padding: '10px 16px 0 16px' }}>
        <section style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.panel, padding: 12 }}>
          <div style={{ display: 'grid', gap: 10 }} className="xl:grid-cols-3">
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', background: T.cell }}>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Published Benchmark</div>
              <div style={{ fontSize: 14, color: T.text1, fontWeight: 700, marginBottom: 4 }}>Five-pillar GTIXT score</div>
              <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.45 }}>Regulatory, operational, financial, governance, and market impact in one normalized score.</div>
            </div>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', background: T.cell }}>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Monitoring Overlays</div>
              <div style={{ fontSize: 14, color: T.text1, fontWeight: 700, marginBottom: 4 }}>Derived GTIXT regime models</div>
              <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.45 }}>FSR, PFRE, collapse watch, and concentration overlays convert raw scores into allocation signals.</div>
            </div>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', background: T.cell }}>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Current Source State</div>
              <div style={{ fontSize: 14, color: T.text1, fontWeight: 700, marginBottom: 4 }}>{liveRankingSignals.length > 0 ? 'Live rankings synchronized' : 'Reference baseline active'}</div>
              <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.45 }}>Freshness: {freshnessState.ageHours !== null ? `${freshnessState.badge} ${freshnessState.ageHours}h` : freshnessState.badge} · Density integrity {overallIntegrityScore.toFixed(1)}.</div>
            </div>
          </div>
        </section>
      </div>

      {/* ── 2. TERMINAL BODY ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>

        {/* ── LEFT PANEL: Sector Intelligence ──────────────────── */}
        <aside
          style={{ width: 228, minWidth: 228, background: T.panel, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'sticky', top: 49, maxHeight: 'calc(100vh - 49px)' }}
          className="hidden xl:flex"
        >
          {/* Sector Health */}
          <div style={{ borderBottom: `1px solid ${T.border}`, padding: '14px' }}>
            <p style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 12 }}>Sector State</p>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: T.text2 }}>Sector Health</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: T.cyan, fontVariantNumeric: 'tabular-nums' }}>{sectorState.health}</span>
              </div>
              <div style={{ height: 4, background: T.cell, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${sectorState.health}%`, height: '100%', background: T.cyan, borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { l: 'Risk Level',    v: sectorState.riskLabel, c: T.amber, span: false },
                { l: 'Monitored',     v: `${sectorState.firmCount}`, c: T.text1, span: false },
                { l: 'Active Alerts', v: `${sectorState.activeAlerts} signals`, c: T.rose, span: true },
              ].map((row) => (
                <div key={row.l} style={{ background: T.cell, borderRadius: 6, padding: '7px 10px', gridColumn: row.span ? 'span 2' : undefined }}>
                  <p style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>{row.l}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: row.c }}>{row.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Early Warning */}
          <div style={{ borderBottom: `1px solid ${T.border}`, padding: '14px' }}>
            <p style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 10 }}>Early Warning</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {liveWarningItems.map((w, i) => (
                <div key={i} style={{ background: w.level === 'warn' ? 'rgba(255,107,107,0.06)' : 'rgba(30,214,255,0.05)', border: `1px solid ${w.level === 'warn' ? 'rgba(255,107,107,0.22)' : 'rgba(30,214,255,0.12)'}`, borderRadius: 6, padding: '7px 10px' }}>
                  <p style={{ fontSize: 11, color: w.level === 'warn' ? T.rose : T.cyan, lineHeight: 1.4 }}>
                    {w.level === 'warn' ? '⚠ ' : '◉ '}{w.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Stability Bands */}
          <div style={{ borderBottom: `1px solid ${T.border}`, padding: '14px' }}>
            <p style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 10 }}>Stability Distribution</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stabilityBands.map((b) => (
                <div key={b.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: T.text2 }}>{b.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: b.color, fontVariantNumeric: 'tabular-nums' }}>{b.pct}%</span>
                  </div>
                  <div style={{ height: 3, background: T.cell, borderRadius: 2 }}>
                    <div style={{ width: `${b.pct}%`, height: '100%', background: b.color, borderRadius: 2, opacity: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Ladder */}
          <div style={{ padding: '14px' }}>
            <p style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 10 }}>GTIXT Score Bands</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {scoreBands.map((r) => (
                <div key={r.tier} style={{ background: T.cell, borderRadius: 6, padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: T.text2 }}>{r.tier}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: T.text3 }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.color, fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CENTER + RIGHT ─────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* ── MAIN CHART ROW ──────────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', minWidth: 0, borderBottom: `1px solid ${T.border}` }}>

            {/* Main Chart */}
            <div style={{ flex: 1, minWidth: 0, padding: '12px 14px', background: T.bg }}>
              <TradingTerminalChart
                preset={mainPreset}
                externalTimeframe={chartTf}
                title={mainTitle}
                kicker={view === 'firm' && focusedFirm ? focusedFirm.name : 'Sector Intelligence Terminal'}
                regimeContext={chartRegimeContext}
                compareSeries={view === 'compare' ? selectedCompareFirms.map((firm) => ({
                  name: firm.name,
                  score: firm.score,
                  tone: firm.tone,
                })) : undefined}
                subtitle={
                  view === 'firm' && focusedFirm
                    ? `Focused analysis · ${focusedFirm.signal}`
                    : view === 'compare' && selectedCompareFirms.length > 0
                    ? `Compare set: ${selectedCompareFirms.map((f) => f.name).join(' | ')}`
                    : 'Live score, risk, and stability overlays'
                }
                initialMode="Intelligence"
                chartHeight={500}
              />
            </div>

            {/* ── 5. FIRM SIGNALS PANEL (right) ─────────────────── */}
            <aside
              style={{ width: 252, minWidth: 252, background: T.panel, borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column' }}
              className="hidden lg:flex"
            >
              {/* Header */}
              <div style={{ borderBottom: `1px solid ${T.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.rose, boxShadow: `0 0 6px ${T.rose}` }} />
                <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.16em' }}>Firm Signals</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: T.text3 }}>
                  {filteredFirms.length} / {trackedFirmCount}
                </span>
              </div>
              <div style={{ padding: '6px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.text3 }}>
                Source: {liveRankingSignals.length > 0 ? 'Live GTIXT rankings + calibrated baseline' : 'GTIXT baseline reference set'}
              </div>
              <div style={{ padding: '6px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 10, color: T.text3 }}>Freshness</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: freshnessState.color,
                    border: `1px solid ${freshnessState.color}`,
                    borderRadius: 999,
                    padding: '2px 8px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {freshnessState.badge}
                  {freshnessState.ageHours !== null ? ` ${freshnessState.ageHours}h` : ''}
                </span>
              </div>

              {/* Signal cards */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredFirms.map((firm) => {
                  const tc = TONE[firm.tone]
                  const isActive = focusedFirm?.name === firm.name || compareSelection.includes(firm.name)
                  return (
                    <button
                      key={firm.name}
                      onClick={() => {
                        if (view === 'compare') {
                          toggleCompareFirm(firm)
                          return
                        }
                        if (focusedFirm?.name === firm.name) {
                          clearFocus()
                          return
                        }
                        focusFirm(firm)
                      }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '11px 14px',
                        borderBottom: `1px solid ${T.cell}`,
                        borderLeft: `2px solid ${isActive ? T.cyan : 'transparent'}`,
                        background: isActive ? `${T.cyan}0D` : 'transparent',
                        transition: 'all 0.14s', cursor: 'pointer', display: 'block',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.text1 }}>{firm.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, flexShrink: 0, background: tc?.bg, border: `1px solid ${tc?.border}`, color: tc?.text, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {firm.risk}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: T.text3, marginBottom: 7, lineHeight: 1.35 }}>{firm.signal}</p>
                      <p style={{ fontSize: 10, color: T.text3, marginBottom: 7 }}>
                        Evidence: {liveRankingSignals.length > 0 ? `GTIXT live rankings (${firmSignalsSourceLabel})` : 'GTIXT baseline reference set'} · As of {firmSignalsAsOf}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 2, background: T.cell, borderRadius: 1 }}>
                          <div style={{ height: '100%', borderRadius: 1, width: `${firm.score}%`, background: firm.score >= 75 ? T.cyan : firm.score >= 55 ? T.amber : T.rose }} />
                        </div>
                        <span style={{ fontSize: 10, color: T.text2, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{firm.score}</span>
                      </div>
                    </button>
                  )
                })}
                {filteredFirms.length === 0 && (
                  <div style={{ padding: '14px', color: T.text3, fontSize: 12 }}>
                    No firms for current filter.
                  </div>
                )}
              </div>

              {/* Evidence Matrix */}
              <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>GTIXT Evidence Layers</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {evidenceMatrix.map((m) => (
                    <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: T.text3 }}>{m.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: m.color, fontVariantNumeric: 'tabular-nums' }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          {/* ── 4. BOTTOM METRICS ROW ───────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', background: T.bg, borderTop: `1px solid ${T.border}` }} className="xl:grid-cols-4">
            {BOTTOM_PANELS.map((panel, idx) => (
              <div
                key={panel.preset}
                style={{ borderRight: idx < BOTTOM_PANELS.length - 1 ? `1px solid ${T.border}` : undefined, padding: '10px 10px 8px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.text2, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{panel.label}</span>
                  <span style={{ fontSize: 9, color: T.text3 }}>{panel.desc}</span>
                </div>
                <TradingTerminalChart
                  preset={panel.preset}
                  externalTimeframe={chartTf}
                  compact
                  chartHeight={190}
                  kicker=""
                  title=""
                  subtitle=""
                  initialMode="Risk"
                />
              </div>
            ))}
          </div>

          {/* FSR + SLP + RCI intelligence modules */}
          <div style={{ borderTop: `1px solid ${T.border}`, background: T.bg, padding: '12px' }}>
            <div style={{ display: 'grid', gap: 10 }} className="xl:grid-cols-3">
              <section style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.panel, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em' }}>FSR Module</span>
                  <span style={{ fontSize: 11, color: T.text2 }}>Firm Stability Regime</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {(Object.keys(fsrCounts) as FsrRegime[]).map((regime) => (
                    <span key={regime} style={{ fontSize: 10, padding: '3px 6px', borderRadius: 4, color: FSR_TONE[regime].color, background: FSR_TONE[regime].bg }}>
                      {regime}: {fsrCounts[regime]}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {fsrByFirm.slice(0, 5).map((firm) => (
                    <div key={firm.name} style={{ background: T.cell, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 9px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: T.text1 }}>{firm.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: FSR_TONE[firm.regime].color }}>{firm.regime}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                        <div style={{ flex: 1, height: 3, background: T.border, borderRadius: 2 }}>
                          <div style={{ width: `${firm.fsrScore}%`, height: '100%', borderRadius: 2, background: FSR_TONE[firm.regime].color }} />
                        </div>
                        <span style={{ fontSize: 10, color: T.text2, fontVariantNumeric: 'tabular-nums' }}>{firm.fsrScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.panel, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em' }}>SLP Module</span>
                  <span style={{ fontSize: 11, color: T.text2 }}>Sector Liquidity Pressure Map</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  {liquidityMap.map((firm) => (
                    <div key={firm.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: T.text2 }}>{firm.name}</span>
                        <span style={{ fontSize: 10, color: T.text3, fontVariantNumeric: 'tabular-nums' }}>{firm.liquidityShare}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 3, background: T.cell }}>
                        <div style={{ height: '100%', width: `${firm.liquidityShare}%`, borderRadius: 3, background: firm.liquidityShare >= 20 ? T.cyan : T.amber }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div style={{ background: T.cell, borderRadius: 7, padding: '7px 8px' }}>
                    <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Top3 Concentration</div>
                    <div style={{ fontSize: 13, color: top3Liquidity >= 80 ? T.rose : T.cyan, fontWeight: 700 }}>{top3Liquidity}%</div>
                  </div>
                  <div style={{ background: T.cell, borderRadius: 7, padding: '7px 8px' }}>
                    <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Avg Migration</div>
                    <div style={{ fontSize: 13, color: avgMigration >= 0 ? T.cyan : T.rose, fontWeight: 700 }}>{avgMigration}%</div>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: T.text3 }}>
                  Inflow: {rapidInflow.length} firms | Outflow: {rapidOutflow.length} firms
                </div>
              </section>

              <section style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.panel, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em' }}>RCI Module</span>
                  <span style={{ fontSize: 11, color: T.text2 }}>Rule Change Intelligence</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 225, overflowY: 'auto' }}>
                  {rciFeed.map((event) => (
                    <div key={`${event.date}-${event.firm}`} style={{ border: `1px solid ${T.border}`, background: T.cell, borderRadius: 8, padding: '7px 9px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontSize: 10, color: T.text3 }}>{event.date}</span>
                        <span style={{ fontSize: 10, color: event.impact >= 10 ? T.rose : T.amber }}>Impact +{event.impact}%</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.text1, fontWeight: 600 }}>{event.firm}</div>
                      <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.35 }}>{event.change}</div>
                    </div>
                  ))}
                  {rciFeed.length === 0 && <div style={{ fontSize: 12, color: T.text3 }}>No rule change events for current filter.</div>}
                </div>
              </section>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 10 }} className="xl:grid-cols-2">
              <section style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.panel, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em' }}>PFRE</div>
                    <div style={{ fontSize: 15, color: T.text1, fontWeight: 700 }}>Prop Firm Regime Engine</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, color: PFRE_TONE[pfreRegimeState].color, background: PFRE_TONE[pfreRegimeState].bg, fontWeight: 700 }}>
                    {pfreRegimeState} · {pfreRegimeScore.toFixed(1)}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: T.text2, marginBottom: 10 }}>{pfreHeadline}</div>

                <div style={{ display: 'grid', gap: 8 }} className="md:grid-cols-2">
                  <div style={{ border: `1px solid ${T.border}`, background: T.cell, borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Operational Stability</div>
                    <div style={{ fontSize: 16, color: T.text1, fontWeight: 700 }}>{pfreOperationalStability}</div>
                  </div>
                  <div style={{ border: `1px solid ${T.border}`, background: T.cell, borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Payout Reliability</div>
                    <div style={{ fontSize: 16, color: T.text1, fontWeight: 700 }}>{pfrePayoutReliability}</div>
                  </div>
                  <div style={{ border: `1px solid ${T.border}`, background: T.cell, borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Evidence Coverage</div>
                    <div style={{ fontSize: 16, color: T.text1, fontWeight: 700 }}>{pfreEvidenceCoverage}</div>
                  </div>
                  <div style={{ border: `1px solid ${T.border}`, background: T.cell, borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Risk Signals</div>
                    <div style={{ fontSize: 16, color: pfreRiskSignals >= 45 ? T.rose : pfreRiskSignals >= 30 ? T.amber : T.cyan, fontWeight: 700 }}>{pfreRiskSignals}</div>
                  </div>
                </div>

                <div style={{ marginTop: 10, border: `1px solid ${T.border}`, background: T.cell, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', marginBottom: 4 }}>Regime Formula</div>
                  <div style={{ fontSize: 11, color: T.text2, lineHeight: 1.45 }}>
                    Regime Score = operational stability + payout reliability + sentiment - risk signals. Current trader profile fit: <span style={{ color: T.text1, fontWeight: 700 }}>{profileRegimeFit.toFixed(1)}</span>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {rciFeed.slice(0, 4).map((event) => (
                    <span key={`${event.date}-${event.firm}`} style={{ fontSize: 10, padding: '4px 7px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.cell, color: T.text2 }}>
                      {event.date} · {event.firm} · +{event.impact}%
                    </span>
                  ))}
                </div>
              </section>

              <section style={{ border: `1px solid ${T.border}`, borderRadius: 10, background: T.panel, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Collapse Predictor</div>
                    <div style={{ fontSize: 15, color: T.text1, fontWeight: 700 }}>Firm Failure Probability Radar</div>
                  </div>
                  <span style={{ fontSize: 11, color: T.text3 }}>Pattern: rule tightening + payout delays + support silence + complaint spike</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {collapsePredictor.slice(0, 5).map((firm) => {
                    const tone = firm.collapseProbability >= 65 ? T.rose : firm.collapseProbability >= 45 ? T.amber : firm.collapseProbability >= 30 ? T.cyan : T.green
                    return (
                      <div key={firm.name} style={{ border: `1px solid ${T.border}`, background: T.cell, borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: T.text1, fontWeight: 600 }}>{firm.name}</span>
                          <span style={{ fontSize: 10, color: tone, fontWeight: 700 }}>{firm.warningBand}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 4, background: T.border }}>
                            <div style={{ width: `${firm.collapseProbability}%`, height: '100%', borderRadius: 4, background: tone }} />
                          </div>
                          <span style={{ fontSize: 12, color: tone, fontWeight: 700 }}>{firm.collapseProbability}%</span>
                        </div>
                        <div style={{ fontSize: 10, color: T.text3, lineHeight: 1.45 }}>
                          Delay {firm.payoutDelay} · Rule change {firm.ruleChangeRate} · Complaints {firm.complaintVelocity} · Traffic drop {firm.trafficDrop}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            <div style={{ display: 'grid', gap: 8, marginTop: 10 }} className="md:grid-cols-3">
              <div style={{ border: `1px solid ${T.border}`, background: T.panel, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', marginBottom: 3 }}>Top Stability Firms</div>
                <div style={{ fontSize: 11, color: T.text2 }}>{topStabilityFirms.map((firm) => `${firm.name} (${firm.fsrScore})`).join(' | ') || 'None'}</div>
              </div>
              <div style={{ border: `1px solid ${T.border}`, background: T.panel, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', marginBottom: 3 }}>Risk Alerts</div>
                <div style={{ fontSize: 11, color: fsrAlerts.length > 0 ? T.rose : T.cyan }}>{fsrAlerts.length > 0 ? fsrAlerts.map((firm) => firm.name).join(' | ') : 'No instability alerts'}</div>
              </div>
              <div style={{ border: `1px solid ${T.border}`, background: T.panel, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', marginBottom: 3 }}>Rule Change Events</div>
                <div style={{ fontSize: 11, color: T.text2 }}>{rciFeed.length} tracked events in current scope</div>
              </div>
            </div>

            <section style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 10, background: T.panel, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Data Density Monitor</div>
                  <div style={{ fontSize: 15, color: T.text1, fontWeight: 700 }}>Historical Depth Progress</div>
                  <div style={{ fontSize: 11, color: T.text3 }}>Target: 200+ candles per view with multi-point OHLC structure and stable bucket quality.</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: T.cell, padding: '6px 10px' }}>
                    <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Avg Coverage</div>
                    <div style={{ fontSize: 14, color: overallDensityCoverage >= 80 ? T.green : overallDensityCoverage >= 40 ? T.amber : T.rose, fontWeight: 700 }}>
                      {overallDensityCoverage}%
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: T.cell, padding: '6px 10px' }}>
                    <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Avg Integrity</div>
                    <div style={{ fontSize: 12, color: overallIntegrityScore >= 80 ? T.green : overallIntegrityScore >= 55 ? T.amber : T.rose, fontWeight: 600 }}>{overallIntegrityScore}</div>
                  </div>
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: T.cell, padding: '6px 10px' }}>
                    <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Best Window</div>
                    <div style={{ fontSize: 12, color: T.text2, fontWeight: 600 }}>
                      {mostReadyWindow ? `${mostReadyWindow.timeframe} (${mostReadyWindow.coveragePct}%)` : 'N/A'}
                    </div>
                  </div>
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: T.cell, padding: '6px 10px' }}>
                    <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Best Integrity</div>
                    <div style={{ fontSize: 12, color: T.text2, fontWeight: 600 }}>
                      {bestIntegrityWindow ? `${bestIntegrityWindow.timeframe} (${bestIntegrityWindow.integrityScore})` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {densityError && <div style={{ fontSize: 12, color: T.rose, marginBottom: 8 }}>Density error: {densityError}</div>}
              {densityLoading && <div style={{ fontSize: 12, color: T.text3, marginBottom: 8 }}>Loading density windows...</div>}

              {!densityLoading && densityWindows.length > 0 && (
                <div style={{ display: 'grid', gap: 8 }} className="md:grid-cols-2 xl:grid-cols-4">
                  {densityWindows.map((row) => (
                    <div key={row.timeframe} style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: T.cell, padding: '8px 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase' }}>{row.timeframe}</span>
                        <span style={{ fontSize: 10, color: T.text3 }}>{row.interval}</span>
                      </div>
                      <div style={{ height: 4, background: T.border, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ height: '100%', width: `${Math.min(100, row.coveragePct)}%`, background: row.coveragePct >= 80 ? T.green : row.coveragePct >= 40 ? T.amber : T.rose }} />
                      </div>
                      <div style={{ fontSize: 12, color: T.text1, fontWeight: 700 }}>{row.bucketCount}/{row.target}</div>
                      <div style={{ fontSize: 10, color: T.text3 }}>Coverage {row.coveragePct}%</div>
                      <div style={{ fontSize: 10, color: T.text3 }}>Integrity {row.integrityScore}</div>
                      <div style={{ fontSize: 10, color: T.text3 }}>Multi-point {row.multiPointBucketPct}%</div>
                      <div style={{ fontSize: 10, color: T.text3 }}>Avg pts/bucket {row.avgPointsPerBucket}</div>
                      <div style={{ fontSize: 10, color: T.text3 }}>{row.surplusBuckets > 0 ? `Surplus ${row.surplusBuckets}` : 'On target range'}</div>
                      <div style={{ fontSize: 10, color: T.text3 }}>Rate {row.bucketRatePerDay}/day</div>
                      <div style={{ fontSize: 10, color: T.text3 }}>
                        ETA observed {row.etaDaysToTarget === null ? 'Unknown' : `${row.etaDaysToTarget} days`}
                      </div>
                      <div style={{ fontSize: 10, color: T.text3 }}>
                        ETA expected {row.etaDaysAtExpectedRate === null ? 'Unknown' : `${row.etaDaysAtExpectedRate} days`} ({row.expectedBucketRatePerDay.toFixed(2)}/day)
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 8, fontSize: 10, color: T.text3 }}>
                Snapshot scheduler cadence: every 30 minutes (systemd timer). Last density refresh: {densityGeneratedAt ? new Date(densityGeneratedAt).toLocaleString() : 'N/A'}
              </div>
            </section>

            <section style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 10, background: T.panel, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em' }}>PFME Module</div>
                  <div style={{ fontSize: 16, color: T.text1, fontWeight: 700 }}>Prop Firm Match Engine</div>
                  <div style={{ fontSize: 11, color: T.text3 }}>Personalized ranking for prop firm selection based on your trading profile.</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button onClick={copyShareCard} style={{ border: `1px solid ${T.border}`, background: shareCopied ? `${T.green}20` : T.cell, color: shareCopied ? T.green : T.text2, borderRadius: 7, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}>
                    {shareCopied ? 'Copied' : 'Copy My GTIXT Prop Match'}
                  </button>
                  <button onClick={downloadShareCard} disabled={!bestMatch || imageExporting} style={{ border: `1px solid ${T.border}`, background: imageExporting ? `${T.amber}20` : T.cell, color: imageExporting ? T.amber : T.text2, borderRadius: 7, padding: '6px 10px', fontSize: 11, cursor: bestMatch ? 'pointer' : 'not-allowed', opacity: bestMatch ? 1 : 0.5 }}>
                    {imageExporting ? 'Rendering PNG...' : 'Download Match Card'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10 }} className="xl:grid-cols-3">
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: T.cell, padding: 10 }}>
                  <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', marginBottom: 8 }}>Trader Strategy Profile</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {STRATEGY_PROFILE_VALUES.map((profile) => (
                      <button key={profile} onClick={() => applyStrategyProfile(profile)} style={{ border: `1px solid ${strategyProfile === profile ? T.cyan : T.border}`, background: strategyProfile === profile ? `${T.cyan}1A` : 'transparent', color: strategyProfile === profile ? T.cyan : T.text2, borderRadius: 6, padding: '4px 8px', textTransform: 'capitalize', fontSize: 11, cursor: 'pointer' }}>
                        {profile}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <label style={{ fontSize: 11, color: T.text2 }}>
                      Target Capital
                      <select value={targetCapital} onChange={(e) => setTargetCapital(Number(e.target.value))} style={{ width: '100%', marginTop: 4, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text1, padding: '6px 8px' }}>
                        <option value={50000}>50k</option>
                        <option value={100000}>100k</option>
                        <option value={150000}>150k</option>
                        <option value={200000}>200k</option>
                      </select>
                    </label>
                    <label style={{ fontSize: 11, color: T.text2 }}>
                      Trading Style
                      <select value={traderStyle} onChange={(e) => setTraderStyle(e.target.value as TraderStyle)} style={{ width: '100%', marginTop: 4, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text1, padding: '6px 8px' }}>
                        <option value="scalper">Scalper</option>
                        <option value="swing">Swing Trader</option>
                        <option value="algo">Algo Trader</option>
                        <option value="news">News Trader</option>
                      </select>
                    </label>
                    <label style={{ fontSize: 11, color: T.text2 }}>
                      Market
                      <select value={traderMarket} onChange={(e) => setTraderMarket(e.target.value as TraderMarket)} style={{ width: '100%', marginTop: 4, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text1, padding: '6px 8px' }}>
                        <option value="futures">Futures</option>
                        <option value="forex">Forex</option>
                        <option value="cfd">CFD</option>
                        <option value="crypto">Crypto</option>
                      </select>
                    </label>
                    <label style={{ fontSize: 11, color: T.text2 }}>
                      Drawdown Tolerance
                      <select value={drawdownTolerance} onChange={(e) => setDrawdownTolerance(e.target.value as DrawdownTolerance)} style={{ width: '100%', marginTop: 4, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text1, padding: '6px 8px' }}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                    <label style={{ fontSize: 11, color: T.text2 }}>
                      Challenge Budget (USD)
                      <input type="number" min={50} max={500} value={challengeBudget} onChange={(e) => setChallengeBudget(Number(e.target.value || 0))} style={{ width: '100%', marginTop: 4, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text1, padding: '6px 8px' }} />
                    </label>
                  </div>
                </div>

                <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: T.cell, padding: 10 }} className="xl:col-span-2">
                  {bestMatch && (
                    <div
                      ref={pfmeCardRef}
                      style={{
                        border: `1px solid ${T.cyan}33`,
                        borderRadius: 12,
                        background: 'radial-gradient(circle at top right, rgba(30,214,255,0.16), transparent 30%), linear-gradient(180deg, #071224 0%, #050A14 100%)',
                        padding: 16,
                        marginBottom: 10,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, color: T.cyan, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 6 }}>My GTIXT Prop Match</div>
                          <div style={{ fontSize: 26, fontWeight: 800, color: T.text1, lineHeight: 1.1 }}>{bestMatch.name}</div>
                          <div style={{ fontSize: 12, color: T.text3, marginTop: 4 }}>{traderStyle} · {traderMarket} · {drawdownTolerance} drawdown</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 30, fontWeight: 900, color: T.cyan }}>{bestMatch.compatibility}%</div>
                          <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase' }}>Compatibility</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
                        <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: 'rgba(13,21,38,0.78)', padding: '8px 10px' }}>
                          <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Pass Probability</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>{bestMatch.passProbability}%</div>
                        </div>
                        <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: 'rgba(13,21,38,0.78)', padding: '8px 10px' }}>
                          <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Avg Payout Delay</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>{bestMatch.avgPayoutDelayDays}d</div>
                        </div>
                        <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: 'rgba(13,21,38,0.78)', padding: '8px 10px' }}>
                          <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Operational Risk</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: bestMatch.operationalRisk === 'Low' ? T.green : bestMatch.operationalRisk === 'Moderate' ? T.amber : T.rose }}>{bestMatch.operationalRisk}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                        <div style={{ fontSize: 11, color: T.text2 }}>Budget ${challengeBudget} · Capital {targetCapital.toLocaleString()} · Challenge ${bestMatch.challengePrice}</div>
                        <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.14em' }}>GTIXT Analytics Terminal</div>
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', marginBottom: 8 }}>Best Match for You</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {pfmeResults.slice(0, 3).map((firm, idx) => (
                      <div key={firm.name} style={{ border: `1px solid ${idx === 0 ? T.cyan : T.border}`, borderRadius: 8, background: idx === 0 ? `${T.cyan}10` : T.bg, padding: '9px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{idx + 1}. {firm.name}</div>
                            <div style={{ fontSize: 11, color: T.text3 }}>{firm.signal}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: idx === 0 ? T.cyan : T.text1 }}>{firm.compatibility}%</div>
                            <div style={{ fontSize: 10, color: T.text3 }}>Compatibility</div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 8 }}>
                          <div style={{ background: T.cell, borderRadius: 6, padding: '5px 6px' }}>
                            <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Pass Prob.</div>
                            <div style={{ fontSize: 11, color: T.text2 }}>{firm.passProbability}%</div>
                          </div>
                          <div style={{ background: T.cell, borderRadius: 6, padding: '5px 6px' }}>
                            <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Payout Delay</div>
                            <div style={{ fontSize: 11, color: T.text2 }}>{firm.avgPayoutDelayDays}d</div>
                          </div>
                          <div style={{ background: T.cell, borderRadius: 6, padding: '5px 6px' }}>
                            <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Risk</div>
                            <div style={{ fontSize: 11, color: firm.operationalRisk === 'Low' ? T.green : firm.operationalRisk === 'Moderate' ? T.amber : T.rose }}>{firm.operationalRisk}</div>
                          </div>
                          <div style={{ background: T.cell, borderRadius: 6, padding: '5px 6px' }}>
                            <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase' }}>Challenge</div>
                            <div style={{ fontSize: 11, color: T.text2 }}>${firm.challengePrice}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8, fontSize: 11, color: T.text3 }}>
                    {shareText}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <a href={twitterShareUrl} target="_blank" rel="noreferrer" style={{ border: `1px solid ${T.border}`, background: T.cell, color: T.text2, borderRadius: 6, padding: '5px 8px', fontSize: 11, textDecoration: 'none' }}>
                      Share on X
                    </a>
                    <a href={redditShareUrl} target="_blank" rel="noreferrer" style={{ border: `1px solid ${T.border}`, background: T.cell, color: T.text2, borderRadius: 6, padding: '5px 8px', fontSize: 11, textDecoration: 'none' }}>
                      Share on Reddit
                    </a>
                    <span style={{ fontSize: 10, color: T.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                      Shareable URL: {shareUrl}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  )
}

