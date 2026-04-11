/**
 * Predictive Earnings Forecasting
 * Uses linear regression + moving average to project future earnings.
 */

interface DataPoint {
  date: string
  earnings: number
  clicks: number
}

interface ForecastResult {
  optimistic: ForecastPoint[]
  expected: ForecastPoint[]
  pessimistic: ForecastPoint[]
  confidenceLevel: number
  trend: 'up' | 'down' | 'stable'
  growthRate: number
  suggestedAction: string
}

interface ForecastPoint {
  date: string
  value: number
  confidence: number // 0-1
}

// Linear regression
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length
  if (n < 2) return { slope: 0, intercept: data[0] || 0 }

  const xMean = (n - 1) / 2
  const yMean = data.reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let denominator = 0
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (data[i] - yMean)
    denominator += (i - xMean) ** 2
  }

  const slope = denominator !== 0 ? numerator / denominator : 0
  const intercept = yMean - slope * xMean
  return { slope, intercept }
}

// Simple moving average
function movingAverage(data: number[], window: number): number {
  if (data.length < window) return data[data.length - 1] || 0
  const slice = data.slice(-window)
  return slice.reduce((a, b) => a + b, 0) / window
}

export function forecastEarnings(
  historicalData: DataPoint[],
  days: number = 30
): ForecastResult {
  if (historicalData.length < 3) {
    return {
      optimistic: [],
      expected: [],
      pessimistic: [],
      confidenceLevel: 0,
      trend: 'stable',
      growthRate: 0,
      suggestedAction: 'Need more historical data for accurate forecasting.',
    }
  }

  const earnings = historicalData.map(d => d.earnings)
  const { slope, intercept } = linearRegression(earnings)

  // Calculate moving average for smoothing
  const ma3 = movingAverage(earnings, Math.min(3, earnings.length))
  const ma7 = movingAverage(earnings, Math.min(7, earnings.length))
  const recentAvg = earnings.length >= 7 ? ma7 : ma3

  // Standard deviation for confidence intervals
  const mean = earnings.reduce((a, b) => a + b, 0) / earnings.length
  const variance = earnings.reduce((sum, val) => sum + (val - mean) ** 2, 0) / earnings.length
  const stdDev = Math.sqrt(variance)

  // Generate forecast
  const today = new Date()
  const optimistic: ForecastPoint[] = []
  const expected: ForecastPoint[] = []
  const pessimistic: ForecastPoint[] = []

  for (let i = 1; i <= days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    // Linear projection
    const projected = intercept + slope * (earnings.length + i)

    // Mean-reversion: blend linear projection with recent average
    const weight = Math.min(i / days, 0.6) // Increase linear weight over time
    const blended = projected * (1 - weight) + recentAvg * weight

    // Confidence intervals (widen over time)
    const confidenceWidth = stdDev * Math.sqrt(i / 7)
    optimistic.push({
      date: dateStr,
      value: Math.max(0, blended + confidenceWidth),
      confidence: Math.max(0.3, 1 - (i / days) * 0.7),
    })
    expected.push({
      date: dateStr,
      value: Math.max(0, blended),
      confidence: Math.max(0.3, 1 - (i / days) * 0.7),
    })
    pessimistic.push({
      date: dateStr,
      value: Math.max(0, blended - confidenceWidth),
      confidence: Math.max(0.3, 1 - (i / days) * 0.7),
    })
  }

  // Determine trend
  const firstHalf = earnings.slice(0, Math.floor(earnings.length / 2))
  const secondHalf = earnings.slice(Math.floor(earnings.length / 2))
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  const growthRate = firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

  const trend = growthRate > 5 ? 'up' : growthRate < -5 ? 'down' : 'stable'

  // Generate suggested action
  let suggestedAction = ''
  if (trend === 'up') {
    suggestedAction = `Earnings trending up (+${growthRate.toFixed(1)}%). Consider increasing affiliate link volume.`
  } else if (trend === 'down') {
    suggestedAction = `Earnings declining (${growthRate.toFixed(1)}%). Review underperforming links and optimize.`
  } else {
    suggestedAction = 'Earnings stable. Focus on creating new affiliate links in trending categories.'
  }

  // Commission rate suggestion
  if (recentAvg > 100) {
    suggestedAction += ' Consider negotiating higher commission rates.'
  }

  return {
    optimistic,
    expected,
    pessimistic,
    confidenceLevel: Math.max(0.3, 1 - (stdDev / (mean || 1))),
    trend,
    growthRate,
    suggestedAction,
  }
}

// Suggest optimal commission rate based on historical performance
export function suggestCommissionRate(
  historicalData: DataPoint[],
  currentRate: number = 5
): { suggested: number; reason: string } {
  if (historicalData.length < 7) {
    return { suggested: currentRate, reason: 'Insufficient data for rate optimization.' }
  }

  const totalEarnings = historicalData.reduce((sum, d) => sum + d.earnings, 0)
  const avgDaily = totalEarnings / historicalData.length

  if (avgDaily > 50) {
    return {
      suggested: Math.min(currentRate + 2, 15),
      reason: `High daily earnings (RM${avgDaily.toFixed(2)}). Negotiate higher commission rate.`,
    }
  } else if (avgDaily > 20) {
    return {
      suggested: Math.min(currentRate + 1, 12),
      reason: `Good daily earnings (RM${avgDaily.toFixed(2)}). Moderate rate increase possible.`,
    }
  }

  return {
    suggested: currentRate,
    reason: `Average daily earnings (RM${avgDaily.toFixed(2)}). Focus on volume first.`,
  }
}
