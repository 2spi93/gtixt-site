/**
 * Autonomous Lab — Statistical Validator
 * Pure TypeScript (zero external deps):
 *   - Welch's t-test + Cohen's d
 *   - Epsilon-greedy bandit with UCB scoring
 *   - Z-score drift gate
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StatValidationResult {
  testName: string
  sampleSizeA: number
  sampleSizeB: number
  meanA: number
  meanB: number
  tStatistic: number
  pValue: number
  cohenD: number
  significant: boolean
  confidenceLevel: number
  effectSize: 'negligible' | 'small' | 'medium' | 'large'
  interpretation: string
  recommendation: 'accept' | 'reject' | 'inconclusive'
}

export interface BanditVariant {
  id: string
  totalReward: number
  pulls: number
}

export interface BanditResult {
  variants: Array<{
    id: string
    reward: number
    pulls: number
    ucbScore: number
  }>
  selectedVariant: string
  explorationPhase: boolean
  recommendation: string
}

export interface DriftGateResult {
  driftDetected: boolean
  maxDriftScore: number
  driftThreshold: number
  affectedMetrics: Array<{ key: string; zScore: number }>
  interpretation: string
}

// ─── Math helpers ─────────────────────────────────────────────────────────────
/** Normal CDF using Abramowitz & Stegun approximation */
function normalCDF(z: number): number {
  const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const p =
    d *
    t *
    (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))))
  return z > 0 ? 1 - p : p
}

/** Log-gamma via Lanczos approximation */
function logGamma(x: number): number {
  const coeffs = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
    0.001208650973866179, -0.000005395239384953,
  ]
  let y = x
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5)
  let ser = 1.000000000190015
  for (const c of coeffs) ser += c / ++y
  return -tmp + Math.log(2.5066282746310005 * ser / x)
}

/** Regularised incomplete beta via continued fraction (10-term) */
function incompleteBetaCF(a: number, b: number, x: number): number {
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b)
  const factor = Math.exp(a * Math.log(x) + b * Math.log1p(-x) - lbeta)
  // Lentz algorithm
  let f = 1e-30
  let C = f
  let D = 0
  for (let m = 0; m <= 100; m++) {
    const d1 =
      m === 0
        ? 1
        : (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m))
    D = 1 + d1 * D
    if (Math.abs(D) < 1e-30) D = 1e-30
    C = 1 + d1 / C
    if (Math.abs(C) < 1e-30) C = 1e-30
    D = 1 / D
    f *= C * D
    const d2 = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1))
    D = 1 + d2 * D
    if (Math.abs(D) < 1e-30) D = 1e-30
    C = 1 + d2 / C
    if (Math.abs(C) < 1e-30) C = 1e-30
    D = 1 / D
    const delta = C * D
    f *= delta
    if (Math.abs(delta - 1) < 1e-10) break
  }
  return factor * f / a
}

function incompleteBeta(a: number, b: number, x: number): number {
  if (x < 0 || x > 1) return 0
  if (x === 0) return 0
  if (x === 1) return 1
  if (x < (a + 1) / (a + b + 2)) return incompleteBetaCF(a, b, x)
  return 1 - incompleteBetaCF(b, a, 1 - x)
}

/** Two-tailed p-value from t and Welch-Satterthwaite df */
function tDistPValue(t: number, df: number): number {
  if (df <= 0) return 1
  if (df > 120) return 2 * (1 - normalCDF(Math.abs(t)))
  const x = df / (df + t * t)
  return incompleteBeta(df / 2, 0.5, x)
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function variance(arr: number[], m: number): number {
  return arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1)
}

