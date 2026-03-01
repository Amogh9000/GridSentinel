/**
 * Compute projected impact and confidence for simulation scenarios.
 * Purely derived logic — no mutation of alert data.
 */

export interface SimulationParams {
    deviationPercent: number;
    persistenceDays: number;
    affectedFeeders: number;
}

export interface SimulationProjection {
    projectedImpact: number;
    projectedConfidence: number;
    projectedEscalationHours: number;
    confidenceOverTime: { hour: number; confidence: number }[];
}

const BASE_IMPACT = 25000; // ₹ baseline for single feeder, 1 day
const HOURS_PER_DAY = 24;

/**
 * projectedImpact = baseImpact * (1 + deviationPercent/100) * persistenceDays * affectedFeeders
 */
export function computeProjection(params: SimulationParams): SimulationProjection {
    const { deviationPercent, persistenceDays, affectedFeeders } = params;

    const projectedImpact =
        BASE_IMPACT *
        (1 + deviationPercent / 100) *
        Math.max(0.5, persistenceDays) *
        affectedFeeders;

    // projectedConfidence = min(100, baseConfidence + deviationPercent*0.8 + persistenceDays*4)
    // Values as 0-100 scale, then convert to 0-1
    const rawConfidence = 20 + deviationPercent * 0.8 + persistenceDays * 4;
    const projectedConfidence = Math.min(100, Math.max(0, rawConfidence)) / 100;

    // Escalation time: higher deviation + persistence = faster escalation
    const baseHours = 72;
    const reductionFactor = 1 - (deviationPercent / 100) * 0.3 - persistenceDays * 0.02;
    const projectedEscalationHours = Math.max(12, Math.round(baseHours * Math.max(0.3, reductionFactor)));

    // Confidence growth curve over 7 days (168 hours)
    const totalHours = 168;
    const confidenceOverTime: { hour: number; confidence: number }[] = [];
    for (let h = 0; h <= totalHours; h += 6) {
        const dayProgress = h / totalHours;
        const curve = Math.pow(dayProgress, 0.7); // Slightly front-loaded growth
        const conf = Math.min(1, 0.15 + curve * projectedConfidence * 1.1);
        confidenceOverTime.push({ hour: h, confidence: conf });
    }

    return {
        projectedImpact,
        projectedConfidence,
        projectedEscalationHours,
        confidenceOverTime,
    };
}
