import { create } from 'zustand';

export type UIState = 'boot' | 'monitoring' | 'suspicion' | 'investigation' | 'resolution';
export type AppMode = 'idle' | 'loading' | 'live' | 'replay' | 'simulation';
export type ViewMode = '2D' | '3D';

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
    cameraZoom: number;

    // App mode & view
    appMode: AppMode;
    viewMode: ViewMode;
    coreReady: boolean;
    isSidePanelOpen: boolean;

    // Replay
    replayMode: boolean;
    replayProgress: number;

    // Heatmap & Simulation toggles
    heatmapMode: boolean;
    simulationMode: boolean;

    // Simulation parameters
    deviationPercent: number;
    persistenceDays: number;
    affectedFeeders: number;

    // Actions
    setUIState: (state: UIState) => void;
    setFocusedFeeder: (id: string | null) => void;
    setTimePosition: (hour: number) => void;
    storeCameraPosition: (pos: CameraSnapshot) => void;
    setCameraZoom: (zoom: number) => void;
    setBootComplete: () => void;
    enterInvestigation: (feederId: string) => void;
    exitInvestigation: () => void;
    showGeoContext: () => void;
    hideGeoContext: () => void;

    // App mode & view actions
    setAppMode: (mode: AppMode) => void;
    setViewMode: (mode: ViewMode) => void;
    setCoreReady: (ready: boolean) => void;
    toggleSidePanel: () => void;

    // Replay actions
    startReplay: () => void;
    stopReplay: () => void;
    setReplayProgress: (progress: number) => void;

    // Toggle actions
    toggleHeatmap: () => void;
    toggleSimulation: () => void;

    // Simulation parameter actions
    setDeviationPercent: (val: number) => void;
    setPersistenceDays: (val: number) => void;
    setAffectedFeeders: (val: number) => void;
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
    cameraZoom: 1.0,

    // App mode & view defaults
    appMode: 'live',
    viewMode: '3D',
    coreReady: true,
    isSidePanelOpen: false,

    // Replay defaults
    replayMode: false,
    replayProgress: 0,

    // Toggle defaults
    heatmapMode: false,
    simulationMode: false,

    // Simulation parameter defaults
    deviationPercent: 10,
    persistenceDays: 3,
    affectedFeeders: 2,

    // --- Actions ---

    setUIState: (uiState) =>
        set({
            uiState,
            animationSpeed: STATE_CONFIG[uiState].animationSpeed,
            saturation: STATE_CONFIG[uiState].saturation,
        }),

    setFocusedFeeder: (id) => set({ focusedFeederId: id }),
    setTimePosition: (hour) => set({ timePosition: Math.max(0, Math.min(167, hour)) }),
    storeCameraPosition: (pos) => set({ storedCameraPosition: pos }),
    setCameraZoom: (zoom) => set({ cameraZoom: Math.max(0.4, Math.min(4.0, zoom)) }),

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

    // App mode & view actions
    setAppMode: (appMode) => set({ appMode }),
    setViewMode: (viewMode) => set({ viewMode }),
    setCoreReady: (coreReady) => set({ coreReady }),
    toggleSidePanel: () => set((state) => ({ isSidePanelOpen: !state.isSidePanelOpen })),

    // Replay actions
    startReplay: () => set({ replayMode: true, replayProgress: 0, appMode: 'replay' }),
    stopReplay: () => set({ replayMode: false, replayProgress: 0, appMode: 'live' }),
    setReplayProgress: (replayProgress) => set({ replayProgress }),

    // Toggle actions
    toggleHeatmap: () => set((state) => ({ heatmapMode: !state.heatmapMode })),
    toggleSimulation: () =>
        set((state) => ({
            simulationMode: !state.simulationMode,
            appMode: !state.simulationMode ? 'simulation' : 'live',
        })),

    // Simulation parameter actions
    setDeviationPercent: (deviationPercent) => set({ deviationPercent }),
    setPersistenceDays: (persistenceDays) => set({ persistenceDays }),
    setAffectedFeeders: (affectedFeeders) => set({ affectedFeeders }),
}));
