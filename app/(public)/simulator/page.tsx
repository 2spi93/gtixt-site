'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RealIcon } from '@/components/design-system/RealIcon'

type TraderStyle = 'scalping' | 'intraday' | 'swing' | 'algo' | 'news'

type SimulationRow = {
  firm_id: string
  firm_name: string
  jurisdiction: string
  pass_probability: number
  expected_payout_days: number | null
  expected_payout_usd: number
  failure_risk: 'Low' | 'Medium' | 'High'
  model_confidence: 'High' | 'Medium'
  rules: {
    daily_drawdown_pct: number
    overall_drawdown_pct: number
    profit_target_pct: number
    time_limit_days: number
    min_trading_days: number
    source: 'firm_profile' | 'benchmark_mixed'
  }
}

type SimulatorPayload = {
  success: boolean
  data_source: string
  headline: string
  ranking_count?: number
  universe_count?: number
  simulation: {
    paths: number
    audience_mode?: 'mainstream_only' | 'all_live_firms'
    assumptions: {
      capital_target: number
      risk_per_trade_pct: number
      win_rate_pct: number
      average_rrr: number
      style: TraderStyle
    }
  }
  best_firm: SimulationRow | null
  ranking: SimulationRow[]
}

function detectDelimiter(sampleLine: string): string {
  const candidates = [',', ';', '\t', '|']
  let best = ','
  let bestCount = -1
  for (const delimiter of candidates) {
    const count = sampleLine.split(delimiter).length
    if (count > bestCount) {
      best = delimiter
      bestCount = count
    }
  }
  return best
}

function parseCsvRows(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (!lines.length) return []
  const delimiter = detectDelimiter(lines[0])
  return lines.map((line) => line.split(delimiter).map((cell) => cell.trim()))
}

function parseLooseNumber(raw: string): number {
  const value = String(raw || '').trim()
  if (!value) return Number.NaN

  let cleaned = value.replace(/[^0-9,.-]/g, '')
  const hasComma = cleaned.includes(',')
  const hasDot = cleaned.includes('.')

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (hasComma && !hasDot) {
    cleaned = cleaned.replace(',', '.')
  }

  return Number.parseFloat(cleaned)
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase())
  for (const alias of aliases) {
    const idx = normalized.findIndex((h) => h.includes(alias))
    if (idx >= 0) return idx
  }
  return -1
}

