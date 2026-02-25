import type { Feeder } from '../state/gridStore';
import type { Alert } from '../state/alertStore';

// ─── 12 feeders arranged in a grid-like topology ────────────────────
export const MOCK_FEEDERS: Feeder[] = [
    { id: 'F01', name: 'Sector-7 Main', health: 0.95, confidence: 0.92, status: 'normal', position: { x: -4, y: 0, z: -3 }, connections: ['F02', 'F04'], temporalMemory: 0 },
    { id: 'F02', name: 'Sector-7 Branch A', health: 0.88, confidence: 0.85, status: 'normal', position: { x: -2, y: 0, z: -3 }, connections: ['F01', 'F03', 'F05'], temporalMemory: 0 },
    { id: 'F03', name: 'Sector-7 Branch B', health: 0.42, confidence: 0.67, status: 'suspicious', position: { x: 0, y: 0, z: -3 }, connections: ['F02', 'F06'], temporalMemory: 2 },
    { id: 'F04', name: 'Sector-12 Main', health: 0.91, confidence: 0.90, status: 'normal', position: { x: -4, y: 0, z: 0 }, connections: ['F01', 'F05', 'F07'], temporalMemory: 0 },
    { id: 'F05', name: 'Sector-12 Branch', health: 0.78, confidence: 0.80, status: 'normal', position: { x: -2, y: 0, z: 0 }, connections: ['F02', 'F04', 'F06', 'F08'], temporalMemory: 0 },
    { id: 'F06', name: 'Sector-12 End', health: 0.22, confidence: 0.88, status: 'anomaly', position: { x: 0, y: 0, z: 0 }, connections: ['F03', 'F05', 'F09'], temporalMemory: 5 },
    { id: 'F07', name: 'Sector-19 Main', health: 0.93, confidence: 0.91, status: 'normal', position: { x: -4, y: 0, z: 3 }, connections: ['F04', 'F08'], temporalMemory: 0 },
    { id: 'F08', name: 'Sector-19 Branch', health: 0.85, confidence: 0.83, status: 'normal', position: { x: -2, y: 0, z: 3 }, connections: ['F05', 'F07', 'F09'], temporalMemory: 0 },
    { id: 'F09', name: 'Sector-19 End', health: 0.55, confidence: 0.72, status: 'suspicious', position: { x: 0, y: 0, z: 3 }, connections: ['F06', 'F08', 'F10'], temporalMemory: 1 },
    { id: 'F10', name: 'Industrial Zone A', health: 0.90, confidence: 0.89, status: 'normal', position: { x: 3, y: 0, z: -2 }, connections: ['F09', 'F11'], temporalMemory: 0 },
    { id: 'F11', name: 'Industrial Zone B', health: 0.87, confidence: 0.86, status: 'normal', position: { x: 3, y: 0, z: 1 }, connections: ['F10', 'F12'], temporalMemory: 0 },
    { id: 'F12', name: 'Industrial Zone C', health: 0.60, confidence: 0.74, status: 'suspicious', position: { x: 3, y: 0, z: 3 }, connections: ['F11'], temporalMemory: 3 },
];

