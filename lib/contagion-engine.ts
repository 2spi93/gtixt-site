/**
 * Contagion Engine
 *
 * Graph-based firm relationship analysis
 * Identifies stress spillover patterns across ecosystem
 * Computes firm centrality + shock propagation
 */

import type { PublicFirmRecord } from './public-firms'

export type FirmRelationship = {
  firm_a: string
  firm_b: string
  relationship_type: 'same_jurisdiction' | 'same_model' | 'fund_sharing' | 'regulatory'
  contagion_risk: number
}

export type ContagionGraph = {
  total_firms: number
  high_stress_cluster_count: number
  contagion_edges: FirmRelationship[]
  centrality_firms: Array<{ firm_id: string; centrality_score: number }>
}

const BASELINE_RISK = 0.1

function clampRisk(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function getFirmId(firm: PublicFirmRecord): string {
  return firm.firm_id || String(firm.name || 'unknown')
}

function areAccountSizesSimilar(a?: number | null, b?: number | null): boolean {
  const acctA = a ?? 0
  const acctB = b ?? 0

  if (acctA <= 0 || acctB <= 0) {
    return false
  }

  const ratio = Math.max(acctA, acctB) / Math.min(acctA, acctB)
  return ratio <= 2
}

/**
 * Build contagion graph from firm relationships.
 */
export function buildContagionGraph(firms: PublicFirmRecord[]): ContagionGraph {
  const contagion_edges: FirmRelationship[] = []
  const degreeMap = new Map<string, number>()

  for (const firm of firms) {
    degreeMap.set(getFirmId(firm), 0)
  }

  for (let i = 0; i < firms.length; i++) {
    const firmA = firms[i]
    const firmAId = getFirmId(firmA)

    for (let j = i + 1; j < firms.length; j++) {
      const firmB = firms[j]
      const firmBId = getFirmId(firmB)

      const pairEdges: FirmRelationship[] = []

      if (firmA.jurisdiction && firmA.jurisdiction === firmB.jurisdiction) {
        pairEdges.push({
          firm_a: firmAId,
          firm_b: firmBId,
          relationship_type: 'same_jurisdiction',
          contagion_risk: clampRisk(BASELINE_RISK + 0.25),
        })
      }

      if (firmA.payout_frequency && firmA.payout_frequency === firmB.payout_frequency) {
        pairEdges.push({
          firm_a: firmAId,
          firm_b: firmBId,
          relationship_type: 'fund_sharing',
          contagion_risk: clampRisk(BASELINE_RISK + 0.18),
        })
      }

      if (areAccountSizesSimilar(firmA.account_size_usd, firmB.account_size_usd)) {
        pairEdges.push({
          firm_a: firmAId,
          firm_b: firmBId,
          relationship_type: 'same_model',
          contagion_risk: clampRisk(BASELINE_RISK + 0.15),
        })
      }

      if (pairEdges.length > 0) {
        degreeMap.set(firmAId, (degreeMap.get(firmAId) || 0) + pairEdges.length)
        degreeMap.set(firmBId, (degreeMap.get(firmBId) || 0) + pairEdges.length)
        contagion_edges.push(...pairEdges)
      }
    }
  }

  const denominator = Math.max(1, firms.length - 1)
  const centrality_firms = Array.from(degreeMap.entries())
    .map(([firm_id, degree]) => ({
      firm_id,
      centrality_score: clampRisk(degree / denominator),
    }))
    .filter((item) => item.centrality_score > 0)
    .sort((a, b) => b.centrality_score - a.centrality_score)

  const highStressFirmCount = firms.filter((firm) => (firm.score_0_100 ?? 0) < 40).length
  const high_stress_cluster_count = Math.ceil(highStressFirmCount / 5)

  return {
    total_firms: firms.length,
    high_stress_cluster_count,
    contagion_edges,
    centrality_firms,
  }
}

/**
 * Find direct contagion neighbors for a firm with an optional risk threshold.
 */
export function findContagionNeighbors(
  firmId: string,
  graph: ContagionGraph,
  minRisk: number = 0.2
): FirmRelationship[] {
  return graph.contagion_edges
    .filter(
      (edge) =>
        (edge.firm_a === firmId || edge.firm_b === firmId) && edge.contagion_risk >= minRisk
    )
    .sort((a, b) => b.contagion_risk - a.contagion_risk)
}

/**
 * Compute potential propagation from a set of high-risk firms.
 */
export function computeContagionPropagation(
  highRiskFirms: string[],
  graph: ContagionGraph
): {
  propagation_potential: number
  affected_firms_estimate: number
  critical_paths: FirmRelationship[][]
} {
  const highRiskSet = new Set(highRiskFirms)
  const connectedEdges = graph.contagion_edges.filter(
    (edge) => highRiskSet.has(edge.firm_a) || highRiskSet.has(edge.firm_b)
  )

  const internalEdges = connectedEdges.filter(
    (edge) => highRiskSet.has(edge.firm_a) && highRiskSet.has(edge.firm_b)
  )

  const edgeRiskSum = connectedEdges.reduce((sum, edge) => sum + edge.contagion_risk, 0)
  const internalRiskBoost = internalEdges.reduce((sum, edge) => sum + edge.contagion_risk, 0)

  const propagation_potential = clampRisk(
    BASELINE_RISK + edgeRiskSum * 0.05 + internalRiskBoost * 0.03
  )

  const affectedSet = new Set(highRiskFirms)
  for (const edge of connectedEdges) {
    if (highRiskSet.has(edge.firm_a)) {
      affectedSet.add(edge.firm_b)
    }
    if (highRiskSet.has(edge.firm_b)) {
      affectedSet.add(edge.firm_a)
    }
  }

  const critical_paths = highRiskFirms
    .map((firmId) => findContagionNeighbors(firmId, graph, 0.25).slice(0, 3))
    .filter((path) => path.length >= 2)

  return {
    propagation_potential,
    affected_firms_estimate: affectedSet.size,
    critical_paths,
  }
}
