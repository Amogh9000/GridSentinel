import { create } from 'zustand';

export type UIState = 'boot' | 'monitoring' | 'suspicion' | 'investigation' | 'resolution';

interface CameraSnapshot {
    x: number;
    y: number;
    z: number;
}

interface UIStoreState {
    uiState: UIState;
    focusedFeederId: string | null;
    timePosition: number;
    animationSpeed: number;
    saturation: number;
    storedCameraPosition: CameraSnapshot | null;
    bootComplete: boolean;
    investigationFrozen: boolean;
    geoContextVisible: boolean;
    heatmapMode: boolean;
    replayMode: boolean;
    replayProgress: number;
    simulationMode: boolean;
    deviationPercent: number;
    persistenceDays: number;
    affectedFeeders: number;
    setUIState: (state: UIState) => void;
    toggleSimulation: () => void;
    setDeviationPercent: (n: number) => void;
    setPersistenceDays: (n: number) => void;
    setAffectedFeeders: (n: number) => void;
    toggleHeatmap: () => void;
    startReplay: () => void;
    stopReplay: () => void;
    setReplayProgress: (value: number) => void;
    setFocusedFeeder: (id: string | null) => void;
    setTimePosition: (hour: number) => void;
    storeCameraPosition: (pos: CameraSnapshot) => void;
    setBootComplete: () => void;
    enterInvestigation: (feederId: string) => void;
    exitInvestigation: () => void;
    showGeoContext: () => void;
    hideGeoContext: () => void;
}

const STATE_CONFIG: Record<UIState, { animationSpeed: number; saturation: number }> = {
    boot: { animationSpeed: 0.3, saturation: 0.2 },
    monitoring: { animationSpeed: 1.0, saturation: 0.6 },
    suspicion: { animationSpeed: 0.8, saturation: 0.75 },
    investigation: { animationSpeed: 0.5, saturation: 0.9 },
    resolution: { animationSpeed: 0.3, saturation: 1.0 },
};

export const useUIStore = create<UIStoreState>((set) => ({
    uiState: 'boot',
    focusedFeederId: null,
    timePosition: 167,
    animationSpeed: STATE_CONFIG.boot.animationSpeed,
    saturation: STATE_CONFIG.boot.saturation,
    storedCameraPosition: null,
    bootComplete: false,
    investigationFrozen: false,
    geoContextVisible: false,
    heatmapMode: false,
    replayMode: false,
    replayProgress: 0,
    simulationMode: false,
    deviationPercent: 10,
    persistenceDays: 3,
    affectedFeeders: 1,

    setUIState: (uiState) =>
        set({
            uiState,
            animationSpeed: STATE_CONFIG[uiState].animationSpeed,
            saturation: STATE_CONFIG[uiState].saturation,
        }),

    setFocusedFeeder: (id) => set({ focusedFeederId: id }),
    setTimePosition: (hour) => set({ timePosition: Math.max(0, Math.min(167, hour)) }),
    startReplay: () => set({ replayMode: true, replayProgress: 0 }),
    stopReplay: () =>
        set({
            replayMode: false,
            replayProgress: 0,
            timePosition: 167,
        }),
    setReplayProgress: (value) => set({ replayProgress: Math.max(0, Math.min(1, value)) }),
    storeCameraPosition: (pos) => set({ storedCameraPosition: pos }),

    setBootComplete: () =>
        set({
            bootComplete: true,
            uiState: 'monitoring',
            animationSpeed: STATE_CONFIG.monitoring.animationSpeed,
            saturation: STATE_CONFIG.monitoring.saturation,
        }),

    enterInvestigation: (feederId) =>
        set({
            uiState: 'investigation',
            focusedFeederId: feederId,
            investigationFrozen: true,
            animationSpeed: STATE_CONFIG.investigation.animationSpeed,
            saturation: STATE_CONFIG.investigation.saturation,
        }),

    exitInvestigation: () =>
        set({
            uiState: 'monitoring',
            focusedFeederId: null,
            investigationFrozen: false,
            geoContextVisible: false,
            animationSpeed: STATE_CONFIG.monitoring.animationSpeed,
            saturation: STATE_CONFIG.monitoring.saturation,
        }),

    showGeoContext: () =>
        set((state) => {
            if (state.uiState !== 'investigation') return state;
            return { geoContextVisible: true };
        }),

    hideGeoContext: () => set({ geoContextVisible: false }),

    toggleHeatmap: () =>
        set((state) => ({
            heatmapMode: !state.heatmapMode,
            ...(state.replayMode ? { replayMode: false, replayProgress: 0, timePosition: 167 } : {}),
        })),

    toggleSimulation: () => set((state) => ({ simulationMode: !state.simulationMode })),
    setDeviationPercent: (n) => set({ deviationPercent: Math.max(0, Math.min(50, n)) }),
    setPersistenceDays: (n) => set({ persistenceDays: Math.max(0, Math.min(14, n)) }),
    setAffectedFeeders: (n) => set({ affectedFeeders: Math.max(1, Math.min(20, n)) }),
}));