// ─── 5 alerts with full evidence data ───────────────────────────────
export const MOCK_ALERTS: Alert[] = [
    {
        id: 'A001',
        feederId: 'F06',
        feederName: 'Sector-12 End',
        confidence: 0.92,
        economicImpact: 47500,
        persistenceScore: 0.88,
        actionPriorityScore: 0.92 * 0.88 * 0.95,
        explanation: [
            'Feeder draw exceeded billed load by 17–22% consistently',
            'Pattern repeated across 3 consecutive nights (02:00–05:00)',
            'Neighbor feeders (Sector-12 Branch, Sector-19 End) remained stable',
            'Tamper signal detected twice in the anomaly window',
            'Model confidence: 92% — high persistence, low noise',
        ],
        timeWindow: { start: 120, end: 155 },
        createdAt: Date.now() - 3600000,
        resolution: 'active',
        confidenceHistory: [
            { hour: 120, confidence: 0.31, trigger: 'Initial load variance detected' },
            { hour: 126, confidence: 0.45, trigger: 'Second night pattern match' },
            { hour: 132, confidence: 0.61, trigger: 'Neighbor stability confirmed' },
            { hour: 138, confidence: 0.74, trigger: 'Tamper signal correlation' },
            { hour: 144, confidence: 0.85, trigger: 'Third consecutive night' },
            { hour: 150, confidence: 0.89, trigger: 'Revenue gap cross-reference' },
            { hour: 155, confidence: 0.92, trigger: 'Full pattern persistence validated' },
        ],
        comparativeContext: {
            feedersAnalyzed: 14,
            similarProfiles: 5,
            flaggedByAI: 1,
            uniquenessScore: 'HIGH',
        },
        projectedImpact: {
            monthlyLoss: '₹1.4L',
            patternPersistence: 'HIGH',
            riskOfSpread: 'MEDIUM',
        },
    },
    {
        id: 'A002',
        feederId: 'F03',
        feederName: 'Sector-7 Branch B',
        confidence: 0.78,
        economicImpact: 23000,
        persistenceScore: 0.65,
        actionPriorityScore: 0.78 * 0.65 * 0.75,
        explanation: [
            'Intermittent load spikes during off-peak hours (22:00–01:00)',
            'Feeder draw 12–15% above expected baseline',
            'Weak correlation with neighboring feeders suggests local issue',
            'No tamper signal — possible metering drift or unauthorized load',
        ],
        timeWindow: { start: 90, end: 120 },
        createdAt: Date.now() - 7200000,
        resolution: 'active',
        confidenceHistory: [
            { hour: 90, confidence: 0.22, trigger: 'First off-peak spike' },
            { hour: 98, confidence: 0.41, trigger: 'Recurring spike pattern' },
            { hour: 106, confidence: 0.58, trigger: 'Baseline deviation confirmed' },
            { hour: 114, confidence: 0.71, trigger: 'Neighbor isolation verified' },
            { hour: 120, confidence: 0.78, trigger: 'Persistence threshold crossed' },
        ],
        comparativeContext: {
            feedersAnalyzed: 14,
            similarProfiles: 3,
            flaggedByAI: 1,
            uniquenessScore: 'MEDIUM',
        },
        projectedImpact: {
            monthlyLoss: '₹69K',
            patternPersistence: 'MEDIUM',
            riskOfSpread: 'LOW',
        },
    },
    {
        id: 'A003',
        feederId: 'F12',
        feederName: 'Industrial Zone C',
        confidence: 0.71,
        economicImpact: 31000,
        persistenceScore: 0.72,
        actionPriorityScore: 0.71 * 0.72 * 0.80,
        explanation: [
            'Load factor anomaly — draw increasing while production hours decrease',
            'Weekend energy consumption 40% higher than weekday pattern',
            'Potential unauthorized industrial equipment operation',
            'Cross-referencing with utility billing shows 18% revenue gap',
        ],
        timeWindow: { start: 140, end: 167 },
        createdAt: Date.now() - 1800000,
        resolution: 'active',
        confidenceHistory: [
            { hour: 140, confidence: 0.28, trigger: 'Load factor shift detected' },
            { hour: 148, confidence: 0.45, trigger: 'Weekend anomaly confirmed' },
            { hour: 156, confidence: 0.59, trigger: 'Production hour mismatch' },
            { hour: 164, confidence: 0.71, trigger: 'Revenue gap validated' },
        ],
        comparativeContext: {
            feedersAnalyzed: 14,
            similarProfiles: 4,
            flaggedByAI: 1,
            uniquenessScore: 'HIGH',
        },
        projectedImpact: {
            monthlyLoss: '₹93K',
            patternPersistence: 'HIGH',
            riskOfSpread: 'MEDIUM',
        },
    },
    {
        id: 'A004',
        feederId: 'F09',
        feederName: 'Sector-19 End',
        confidence: 0.55,
        economicImpact: 12000,
        persistenceScore: 0.40,
        actionPriorityScore: 0.55 * 0.40 * 0.50,
        explanation: [
            'Mild load elevation detected during evening hours',
            'Pattern is inconsistent — may be seasonal demand shift',
            'Monitoring recommended before field investigation',
        ],
        timeWindow: { start: 100, end: 130 },
        createdAt: Date.now() - 10800000,
        resolution: 'active',
        confidenceHistory: [
            { hour: 100, confidence: 0.18, trigger: 'Evening elevation flagged' },
            { hour: 110, confidence: 0.35, trigger: 'Multi-day observation' },
            { hour: 120, confidence: 0.48, trigger: 'Seasonal model ruling out' },
            { hour: 130, confidence: 0.55, trigger: 'Weak persistence signal' },
        ],
        comparativeContext: {
            feedersAnalyzed: 14,
            similarProfiles: 6,
            flaggedByAI: 1,
            uniquenessScore: 'LOW',
        },
        projectedImpact: {
            monthlyLoss: '₹36K',
            patternPersistence: 'LOW',
            riskOfSpread: 'LOW',
        },
    },
    {
        id: 'A005',
        feederId: 'F05',
        feederName: 'Sector-12 Branch',
        confidence: 0.35,
        economicImpact: 5000,
        persistenceScore: 0.20,
        actionPriorityScore: 0.35 * 0.20 * 0.30,
        explanation: [
            'Minor variance detected in late-night readings',
            'Likely within normal noise range — low confidence',
            'Flagged for completeness; no action recommended',
        ],
        timeWindow: { start: 50, end: 70 },
        createdAt: Date.now() - 14400000,
        resolution: 'active',
        confidenceHistory: [
            { hour: 50, confidence: 0.12, trigger: 'Noise-level variance' },
            { hour: 60, confidence: 0.25, trigger: 'Mild persistence' },
            { hour: 70, confidence: 0.35, trigger: 'Threshold not met — flagged' },
        ],
        comparativeContext: {
            feedersAnalyzed: 14,
            similarProfiles: 8,
            flaggedByAI: 1,
            uniquenessScore: 'LOW',
        },
        projectedImpact: {
            monthlyLoss: '₹15K',
            patternPersistence: 'LOW',
            riskOfSpread: 'LOW',
        },
    },
];

