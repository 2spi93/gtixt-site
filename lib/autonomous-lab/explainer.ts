/**
 * Autonomous Lab — Explainer
 * Converts raw metrics + orchestration steps into human-readable reports
 * designed for non-technical operators (novices).
 */
import type { ExperimentMetrics } from './types'

export type MetricRating = 'excellent' | 'good' | 'neutral' | 'warning' | 'critical'

export interface MetricInterpretation {
  key: string
  label: string
  value: number
  rating: MetricRating
  emoji: string
  description: string
  interpretation: string
  advice: string
}

export interface StepExplanation {
  name: string
  humanLabel: string
  status: 'ok' | 'warning'
  explanation: string
}

export interface RecommendationExplanation {
  value: string
  label: string
  color: string
  explanation: string
  nextAction: string
  warning?: string
}

export interface HumanReport {
  headline: string
  summary: string
  metrics: MetricInterpretation[]
  steps: StepExplanation[]
  recommendation: RecommendationExplanation
  decisionScoreExplanation?: string
}

// ─── Metric definitions ────────────────────────────────────────────────────
type MetricRate = {
  max: number
  rating: MetricRating
  emoji: string
  interpretation: string
  advice: string
}

const METRIC_DEFS: Record<
  string,
  { label: string; description: string; rates: MetricRate[] }
