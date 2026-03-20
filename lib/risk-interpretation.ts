export type RiskBand = 'low' | 'moderate' | 'elevated' | 'high' | 'critical'

export type RiskInterpretation = {
  band: RiskBand
  label: string
  interpretation: string
  recommended_action: string
}

function clampRisk(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

export function interpretRiskProbability(rawProbability: number): RiskInterpretation {
  const probability = clampRisk(rawProbability)

  if (probability >= 0.85) {
    return {
      band: 'critical',
      label: 'Critical',
      interpretation: 'Critical - similar patterns observed before firm closures.',
      recommended_action: 'Escalate immediately to risk committee and freeze incremental allocation.',
    }
  }

  if (probability >= 0.75) {
    return {
      band: 'high',
      label: 'High',
      interpretation: 'High probability of operational disruption.',
      recommended_action: 'Freeze incremental allocation and run senior risk review.',
    }
  }

  if (probability >= 0.6) {
    return {
      band: 'elevated',
      label: 'Elevated',
      interpretation: 'Elevated risk - historically associated with firm instability.',
      recommended_action: 'Reduce new exposure and increase monitoring cadence.',
    }
  }

  if (probability >= 0.4) {
    return {
      band: 'moderate',
      label: 'Moderate',
      interpretation: 'Moderate risk - mixed indicators require active monitoring.',
      recommended_action: 'Run targeted checks and monitor trend persistence.',
    }
  }

  return {
    band: 'low',
    label: 'Low',
    interpretation: 'Low risk - no immediate structural stress signal.',
    recommended_action: 'Maintain normal monitoring cadence.',
  }
}