// ─── Time-series data (168 hours = 7 days) ──────────────────────────
function generateTimeSeries(
    baseLoad: number,
    anomalyStart: number,
    anomalyEnd: number,
    anomalyMultiplier: number
) {
    const feederDraw: number[] = [];
    const billedLoad: number[] = [];
    const residual: number[] = [];

    for (let h = 0; h < 168; h++) {
        const hourOfDay = h % 24;
        const dailyCycle =
            0.6 +
            0.4 * Math.sin(((hourOfDay - 6) / 24) * Math.PI * 2) +
            (hourOfDay >= 18 && hourOfDay <= 22 ? 0.15 : 0);

        const billed = baseLoad * dailyCycle + (Math.random() - 0.5) * baseLoad * 0.03;

        let draw = billed + (Math.random() - 0.5) * baseLoad * 0.04;
        if (h >= anomalyStart && h <= anomalyEnd) {
            const hourInAnomaly = h - anomalyStart;
            const ramp = Math.min(1, hourInAnomaly / 5);
            draw = billed * (1 + anomalyMultiplier * ramp) + (Math.random() - 0.5) * baseLoad * 0.02;
        }

        feederDraw.push(Math.round(draw * 100) / 100);
        billedLoad.push(Math.round(billed * 100) / 100);
        residual.push(Math.round((draw - billed) * 100) / 100);
    }

    return { feederDraw, billedLoad, residual };
}

export const TIMESERIES_DATA: Record<string, ReturnType<typeof generateTimeSeries>> = {
    F06: generateTimeSeries(450, 120, 155, 0.20),
    F03: generateTimeSeries(320, 90, 120, 0.14),
    F12: generateTimeSeries(580, 140, 167, 0.18),
    F09: generateTimeSeries(280, 100, 130, 0.08),
    F05: generateTimeSeries(400, 50, 70, 0.05),
};

// ─── Anomaly bands for timeline ─────────────────────────────────────
export interface AnomalyBand {
    feederId: string;
    start: number;
    end: number;
    severity: 'low' | 'medium' | 'high';
}

export const ANOMALY_BANDS: AnomalyBand[] = [
    { feederId: 'F06', start: 120, end: 155, severity: 'high' },
    { feederId: 'F03', start: 90, end: 120, severity: 'medium' },
    { feederId: 'F12', start: 140, end: 167, severity: 'medium' },
    { feederId: 'F09', start: 100, end: 130, severity: 'low' },
    { feederId: 'F05', start: 50, end: 70, severity: 'low' },
];

// ─── System health data ─────────────────────────────────────────────
export const SYSTEM_HEALTH = {
    edgeNodes: [
        { id: 'EN-01', status: 'online' as const, lastPing: Date.now() - 5000 },
        { id: 'EN-02', status: 'online' as const, lastPing: Date.now() - 8000 },
        { id: 'EN-03', status: 'degraded' as const, lastPing: Date.now() - 45000 },
        { id: 'EN-04', status: 'online' as const, lastPing: Date.now() - 3000 },
    ],
    lastInferenceTime: Date.now() - 12000,
    dataFreshness: 0.97,
};
