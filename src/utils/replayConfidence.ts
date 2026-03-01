import type { ConfidencePoint } from '../state/alertStore';



/**
 * Interpolate confidence at a given time from confidenceHistory (by hour).
 * Returns final confidence if time is past the last point, or first if before.
 */
export function interpolateConfidenceFromHistory(
    timePosition: number,
    confidenceHistory: ConfidencePoint[],
    finalConfidence: number
): number {
    if (!confidenceHistory.length) {
        return finalConfidence;
    }
    const sorted = [...confidenceHistory].sort((a, b) => a.hour - b.hour);
    if (timePosition <= sorted[0].hour) return sorted[0].confidence;
    if (timePosition >= sorted[sorted.length - 1].hour) return finalConfidence;

    let i = 0;
    while (i < sorted.length - 1 && sorted[i + 1].hour < timePosition) i++;
    const a = sorted[i];
    const b = sorted[i + 1];
    const t = (timePosition - a.hour) / (b.hour - a.hour);
    return a.confidence + t * (b.confidence - a.confidence);
}

/**
 * When replayMode is active: if confidenceHistory exists, use timePosition to interpolate;
 * otherwise simulate baseConfidence + (finalConfidence - baseConfidence) * replayProgress.
 */
export function getDisplayedConfidence(
    replayMode: boolean,
    replayProgress: number,
    timePosition: number,
    alert: { confidence: number; confidenceHistory: ConfidencePoint[] }
): number {
    if (!replayMode) return alert.confidence;

    const baseConfidence = 0.2;
    const finalConfidence = alert.confidence;

    if (alert.confidenceHistory?.length) {
        return interpolateConfidenceFromHistory(
            timePosition,
            alert.confidenceHistory,
            finalConfidence
        );
    }
    return baseConfidence + (finalConfidence - baseConfidence) * replayProgress;
}
