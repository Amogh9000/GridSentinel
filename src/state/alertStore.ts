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
}

interface AlertState {
    alerts: Alert[];
    activeAlertId: string | null;
    auditTrail: AuditEntry[];
    setAlerts: (alerts: Alert[]) => void;
    addAlert: (alert: Alert) => void;
    setActiveAlert: (id: string | null) => void;
    resolveAlert: (id: string, resolution: AlertResolution) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
    alerts: [],
    activeAlertId: null,
    auditTrail: [],

    setAlerts: (alerts) =>
        set({
            alerts: [...alerts].sort(
                (a, b) => b.actionPriorityScore - a.actionPriorityScore
            ),
        }),

    addAlert: (alert) =>
        set((state) => ({
            alerts: [...state.alerts, alert].sort(
                (a, b) => b.actionPriorityScore - a.actionPriorityScore
            ),
        })),

    setActiveAlert: (id) => set({ activeAlertId: id }),

    resolveAlert: (id, resolution) =>
        set((state) => {
            const alert = state.alerts.find((a) => a.id === id);
            const entry: AuditEntry = {
                action: resolution,
                timestamp: Date.now(),
                alertId: id,
                feederName: alert?.feederName ?? 'Unknown',
            };
            return {
                alerts: state.alerts.map((a) =>
                    a.id === id ? { ...a, resolution } : a
                ),
                auditTrail: [...state.auditTrail, entry],
                activeAlertId: null,
            };
        }),
}));