> = {
  coverageDelta: {
    label: 'Couverture des firmes',
    description:
      'Mesure le % de firmes correctement scorées (non N/A). Positif = le modèle candidat couvre plus de firmes que la baseline.',
    rates: [
      { max: -5, rating: 'critical', emoji: '🔴', interpretation: 'Sévère régression: le candidat perd beaucoup de couverture.', advice: 'Revoir la logique N/A du modèle candidat.' },
      { max: -0.1, rating: 'warning', emoji: '🟡', interpretation: 'Légère perte de couverture. À surveiller.', advice: 'Analyser quelles firmes sont tombées en N/A.' },
      { max: 0.1, rating: 'neutral', emoji: '⚪', interpretation: 'Identique à la baseline. Pas de perte ni de gain.', advice: 'Regarder les autres métriques pour évaluer la valeur du candidat.' },
      { max: 3, rating: 'good', emoji: '🟢', interpretation: 'Le candidat couvre légèrement plus de firmes.', advice: 'Bonne direction. Vérifier si la qualité reste stable.' },
      { max: Infinity, rating: 'excellent', emoji: '✅', interpretation: 'Gain de couverture significatif.', advice: 'Vérifier que ce gain ne sacrifie pas la précision ou la stabilité.' },
    ],
  },
  stabilityDelta: {
    label: 'Stabilité des scores',
    description:
      'Mesure la dispersion des scores entre runs. Positif = le candidat est plus stable (moins de variance). Négatif = scores erratiques.',
    rates: [
      { max: -2, rating: 'critical', emoji: '🔴', interpretation: 'Forte instabilité: le candidat donne des scores très variables entre runs.', advice: 'À rejeter. Le modèle est trop sensible aux données.' },
      { max: -0.1, rating: 'warning', emoji: '🟡', interpretation: 'Légère instabilité vs baseline.', advice: 'Garder en shadow. Identifier les firmes avec scores fluctuants.' },
      { max: 0.1, rating: 'neutral', emoji: '⚪', interpretation: 'Stabilité quasi-identique à la baseline.', advice: 'Neutre. Regarder d\'autres métriques.' },
      { max: 1, rating: 'good', emoji: '🟢', interpretation: 'Le candidat est plus stable. Bonne amélioration.', advice: 'Continuer dans cette direction.' },
      { max: Infinity, rating: 'excellent', emoji: '✅', interpretation: 'Forte amélioration de stabilité. Le candidat donne des scores reproductibles.', advice: 'Excellent résultat sur ce critère.' },
    ],
  },
  anomaliesDelta: {
    label: 'Réduction des anomalies',
    description:
      'Nombre de scores jugés invalides (hors plages attendues). Positif = le candidat produit moins d\'anomalies. Négatif = problème de qualité.',
    rates: [
      { max: -3, rating: 'critical', emoji: '🔴', interpretation: 'Beaucoup plus d\'anomalies que la baseline. À rejeter.', advice: 'Revoir les pénalités et plages de validation du candidat.' },
      { max: -0.5, rating: 'warning', emoji: '🟡', interpretation: 'Légère hausse des anomalies.', advice: 'Identifier quelles firmes produisent des anomalies.' },
      { max: 0.5, rating: 'neutral', emoji: '⚪', interpretation: 'Même niveau d\'anomalies. Pas de régression.', advice: 'Neutre. Regarder les autres critères.' },
      { max: 2, rating: 'good', emoji: '🟢', interpretation: 'Légère réduction des anomalies.', advice: 'Bon signal de qualité.' },
      { max: Infinity, rating: 'excellent', emoji: '✅', interpretation: 'Forte réduction des anomalies. Le candidat est plus propre.', advice: 'Excellent signal de qualité.' },
    ],
  },
  riskSeparationDelta: {
    label: 'Séparation des niveaux de risque',
    description:
      'Mesure si les buckets High/Medium/Low risk sont bien distincts. Positif = meilleure séparation, score plus explicable.',
    rates: [
      { max: -2, rating: 'critical', emoji: '🔴', interpretation: 'Les niveaux de risque se confondent. Le score devient peu explicable.', advice: 'Revoir les paramètres de pondération par bucket.' },
      { max: -0.1, rating: 'warning', emoji: '🟡', interpretation: 'Légère dégradation de la séparation.', advice: 'Tester d\'autres valeurs de candidateBias.' },
      { max: 0.1, rating: 'neutral', emoji: '⚪', interpretation: 'Séparation identique à la baseline.', advice: 'Neutre.' },
      { max: 1, rating: 'good', emoji: '🟢', interpretation: 'Meilleure séparation des niveaux de risque.', advice: 'Bon signal de lisibilité pour les utilisateurs.' },
      { max: Infinity, rating: 'excellent', emoji: '✅', interpretation: 'Très bonne séparation. Le modèle est plus explicable.', advice: 'Continuer dans cette direction.' },
    ],
  },
  snapshotDriftDelta: {
    label: 'Drift inter-snapshot',
    description:
      'Mesure la dérive des scores entre deux snapshots consécutifs. Positif = le candidat dérive moins dans le temps.',
    rates: [
      { max: -3, rating: 'critical', emoji: '🔴', interpretation: 'Forte dérive temporelle. Le modèle est instable dans le temps.', advice: 'Analyser les firmes avec score très volatil.' },
      { max: -0.1, rating: 'warning', emoji: '🟡', interpretation: 'Dérive légèrement supérieure à la baseline.', advice: 'Surveiller sur plusieurs snapshots.' },
      { max: 0.5, rating: 'good', emoji: '🟢', interpretation: 'Dérive réduite. Le modèle est plus stable dans le temps.', advice: 'Bon signal de fiabilité long terme.' },
      { max: Infinity, rating: 'excellent', emoji: '✅', interpretation: 'Très faible dérive. Scores très reproductibles dans le temps.', advice: 'Excellent signal de stabilité.' },
    ],
  },
  bucketChurnDelta: {
    label: 'Churn de bucket',
    description:
      'Mesure la fréquence avec laquelle des firmes changent de bucket (High → Medium, etc.) sans raison métier. Positif = moins de transitions non justifiées.',
    rates: [
      { max: -2, rating: 'critical', emoji: '🔴', interpretation: 'Beaucoup de firmes changent de bucket. Le modèle est instable.', advice: 'Revoir les logiques de transition et les seuils de bucket.' },
      { max: -0.1, rating: 'warning', emoji: '🟡', interpretation: 'Légèrement plus de churn que la baseline.', advice: 'Identifier les firmes qui "oscillent" entre buckets.' },
      { max: 0.1, rating: 'neutral', emoji: '⚪', interpretation: 'Identique à la baseline.', advice: 'Neutre.' },
      { max: 1, rating: 'good', emoji: '🟢', interpretation: 'Moins de churn. Les firmes restent dans leur bucket.', advice: 'Bon signe de cohérence.' },
      { max: Infinity, rating: 'excellent', emoji: '✅', interpretation: 'Très peu de churn. Modèle très cohérent.', advice: 'Excellent.' },
    ],
  },
  perfDelta: {
    label: 'Performance WebGL (FPS)',
    description:
      'Différence vs cible de 40 FPS pour le globe 3D. ⚠️ Si aucune donnée WebGL n\'est disponible (globe non chargé), cette valeur vaut -40 automatiquement — ce n\'est PAS une régression réelle du scoring.',
    rates: [
      { max: -35, rating: 'warning', emoji: '🟡', interpretation: 'Signal WebGL absent ou dégradé. Probablement dû à l\'absence de données de télémétrie, pas à une régression du scoring.', advice: 'Vérifier que la télémétrie WebGL est active (globe chargé). Si non, ignorer cette métrique pour l\'évaluation du scoring.' },
      { max: -5, rating: 'neutral', emoji: '⚪', interpretation: 'Performance WebGL légèrement en-dessous de la cible.', advice: 'Charger le globe et vérifier en conditions réelles.' },
      { max: 0, rating: 'good', emoji: '🟢', interpretation: 'Performance proche de la cible de 40 FPS.', advice: 'OK.' },
      { max: Infinity, rating: 'excellent', emoji: '✅', interpretation: 'Performance WebGL supérieure à 40 FPS.', advice: 'Optimal.' },
    ],
  },
  qualityDelta: {
    label: 'Qualité WebGL (incidents critiques)',
    description:
      'Nombre d\'incidents critiques WebGL. Zéro = aucun problème. Négatif = incidents détectés.',
    rates: [
      { max: -3, rating: 'critical', emoji: '🔴', interpretation: 'Plusieurs incidents critiques détectés.', advice: 'Corriger les erreurs WebGL avant toute promotion.' },
      { max: -1, rating: 'warning', emoji: '🟡', interpretation: 'Quelques signaux critiques.', advice: 'Surveiller et analyser le type d\'incidents.' },
      { max: 0.1, rating: 'good', emoji: '🟢', interpretation: 'Aucun incident critique.', advice: 'Bon.' },
      { max: Infinity, rating: 'excellent', emoji: '✅', interpretation: 'Parfait. Aucun incident.', advice: '' },
    ],
  },
  decisionScore: {
    label: 'Score de décision composite',
    description:
      'Score synthétique calculé à partir de toutes les métriques pondérées (0–100). Reflète la probabilité globale qu\'un expert approuve l\'expérience. Centré sur 50 (neutre). > 55 = candidat généralement recommandé.',
    rates: [
      { max: 40, rating: 'critical', emoji: '🔴', interpretation: 'Score très faible. Le candidat dégrade clairement les métriques.', advice: 'Rejeter et revoir l\'hypothèse.' },
      { max: 50, rating: 'warning', emoji: '🟡', interpretation: 'Score en-dessous du neutre. Le candidat n\'apporte pas encore de valeur.', advice: 'Garder en shadow. Ajuster les paramètres et relancer.' },
      { max: 55, rating: 'neutral', emoji: '⚪', interpretation: 'Score neutre. Pas de régression, pas d\'amélioration significative.', advice: 'Selon les seuils module, peut être insuffisant pour promotion.' },
      { max: 65, rating: 'good', emoji: '🟢', interpretation: 'Le candidat améliore les métriques clés.', advice: 'Peut être promu si les seuils module sont atteints.' },
      { max: Infinity, rating: 'excellent', emoji: '✅', interpretation: 'Très bonne amélioration. Candidat recommandé.', advice: 'Promouvoir pour review humaine.' },
    ],
  },
}

