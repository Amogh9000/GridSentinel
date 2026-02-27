import { create } from 'zustand';

export type AlertResolution = 'active' | 'false_positive' | 'deferred' | 'escalated';

export interface AuditEntry {
    action: AlertResolution;
    timestamp: number;
    alertId: string;
    feederName: string;
}

export interface ConfidencePoint {
    hour: number;
    confidence: number;
    trigger: string;
}

export interface Alert {
    id: string;
    feederId: string;
    feederName: string;
    confidence: number;
    economicImpact: number;
    persistenceScore: number;
    actionPriorityScore: number;
    explanation: string[];
    timeWindow: { start: number; end: number };
    createdAt: number;
    resolution: AlertResolution;
    confidenceHistory: ConfidencePoint[];
    comparativeContext: {
        feedersAnalyzed: number;
        similarProfiles: number;
        flaggedByAI: number;
        uniquenessScore: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    projectedImpact: {
        monthlyLoss: string;
        patternPersistence: 'LOW' | 'MEDIUM' | 'HIGH';
        riskOfSpread: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    projectedSlope?: number;
    estimatedTimeToThreshold?: number | null;
    isEscalating?: boolean;
}

interface AlertState {
    alerts: Alert[];
    activeAlertId: string | null;
    auditTrail: AuditEntry[];
    setAlerts: (alerts: Alert[]) => void;
    addAlert: (alert: Alert) => void;
    setActiveAlert: (id: string | null) => void;
    resolveAlert: (id: string, resolution: AlertResolution) => void;
    evaluateEscalation: (id: string) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
    alerts: [],
    activeAlertId: null,
    auditTrail: [],

    setAlerts: (alerts: Alert[]) =>
        set({
            alerts: [...alerts].sort(
                (a: Alert, b: Alert) => b.actionPriorityScore - a.actionPriorityScore
            ),
        }),

    addAlert: (alert: Alert) =>
        set((state: AlertState) => ({
            alerts: [...state.alerts, alert].sort(
                (a: Alert, b: Alert) => b.actionPriorityScore - a.actionPriorityScore
            ),
        })),

    setActiveAlert: (id: string | null) => set({ activeAlertId: id }),

    resolveAlert: (id: string, resolution: AlertResolution) =>
        set((state: AlertState) => {
            const alert = state.alerts.find((a: Alert) => a.id === id);
            const entry: AuditEntry = {
                action: resolution,
                timestamp: Date.now(),
                alertId: id,
                feederName: alert?.feederName ?? 'Unknown',
            };
            return {
                alerts: state.alerts.map((a: Alert) =>
                    a.id === id ? { ...a, resolution } : a
                ),
                auditTrail: [...state.auditTrail, entry],
                activeAlertId: null,
            };
        }),

    evaluateEscalation: (id: string) => {
        const state = get();
        const alert = state.alerts.find((a: Alert) => a.id === id);
        if (!alert || alert.confidenceHistory.length < 2) return;

        // Convert the confidence history into TelemetryPoints for the forecast utility
        // Assuming 'hour' is the time unit we're using
        const windowData = alert.confidenceHistory.map((point: ConfidencePoint) => ({
            time: point.hour,
            confidence: point.confidence,
        }));

        import('../utils/forecast').then(({ calculateForecastETA }) => {
            const currentTime = alert.confidenceHistory[alert.confidenceHistory.length - 1].hour;
            const threshold = 0.90; // Ex: 90% confidence threshold

            const forecast = calculateForecastETA(windowData, threshold, currentTime);

            set((s: AlertState) => ({
                alerts: s.alerts.map((a: Alert) => {
                    if (a.id === id) {
                        return {
                            ...a,
                            projectedSlope: forecast?.m ?? 0,
                            estimatedTimeToThreshold: forecast?.timeRemaining ?? null,
                            isEscalating: (forecast?.m ?? 0) > 0,
                        };
                    }
                    return a;
                }),
            }));
        });
    },
}));

