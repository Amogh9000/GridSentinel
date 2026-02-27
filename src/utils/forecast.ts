export interface TelemetryPoint {
  time: number; // For instance, timestamp in defined units (milliseconds or seconds)
  confidence: number; // E.g., 0.0 to 100.0 (percentage)
}

/**
 * Calculates the Estimated Time of Arrival (ETA) to hit a specific threshold.
 * Uses a linear regression (least squares) approach to find the line of best fit.
 *
 * @param windowData - An array of recent data points evaluated (n points).
 * @param threshold - The target confidence threshold (e.g., 90%).
 * @param currentTime - The current time (t_current).
 * @returns The ETA (time remaining) or the critical time (timestamp), or null if not applicable.
 */
export function calculateForecastETA(
  windowData: TelemetryPoint[],
  threshold: number,
  currentTime: number
): { m: number; tCritical: number; timeRemaining: number } | null {
  const n = windowData.length;

  // If n < 2, return null (insufficient data)
  if (n < 2) {
    return null;
  }

  // Find the most recent confidence score
  const cCurrent = windowData[n - 1].confidence;

  // If C_current >= C_threshold, the alert is already critical. Return 0 for ETA.
  if (cCurrent >= threshold) {
    return {
      m: 0,
      tCritical: currentTime,
      timeRemaining: 0,
    };
  }

  // Calculate the Slope (m) using least squares formula
  // m = (n * sum(xy) - sum(x) * sum(y)) / (n * sum(x^2) - (sum(x))^2)
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = windowData[i].time;
    const y = windowData[i].confidence;

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;

  // If the denominator is 0, the line is perfectly vertical or all x are the same
  if (denominator === 0) {
    return null;
  }

  const m = (n * sumXY - sumX * sumY) / denominator;

  // Handle Edge Cases: If m <= 0, confidence is flat or dropping (no immediate escalation risk).
  // Return null for the ETA.
  if (m <= 0) {
    return null;
  }

  // Compute ETA (time remaining) and Critical Timestamp
  // t_critical = t_current + (C_threshold - C_current) / m
  const timeRemaining = (threshold - cCurrent) / m;
  const tCritical = currentTime + timeRemaining;

  return {
    m,
    tCritical,
    timeRemaining,
  };
}