const STEP_LABELS: Record<string, string> = {
  architect: '🔬 Architecte — Définition de la configuration',
  'code-agent': '⚙️ Agent de configuration — Changements appliqués',
  'runner-shadow': '👥 Runner Shadow — Comparaison baseline/candidat',
  'runner-webgl': '🖥️ Runner WebGL — Santé du rendu 3D',
  analyst: '📊 Analyste — Synthèse & recommandation',
  reviewer: '🛡️ Gardien de promotion — Contrôle de gouvernance',
}

const STEP_EXPLANATIONS: Record<string, string> = {
  architect:
    'Ce step propose la configuration candidate basée sur votre hypothèse (ex: modifier le poids du risque, ajuster la pénalité N/A). Rien de production n\'est touché.',
  'code-agent':
    'Applique les changements en mode simulé uniquement. Ne touche PAS la production. Le modèle candidat est isolé dans le shadow layer.',
  'runner-shadow':
    'Lance le scoring des deux modèles (baseline et candidat) sur un échantillon de firmes réelles. Compare les résultats et calcule les deltas. Aucune donnée n\'est publiée.',
  'runner-webgl':
    'Analyse les données de télémétrie du globe 3D pour mesurer l\'impact sur les performances visuelles. Si le globe n\'a pas été chargé, les métriques WebGL seront à zéro.',
  analyst:
    'Fusionne toutes les métriques, calcule le score composite, et émet une recommandation basée sur les seuils que vous avez configurés pour ce module.',
  reviewer:
    'Dernier garde-fou: vérifie qu\'aucune promotion automatique n\'est possible. Toute promotion vers la production NÉCESSITE une approbation humaine explicite dans la file de promotion.',
}

const RECOMMENDATION_LABELS: Record<
  string,
  { value: string; label: string; color: string; explanation: string; nextAction: string; warning?: string }
