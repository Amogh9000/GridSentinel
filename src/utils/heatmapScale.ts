import * as d3 from 'd3';

/** Alert-like shape with economic impact for normalization */
export interface ImpactSource {
    economicImpact: number;
    resolution?: string;
}

/**
 * Get max economic impact from active alerts (resolution === 'active').
 * Returns 1 if no alerts to avoid division by zero.
 */
export function getMaxImpact(alerts: ImpactSource[]): number {
    const active = alerts.filter((a) => a.resolution === 'active');
    if (active.length === 0) return 1;
    const max = Math.max(...active.map((a) => a.economicImpact));
    return max > 0 ? max : 1;
}

/**
 * Normalize impact to [0, 1] using maxImpact.
 * Safe when maxImpact is 0 (returns 0).
 */
export function getNormalizedImpact(impact: number, maxImpact: number): number {
    if (maxImpact <= 0) return 0;
    return Math.min(1, Math.max(0, impact / maxImpact));
}

/**
 * D3 linear color scale for revenue risk:
 * 0 → green (low), 0.5 → yellow (medium), 1 → red (high).
 * Use with normalized impact (0–1).
 */
export const impactColorScale = d3
    .scaleLinear<string>()
    .domain([0, 0.5, 1])
    .range(['#2ecc71', '#f1c40f', '#e74c3c']);
