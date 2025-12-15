/**
 * Calculates the probability that a parking spot is still available
 * based on time since it became available and current time of day.
 */

interface ProbabilityRange {
  minMinutes: number;
  maxMinutes: number;
  minProbability: number;
  maxProbability: number;
}

const PEAK_HOURS_RANGES: ProbabilityRange[] = [
  { minMinutes: 0, maxMinutes: 5, minProbability: 90, maxProbability: 100 },
  { minMinutes: 5, maxMinutes: 10, minProbability: 70, maxProbability: 89 },
  { minMinutes: 10, maxMinutes: 15, minProbability: 50, maxProbability: 69 },
  { minMinutes: 15, maxMinutes: 20, minProbability: 30, maxProbability: 49 },
  { minMinutes: 20, maxMinutes: 30, minProbability: 10, maxProbability: 29 },
];

const OFF_HOURS_RANGES: ProbabilityRange[] = [
  { minMinutes: 0, maxMinutes: 15, minProbability: 90, maxProbability: 100 },
  { minMinutes: 15, maxMinutes: 30, minProbability: 75, maxProbability: 89 },
  { minMinutes: 30, maxMinutes: 60, minProbability: 55, maxProbability: 74 },
  { minMinutes: 60, maxMinutes: 90, minProbability: 30, maxProbability: 54 },
  { minMinutes: 90, maxMinutes: 120, minProbability: 10, maxProbability: 29 },
];

/**
 * Check if current time is within peak hours (08:00-20:00 Munich time)
 */
function isPeakHours(): boolean {
  const now = new Date();
  // Get Munich time (CET/CEST)
  const munichTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const hour = munichTime.getHours();
  return hour >= 8 && hour < 20;
}

/**
 * Interpolate probability within a range
 */
function interpolateProbability(
  minutesElapsed: number,
  range: ProbabilityRange
): number {
  const rangeMinutes = range.maxMinutes - range.minMinutes;
  const progress = (minutesElapsed - range.minMinutes) / rangeMinutes;
  // Probability decreases as time increases, so we go from max to min
  return Math.round(range.maxProbability - progress * (range.maxProbability - range.minProbability));
}

/**
 * Calculate the probability (0-100) that a parking spot is still available
 */
export function calculateParkingProbability(availableSince: Date): number {
  const now = new Date();
  const minutesElapsed = (now.getTime() - availableSince.getTime()) / (1000 * 60);
  
  if (minutesElapsed < 0) return 100;
  
  const ranges = isPeakHours() ? PEAK_HOURS_RANGES : OFF_HOURS_RANGES;
  const maxMinutes = ranges[ranges.length - 1].maxMinutes;
  
  // If beyond all ranges, return minimum probability
  if (minutesElapsed >= maxMinutes) {
    return 5;
  }
  
  // Find the appropriate range and interpolate
  for (const range of ranges) {
    if (minutesElapsed >= range.minMinutes && minutesElapsed < range.maxMinutes) {
      return interpolateProbability(minutesElapsed, range);
    }
  }
  
  return 5;
}

export type ProbabilityLevel = 'veryHigh' | 'high' | 'medium' | 'low' | 'veryLow';

/**
 * Get the probability level based on the probability value
 */
export function getProbabilityLevel(probability: number): ProbabilityLevel {
  if (probability >= 90) return 'veryHigh';
  if (probability >= 70) return 'high';
  if (probability >= 50) return 'medium';
  if (probability >= 30) return 'low';
  return 'veryLow';
}

/**
 * Get a color for the probability value (HSL interpolation from red to green)
 */
export function getProbabilityColor(probability: number): string {
  // Clamp probability between 0 and 100
  const p = Math.max(0, Math.min(100, probability));
  // Hue: 0 (red) → 142 (green)
  const hue = Math.round((p / 100) * 142);
  return `hsl(${hue}, 76%, 42%)`;
}
