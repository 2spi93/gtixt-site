/**
 * Institutional Analytics Data - High Granularity
 * Monthly/Weekly data for ECharts institutional charts
 * Realistic micro-variations with natural fluctuations
 */

// Helper: generate realistic monthly data with micro-variations
function generateMonthlyData(
  startYear: number,
  endYear: number,
  baseValue: number,
  volatility: number = 2,
  trend: number = 0.5
): Array<{ date: string; value: number }> {
  const data: Array<{ date: string; value: number }> = []
  let currentValue = baseValue

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const randomShock = (Math.random() - 0.5) * volatility
      const trendComponent = trend * (year - startYear + (month - 1) / 12)
      currentValue = baseValue + trendComponent + randomShock + Math.sin(month / 2) * (volatility / 2)
      
      // Add realistic events
      if (year === 2023 && month === 3) currentValue -= 4 // Prop consolidation
      if (year === 2024 && month === 2) currentValue += 3 // Recovery
      if (year === 2024 && month === 11) currentValue -= 2 // Volatility spike

      const dateStr = `${year}-${String(month).padStart(2, '0')}`
      data.push({ date: dateStr, value: parseFloat(currentValue.toFixed(2)) })
    }
  }

  return data
}

// 1. SECTOR RISK INDEX - Monthly data with subsectors
export const sectorRiskMonthlyData = (() => {
  const dates: string[] = []
  const forex: number[] = []
  const futures: number[] = []
  const crypto: number[] = []
  const indices: number[] = []

  for (let year = 2021; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}`
      dates.push(dateStr)

      // Forex: stable, low volatility (40-50 range)
      const fxBase = 45
      const fxVariation = Math.sin(month / 3) * 2 + (Math.random() - 0.5) * 1.5
      forex.push(parseFloat((fxBase + fxVariation + (year - 2021) * 0.6).toFixed(2)))

      // Futures: moderate risk (48-58 range)
      const futBase = 52
      const futVariation = Math.cos(month / 2.5) * 2.5 + (Math.random() - 0.5) * 2
      futures.push(parseFloat((futBase + futVariation + (year - 2021) * 0.5).toFixed(2)))

      // Crypto: high volatility with 2024 spike (50-80 range)
      let cryptoValue = 58 + Math.sin(month / 1.8) * 4 + (Math.random() - 0.5) * 3
      if (year === 2024 && month >= 10) cryptoValue += 14 // Nov 2024 spike
      if (year === 2025) cryptoValue -= 6 // 2025 cooldown
      crypto.push(parseFloat((cryptoValue + (year - 2021) * 1.2).toFixed(2)))

      // Indices: very stable (35-45 range)
      const idxBase = 40
      const idxVariation = Math.sin(month / 4) * 1.2 + (Math.random() - 0.5) * 1
      indices.push(parseFloat((idxBase + idxVariation + (year - 2021) * 0.3).toFixed(2)))
    }
  }

  return { dates, forex, futures, crypto, indices }
})()

// 2. FIRM SURVIVAL RATE - Weekly data with confidence bands
export const survivalRateWeeklyData = (() => {
  const data: Array<{ date: string; value: number; lower: number; upper: number }> = []
  let baseValue = 58

  for (let year = 2021; year <= 2025; year++) {
    for (let week = 1; week <= 52; week++) {
      const weekStr = `${year}-W${String(week).padStart(2, '0')}`
      
      // Natural growth with seasonal patterns
      const seasonal = Math.sin((week / 52) * Math.PI * 2) * 1.5
      const trend = (year - 2021) * 1.4 + (week / 52) * 0.3
      const shock = (Math.random() - 0.5) * 0.8
      
      // 2023 consolidation wave
      let eventImpact = 0
      if (year === 2023 && week >= 8 && week <= 20) {
        eventImpact = -3.5 * Math.sin(((week - 8) / 12) * Math.PI)
      }
      
      const value = baseValue + trend + seasonal + shock + eventImpact
      const confidenceWidth = 2.8 + Math.abs(seasonal) * 0.4
      
      data.push({
        date: weekStr,
        value: parseFloat(value.toFixed(2)),
        lower: parseFloat((value - confidenceWidth).toFixed(2)),
        upper: parseFloat((value + confidenceWidth).toFixed(2)),
      })
    }
  }

  // Sample to monthly for better visualization (select week 2 of each month)
  return data.filter((_, idx) => idx % 4 === 1)
})()

// 3. SCORE DISTRIBUTION - 500 individual firm scores with KDE
export const scoreDistributionData = (() => {
  const firmScores: number[] = []
  
  // Generate 500 realistic scores with normal-like distribution
  // Centered around 72, with realistic spread
  for (let i = 0; i < 500; i++) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    
    let score = 72 + z0 * 8 // Mean 72, std dev 8
    
    // Add institutional clustering (firms near tier boundaries)
    if (Math.random() < 0.2) {
      const tier = [65, 75, 85][Math.floor(Math.random() * 3)]
      score = tier + (Math.random() - 0.5) * 3
    }
    
    // Clamp to 50-100 range
    score = Math.max(50, Math.min(100, score))
    firmScores.push(parseFloat(score.toFixed(1)))
  }
  
  firmScores.sort((a, b) => a - b)
  
  // Create histogram buckets
  const buckets: Array<{ range: string; firms: number; avgScore: number }> = []
  for (let i = 50; i < 100; i += 5) {
    const firmsInBucket = firmScores.filter(s => s >= i && s < i + 5)
    buckets.push({
      range: `${i}-${i + 4}`,
      firms: firmsInBucket.length,
      avgScore: firmsInBucket.length > 0
        ? parseFloat((firmsInBucket.reduce((a, b) => a + b, 0) / firmsInBucket.length).toFixed(1))
        : i + 2.5,
    })
  }
  
  // KDE (Kernel Density Estimation) for smooth curve
  const kdePoints: Array<{ score: number; density: number }> = []
  const bandwidth = 3.5
  
  for (let x = 50; x <= 100; x += 0.5) {
    let density = 0
    for (const score of firmScores) {
      const u = (x - score) / bandwidth
      density += Math.exp(-0.5 * u * u) / (bandwidth * Math.sqrt(2 * Math.PI))
    }
    kdePoints.push({ score: x, density: parseFloat((density / firmScores.length).toFixed(4)) })
  }
  
  return { buckets, kdePoints, firmScores }
})()

// 4. INDUSTRY CONCENTRATION - Quarterly evolution
export const concentrationData = {
  current: [
    { name: 'Top 5', value: 62, color: '#22E6DA' },
    { name: 'Next 15', value: 24, color: '#0EA5E9' },
    { name: 'Long Tail', value: 14, color: '#1E3A8A' },
  ],
  quarterly: (() => {
    const data: Array<{ quarter: string; top5: number; next15: number; longTail: number }> = []
    
    for (let year = 2021; year <= 2025; year++) {
      for (let q = 1; q <= 4; q++) {
        const quarterStr = `${year} Q${q}`
        
        // Concentration gradually increasing (consolidation trend)
        const timeFactor = (year - 2021) * 4 + (q - 1)
        const top5 = 58 + timeFactor * 0.28 + (Math.random() - 0.5) * 1.2
        const next15 = 26 - timeFactor * 0.15 + (Math.random() - 0.5) * 0.8
        const longTail = 100 - top5 - next15
        
        data.push({
          quarter: quarterStr,
          top5: parseFloat(top5.toFixed(1)),
          next15: parseFloat(next15.toFixed(1)),
          longTail: parseFloat(longTail.toFixed(1)),
        })
      }
    }
    
    return data
  })(),
}

// 5. SCORE EVOLUTION OVER TIME - Monthly aggregate
export const scoreEvolutionData = generateMonthlyData(2021, 2025, 68, 1.8, 0.8)

// Annotations for key events
export const analyticsAnnotations = {
  sectorRisk: [
    { date: '2024-11', value: 74, label: 'Crypto volatility spike', position: 'top' },
  ],
  survival: [
    { date: '2023-W08', value: 58, label: 'Prop firm consolidation wave', position: 'bottom' },
    { date: '2024-W26', value: 64, label: 'Market recovery', position: 'top' },
  ],
  scoreDistribution: [
    { score: 75, label: 'Median shift (compliance update)', position: 'top' },
  ],
  concentration: [
    { quarter: '2024 Q4', label: 'Market share redistribution', position: 'right' },
  ],
}