export default function SimulatorPage() {
  const [capitalTarget, setCapitalTarget] = useState(100000)
  const [riskPerTradePct, setRiskPerTradePct] = useState(0.5)
  const [winRatePct, setWinRatePct] = useState(45)
  const [averageRRR, setAverageRRR] = useState(1.8)
  const [style, setStyle] = useState<TraderStyle>('scalping')
  const [paths, setPaths] = useState(1000)
  const [mainstreamOnly, setMainstreamOnly] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<SimulatorPayload | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [copiedShare, setCopiedShare] = useState(false)

  async function runSimulation() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/simulator/trader-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capitalTarget,
          riskPerTradePct,
          winRatePct,
          averageRRR,
          style,
          paths,
          mainstreamOnly,
        }),
      })

      const json = (await response.json()) as SimulatorPayload & { error?: string }
      if (!response.ok || !json?.success) {
        throw new Error(json?.error || `Simulation error (${response.status})`)
      }

      setPayload(json)
    } catch (err) {
      setPayload(null)
      setError(err instanceof Error ? err.message : 'Simulation unavailable')
    } finally {
      setLoading(false)
    }
  }

  async function onUploadHistory(file: File | null) {
    if (!file) return
    try {
      setUploadStatus('Analyse du fichier en cours...')
      const text = await file.text()
      const rows = parseCsvRows(text)
      if (rows.length < 2) {
        setUploadStatus('Fichier trop court pour extraire des stats.')
        return
      }

      const headers = rows[0]
      const body = rows.slice(1)

      const resultIdx = findColumnIndex(headers, ['result', 'outcome', 'pnl', 'profit'])
      const rrIdx = findColumnIndex(headers, ['rrr', 'r_multiple', 'r multiple', 'rr'])
      const riskIdx = findColumnIndex(headers, ['risk_pct', 'risk %', 'risk'])
      const balanceIdx = findColumnIndex(headers, ['balance', 'equity'])

      let wins = 0
      let losses = 0
      let rrSum = 0
      let rrCount = 0
      let riskPctSum = 0
      let riskPctCount = 0
      let pnlWins = 0
      let pnlLossAbs = 0

      for (const row of body) {
        const resultRaw = resultIdx >= 0 ? String(row[resultIdx] || '') : ''
        const resultLower = resultRaw.toLowerCase()
        const pnlValue = parseLooseNumber(resultRaw)

        const isWin = resultLower.includes('win') || (!Number.isNaN(pnlValue) && pnlValue > 0)
        const isLoss = resultLower.includes('loss') || (!Number.isNaN(pnlValue) && pnlValue < 0)

        if (isWin) {
          wins += 1
          if (!Number.isNaN(pnlValue)) pnlWins += pnlValue
        } else if (isLoss) {
          losses += 1
          if (!Number.isNaN(pnlValue)) pnlLossAbs += Math.abs(pnlValue)
        }

        if (rrIdx >= 0) {
          const rr = parseLooseNumber(String(row[rrIdx] || ''))
          if (Number.isFinite(rr) && rr > 0) {
            rrSum += rr
            rrCount += 1
          }
        }

        if (riskIdx >= 0) {
          const risk = parseLooseNumber(String(row[riskIdx] || ''))
          if (Number.isFinite(risk) && risk > 0) {
            riskPctSum += risk
            riskPctCount += 1
          }
        } else if (balanceIdx >= 0 && !Number.isNaN(pnlValue) && pnlValue < 0) {
          const balance = parseLooseNumber(String(row[balanceIdx] || ''))
          if (Number.isFinite(balance) && balance > 0) {
            const inferredRisk = (Math.abs(pnlValue) / balance) * 100
            if (inferredRisk > 0 && inferredRisk < 10) {
              riskPctSum += inferredRisk
              riskPctCount += 1
            }
          }
        }
      }

      const total = wins + losses
      if (total < 10) {
        setUploadStatus('Pas assez de trades exploitables (minimum 10).')
        return
      }

      const inferredWinRate = (wins / total) * 100
      const inferredRrr = rrCount > 0
        ? rrSum / rrCount
        : losses > 0 && pnlLossAbs > 0
          ? (pnlWins / Math.max(1, wins)) / (pnlLossAbs / losses)
          : averageRRR
      const inferredRiskPct = riskPctCount > 0 ? riskPctSum / riskPctCount : riskPerTradePct

      setWinRatePct(Number(inferredWinRate.toFixed(1)))
      setAverageRRR(Number(inferredRrr.toFixed(2)))
      setRiskPerTradePct(Number(inferredRiskPct.toFixed(2)))
      setUploadStatus(`Historique importé: ${total} trades analysés, profil mis à jour.`)
    } catch {
      setUploadStatus('Import impossible: format non supporté, utilisez un CSV standard.')
    }
  }

  const topThree = useMemo(() => (payload?.ranking || []).slice(0, 3), [payload])
  const shareText = useMemo(() => {
    if (!payload || !topThree.length) return ''
    const top = topThree
      .map((firm, idx) => `${idx + 1}. ${firm.firm_name} (${firm.pass_probability}%)`)
      .join(' | ')
    return `GTIXT Strategy Simulator\nProfile: ${style}, WR ${winRatePct}%, RRR ${averageRRR}, Risk ${riskPerTradePct}%\nBest firms: ${top}\nhttps://gtixt.com/simulator`
  }, [payload, topThree, style, winRatePct, averageRRR, riskPerTradePct])

  const shareUrl = useMemo(() => 'https://gtixt.com/simulator', [])
  const twitterShareUrl = useMemo(() => `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, [shareText])
  const redditShareUrl = useMemo(() => `https://www.reddit.com/submit?title=${encodeURIComponent('GTIXT Strategy Simulator Results')}&url=${encodeURIComponent(shareUrl)}`, [shareUrl])

  async function copyShareText() {
    if (!shareText) return
    try {
      await navigator.clipboard.writeText(shareText)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 1500)
    } catch {
      setCopiedShare(false)
    }
  }

  return (
    <div className="min-h-screen gtixt-bg-premium">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-400/10 px-3 py-1.5 mb-4">
            <RealIcon name="analytics" size={16} />
            <span className="text-cyan-100 text-xs font-semibold uppercase tracking-[0.14em]">Trader Performance Simulator</span>
          </div>
          <h1 className="text-4xl md:text-5xl text-white font-bold mb-3">Teste ton passage avant de payer un challenge</h1>
          <p className="text-slate-300 max-w-3xl">
            Monte Carlo sur 1000 paths, règles de firm, et probabilités de réussite pour trouver la meilleure firm selon ton profil.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <section className="xl:col-span-2 rounded-2xl border border-white/10 bg-slate-950/45 p-5">
            <h2 className="text-white font-semibold text-lg mb-4">Profil Trader</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-slate-300">
                Capital Target (USD)
                <input type="number" min={10000} max={500000} value={capitalTarget} onChange={(e) => setCapitalTarget(Number(e.target.value || 0))} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white" />
              </label>

              <label className="text-sm text-slate-300">
                Risk per Trade (%)
                <input type="number" min={0.1} max={5} step={0.1} value={riskPerTradePct} onChange={(e) => setRiskPerTradePct(Number(e.target.value || 0))} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white" />
              </label>

              <label className="text-sm text-slate-300">
                Win Rate (%)
                <input type="number" min={10} max={90} step={0.1} value={winRatePct} onChange={(e) => setWinRatePct(Number(e.target.value || 0))} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white" />
              </label>

              <label className="text-sm text-slate-300">
                Average RRR
                <input type="number" min={0.5} max={6} step={0.1} value={averageRRR} onChange={(e) => setAverageRRR(Number(e.target.value || 0))} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white" />
              </label>

              <label className="text-sm text-slate-300">
                Style
                <select value={style} onChange={(e) => setStyle(e.target.value as TraderStyle)} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white">
                  <option value="scalping">Scalping</option>
                  <option value="intraday">Intraday</option>
                  <option value="swing">Swing</option>
                  <option value="algo">Algo</option>
                  <option value="news">News</option>
                </select>
              </label>

              <label className="text-sm text-slate-300">
                Monte Carlo Paths
                <input type="number" min={200} max={5000} step={100} value={paths} onChange={(e) => setPaths(Number(e.target.value || 0))} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white" />
              </label>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-300 uppercase tracking-[0.12em] mb-2">Audience Mode</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMainstreamOnly(true)}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${mainstreamOnly ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100' : 'border-white/20 bg-white/5 text-slate-300'}`}
                >
                  Mainstream only
                </button>
                <button
                  type="button"
                  onClick={() => setMainstreamOnly(false)}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${!mainstreamOnly ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100' : 'border-white/20 bg-white/5 text-slate-300'}`}
                >
                  All live firms
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runSimulation}
                disabled={loading}
                className="rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 text-cyan-100 text-sm font-semibold disabled:opacity-60"
              >
                {loading ? 'Simulation en cours...' : 'Lancer la simulation'}
              </button>

              <label className="rounded-lg border border-amber-300/35 bg-amber-400/10 px-4 py-2 text-amber-100 text-sm font-semibold cursor-pointer">
                Import CSV (MT5 / TradingView / MyFXBook)
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => onUploadHistory(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {uploadStatus && <p className="mt-3 text-xs text-amber-200">{uploadStatus}</p>}
            {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          </section>

          <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
            <p className="text-emerald-200 text-xs uppercase tracking-[0.14em] mb-2">Best Firm For Your Strategy</p>
            <h3 className="text-white text-2xl font-bold mb-1">{payload?.best_firm?.firm_name || 'En attente'}</h3>
            <p className="text-slate-200 text-sm mb-4">{payload?.headline || 'Lance la simulation pour obtenir une recommandation.'}</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-200"><span>Pass probability</span><span className="text-white font-semibold">{payload?.best_firm ? `${payload.best_firm.pass_probability}%` : '-'}</span></div>
              <div className="flex justify-between text-slate-200"><span>Expected payout time</span><span className="text-white font-semibold">{payload?.best_firm?.expected_payout_days ? `${payload.best_firm.expected_payout_days} jours` : '-'}</span></div>
              <div className="flex justify-between text-slate-200"><span>Failure risk</span><span className="text-white font-semibold">{payload?.best_firm?.failure_risk || '-'}</span></div>
              <div className="flex justify-between text-slate-200"><span>Data source</span><span className="text-white font-semibold">{payload?.data_source || '-'}</span></div>
              <div className="flex justify-between text-slate-200"><span>Mode</span><span className="text-white font-semibold">{payload?.simulation?.audience_mode === 'all_live_firms' ? 'All live firms' : 'Mainstream only'}</span></div>
              <div className="flex justify-between text-slate-200"><span>Firms shown</span><span className="text-white font-semibold">{payload?.ranking_count ?? payload?.ranking?.length ?? 0}</span></div>
              <div className="flex justify-between text-slate-200"><span>Universe size</span><span className="text-white font-semibold">{payload?.universe_count ?? '-'}</span></div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-white/10 bg-slate-950/45 p-5 mb-8">
          <h2 className="text-white text-lg font-semibold mb-4">Comparaison Automatique</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((firm, idx) => (
              <div key={firm.firm_id} className="rounded-xl border border-white/15 bg-white/5 p-4">
                <p className="text-xs text-slate-300 uppercase tracking-[0.14em] mb-1">#{idx + 1}</p>
                <p className="text-white font-semibold">{firm.firm_name}</p>
                <p className="text-slate-300 text-sm mt-1">Pass probability: <span className="text-cyan-200 font-semibold">{firm.pass_probability}%</span></p>
                <p className="text-slate-300 text-sm">Expected payout: <span className="text-white font-semibold">{firm.expected_payout_days ? `${firm.expected_payout_days} jours` : 'N/A'}</span></p>
                <p className="text-slate-300 text-sm">Failure risk: <span className="text-white font-semibold">{firm.failure_risk}</span></p>
              </div>
            ))}
            {topThree.length === 0 && <p className="text-slate-300 text-sm">Aucune simulation disponible.</p>}
          </div>

          <div className="mt-5 rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-4">
            <p className="text-cyan-200 text-xs uppercase tracking-[0.14em] mb-2">Partager Profil + Top 3</p>
            <p className="text-slate-200 text-sm mb-3 whitespace-pre-line">{shareText || 'Lance une simulation pour générer un résumé partageable.'}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copyShareText} className="rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100">
                {copiedShare ? 'Copié' : 'Copier Résumé'}
              </button>
              <a href={twitterShareUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-blue-300/35 bg-blue-300/10 px-3 py-2 text-xs text-blue-100">Partager X</a>
              <a href={redditShareUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-orange-300/35 bg-orange-300/10 px-3 py-2 text-xs text-orange-100">Partager Reddit</a>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