// ─── Welch t-test ─────────────────────────────────────────────────────────────
export function validateSignificance(
  baselineScores: number[],
  candidateScores: number[],
  confidenceLevel = 0.95
): StatValidationResult {
  const MIN_SAMPLES = 5
  if (baselineScores.length < MIN_SAMPLES || candidateScores.length < MIN_SAMPLES) {
    return {
      testName: 'Welch t-test',
      sampleSizeA: baselineScores.length,
      sampleSizeB: candidateScores.length,
      meanA: 0,
      meanB: 0,
      tStatistic: 0,
      pValue: 1,
      cohenD: 0,
      significant: false,
      confidenceLevel,
      effectSize: 'negligible',
      interpretation: `Pas assez d'échantillons (minimum ${MIN_SAMPLES} par groupe, reçu ${baselineScores.length} et ${candidateScores.length}).`,
      recommendation: 'inconclusive',
    }
  }

  const n1 = baselineScores.length
  const n2 = candidateScores.length
  const m1 = mean(baselineScores)
  const m2 = mean(candidateScores)
  const v1 = variance(baselineScores, m1)
  const v2 = variance(candidateScores, m2)

  const se = Math.sqrt(v1 / n1 + v2 / n2)
  if (se < 1e-10) {
    const d = 0
    return {
      testName: 'Welch t-test',
      sampleSizeA: n1,
      sampleSizeB: n2,
      meanA: m1,
      meanB: m2,
      tStatistic: 0,
      pValue: 1,
      cohenD: d,
      significant: false,
      confidenceLevel,
      effectSize: 'negligible',
      interpretation: 'Les deux distributions sont identiques (variance nulle).',
      recommendation: 'inconclusive',
    }
  }

  const t = (m2 - m1) / se

  // Welch-Satterthwaite df
  const df =
    (v1 / n1 + v2 / n2) ** 2 /
    ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1))

  const p = tDistPValue(t, df)

  // Cohen's d (pooled SD)
  const pooledSD = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2))
  const d = pooledSD > 0 ? (m2 - m1) / pooledSD : 0

  const absD = Math.abs(d)
  const effectSize: StatValidationResult['effectSize'] =
    absD < 0.2 ? 'negligible' : absD < 0.5 ? 'small' : absD < 0.8 ? 'medium' : 'large'

  const alpha = 1 - confidenceLevel
  const significant = p < alpha

  let interpretation: string
  let recommendation: StatValidationResult['recommendation']

  const effectLabel =
    { negligible: 'négligeable', small: 'petit', medium: 'moyen', large: 'large' }[effectSize]

  if (!significant) {
    interpretation = `Différence non significative (p=${p.toFixed(3)} > α=${alpha.toFixed(2)}). Effet ${effectLabel} (d=${d.toFixed(2)}). Le candidat n'est statistiquement pas différent de la baseline.`
    recommendation = 'inconclusive'
  } else if (m2 > m1) {
    interpretation = `Amélioration significative (p=${p.toFixed(3)} < α=${alpha.toFixed(2)}). Le candidat est meilleur de ${(m2 - m1).toFixed(2)} pts en moyenne. Effet ${effectLabel} (d=${d.toFixed(2)}).`
    recommendation = 'accept'
  } else {
    interpretation = `Régression significative (p=${p.toFixed(3)}). Le candidat est moins bon de ${(m1 - m2).toFixed(2)} pts. Effet ${effectLabel} (d=${d.toFixed(2)}).`
    recommendation = 'reject'
  }

  return {
    testName: 'Welch t-test',
    sampleSizeA: n1,
    sampleSizeB: n2,
    meanA: +m1.toFixed(4),
    meanB: +m2.toFixed(4),
    tStatistic: +t.toFixed(4),
    pValue: +p.toFixed(4),
    cohenD: +d.toFixed(4),
    significant,
    confidenceLevel,
    effectSize,
    interpretation,
    recommendation,
  }
}

// ─── Epsilon-greedy bandit (UCB) ──────────────────────────────────────────────
export function runEpsilonGreedyBandit(
  variants: BanditVariant[],
  epsilon = 0.1
): BanditResult {
  if (variants.length === 0) {
    return {
      variants: [],
      selectedVariant: '',
      explorationPhase: false,
      recommendation: 'Aucun variant disponible.',
    }
  }

  const totalPulls = variants.reduce((s, v) => s + v.pulls, 0)

  const enriched = variants.map((v) => {
    const reward = v.pulls > 0 ? v.totalReward / v.pulls : 0
    const ucbScore =
      v.pulls > 0
        ? reward + Math.sqrt((2 * Math.log(totalPulls + 1)) / v.pulls)
        : Infinity
    return { id: v.id, reward: +reward.toFixed(4), pulls: v.pulls, ucbScore: +ucbScore.toFixed(4) }
  })

  const explore = Math.random() < epsilon
  const best = enriched.reduce((a, b) => (a.ucbScore >= b.ucbScore ? a : b))
  const selected = explore
    ? enriched[Math.floor(Math.random() * enriched.length)]
    : best

  return {
    variants: enriched,
    selectedVariant: selected.id,
    explorationPhase: explore,
    recommendation: explore
      ? `Phase d'exploration (ε=${epsilon}): variant "${selected.id}" sélectionné aléatoirement. Continuer à collecter des données.`
      : `Phase d'exploitation: variant "${best.id}" sélectionné (UCB ${best.ucbScore}). Score moyen: ${best.reward}.`,
  }
}

// ─── Drift gate (Z-score) ─────────────────────────────────────────────────────
export function checkDriftGate(
  recentMetrics: Array<Record<string, number>>,
  driftThreshold = 3.0
): DriftGateResult {
  if (recentMetrics.length < 3) {
    return {
      driftDetected: false,
      maxDriftScore: 0,
      driftThreshold,
      affectedMetrics: [],
      interpretation:
        `Pas assez d'historique pour détecter la dérive (minimum 3 snapshots).`,
    }
  }

  const keys = Object.keys(recentMetrics[0])
  const affectedMetrics: Array<{ key: string; zScore: number }> = []
  let maxDrift = 0

  for (const key of keys) {
    const vals = recentMetrics.map((m) => Number(m[key] ?? 0))
    const m = mean(vals)
    const std = Math.sqrt(vals.reduce((s, x) => s + (x - m) ** 2, 0) / vals.length)
    const latest = vals[vals.length - 1]
    const z = std > 0 ? Math.abs(latest - m) / std : 0
    if (z > driftThreshold) {
      affectedMetrics.push({ key, zScore: +z.toFixed(2) })
      if (z > maxDrift) maxDrift = z
    }
  }

  const driftDetected = affectedMetrics.length > 0

  return {
    driftDetected,
    maxDriftScore: +maxDrift.toFixed(2),
    driftThreshold,
    affectedMetrics,
    interpretation: driftDetected
      ? `⚠️ Dérive détectée sur ${affectedMetrics.length} métrique(s): ${affectedMetrics.map((m) => `${m.key} (z=${m.zScore})`).join(', ')}. Seuil: z=${driftThreshold}.`
      : `✅ Aucune dérive significative. Toutes les métriques sont dans les limites normales (z < ${driftThreshold}).`,
  }
}