> = {
  promote_for_review: {
    value: 'promote_for_review',
    label: '✅ Recommandé pour review',
    color: 'green',
    explanation:
      'Toutes les métriques respectent les seuils de promotion configurés pour ce module. Le candidat est meilleur ou équivalent à la baseline sur tous les critères.',
    nextAction:
      '1) Vérifier les métriques ci-dessus. 2) Si vous êtes d\'accord, cliquer sur "Request Promotion". 3) Approuver manuellement dans la file de promotion. 4) Implémenter en production de façon contrôlée (PR, tests, déploiement manuel).',
  },
  keep_in_shadow: {
    value: 'keep_in_shadow',
    label: '🟡 Garder en mode shadow',
    color: 'yellow',
    explanation:
      'Le candidat ne remplit pas encore tous les seuils de promotion. Il n\'est pas non plus rejeté: des ajustements peuvent l\'améliorer.',
    nextAction:
      '1) Regarder quelles métriques sont en warning. 2) Ajuster les paramètres de l\'expérience. 3) Relancer Shadow puis Orchestrator. 4) Répéter jusqu\'à obtenir "promote_for_review".',
  },
  reject: {
    value: 'reject',
    label: '🔴 Rejet recommandé',
    color: 'red',
    explanation:
      'Le candidat dégrade des métriques critiques (anomalies > +3 ou stabilité < -2). La baseline est clairement meilleure.',
    nextAction:
      '1) Cliquer "Request Promotion" puis "Reject" dans la file. 2) Reformuler complètement l\'hypothèse. 3) Créer une nouvelle expérience avec une approche différente.',
    warning: 'Ce résultat est considéré comme une régression. Ne pas promouvoir.',
  },
}

// ─── Public API ─────────────────────────────────────────────────────────────

function rateMetric(key: string, value: number): Omit<MetricInterpretation, 'key' | 'value'> {
  const def = METRIC_DEFS[key]
  if (!def) {
    return {
      label: key,
      rating: 'neutral',
      emoji: '⚪',
      description: 'Métrique non documentée.',
      interpretation: `Valeur: ${value}`,
      advice: '',
    }
  }
  const rate = def.rates.find((r) => value < r.max) ?? def.rates[def.rates.length - 1]
  return {
    label: def.label,
    rating: rate.rating,
    emoji: rate.emoji,
    description: def.description,
    interpretation: rate.interpretation,
    advice: rate.advice,
  }
}

export function buildHumanReport(
  metrics: Record<string, unknown>,
  steps: Array<{ name: string; status: 'ok' | 'warning'; details: Record<string, unknown> }>,
  recommendation: string
): HumanReport {
  const metricInterps: MetricInterpretation[] = Object.entries(metrics)
    .filter(([, v]) => typeof v === 'number')
    .map(([key, v]) => {
      const val = Number(v)
      const rated = rateMetric(key, val)
      return { key, value: val, ...rated }
    })

  const stepExps: StepExplanation[] = steps.map((s) => ({
    name: s.name,
    humanLabel: STEP_LABELS[s.name] ?? s.name,
    status: s.status,
    explanation: STEP_EXPLANATIONS[s.name] ?? '',
  }))

  const recDef = RECOMMENDATION_LABELS[recommendation] ?? {
    value: recommendation,
    label: recommendation,
    color: 'gray',
    explanation: '',
    nextAction: '',
  }

  const dsMetric = metricInterps.find((m) => m.key === 'decisionScore')
  const decisionScoreExplanation = dsMetric
    ? `Score composite: ${dsMetric.value}/100 — ${dsMetric.interpretation}`
    : undefined

  const critCount = metricInterps.filter((m) => m.rating === 'critical').length
  const warnCount = metricInterps.filter((m) => m.rating === 'warning').length
  const goodCount = metricInterps.filter(
    (m) => m.rating === 'good' || m.rating === 'excellent'
  ).length

  let headline: string
  let summary: string

  if (recommendation === 'promote_for_review') {
    headline = '✅ Expérience positive — Prête pour review humaine'
    summary = `Le candidat passe tous les seuils du module. ${goodCount} métrique(s) positive(s)${warnCount > 0 ? `, ${warnCount} à surveiller` : ''}. Vous pouvez demander la promotion.`
  } else if (recommendation === 'reject') {
    headline = '🔴 Expérience rejetée — Régression détectée'
    summary = `${critCount} métrique(s) critique(s) détectée(s). La baseline reste meilleure. Reformulez l'hypothèse avant de retenter.`
  } else {
    headline = '🟡 Expérience en cours — Seuils pas encore atteints'
    summary = `${warnCount > 0 ? `${warnCount} métrique(s) en-dessous des seuils.` : 'Les seuils ne sont pas encore tous atteints.'} Affiner les paramètres et relancer.`
  }

  return {
    headline,
    summary,
    metrics: metricInterps,
    steps: stepExps,
    recommendation: recDef,
    decisionScoreExplanation,
  }
}
