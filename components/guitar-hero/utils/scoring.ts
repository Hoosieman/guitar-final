import type { AccuracyStats } from "../types"

// Calculate accuracy percentage
export const calculateAccuracy = (stats: AccuracyStats): number => {
  const total = stats.perfect + stats.great + stats.good + stats.missed
  if (total === 0) return 0

  return Math.round(((stats.perfect * 1.0 + stats.great * 0.7 + stats.good * 0.4) / total) * 100)
}

// Get rating based on accuracy
export const getRating = (stats: AccuracyStats) => {
  const accuracy = calculateAccuracy(stats)

  if (accuracy >= 95) return { stars: 5, text: "PERFECT!" }
  if (accuracy >= 85) return { stars: 4, text: "AMAZING!" }
  if (accuracy >= 75) return { stars: 3, text: "GREAT!" }
  if (accuracy >= 60) return { stars: 2, text: "GOOD" }
  return { stars: 1, text: "PASSED" }
}
