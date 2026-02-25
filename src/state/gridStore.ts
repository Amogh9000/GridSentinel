import { create } from 'zustand';

export type FeederStatus = 'normal' | 'suspicious' | 'anomaly';

export interface Feeder {
    id: string;
    name: string;
    health: number;       // 0–1
    confidence: number;   // 0–1
    status: FeederStatus;
    position: { x: number; y: number; z: number };
    connections: string[]; // IDs of connected feeders
    temporalMemory: number; // days of anomalous behavior
}

interface GridState {
    feeders: Feeder[];
    setFeeders: (feeders: Feeder[]) => void;
    updateFeeder: (id: string, partial: Partial<Feeder>) => void;
}

export const useGridStore = create<GridState>((set) => ({
    feeders: [],
    setFeeders: (feeders) => set({ feeders }),
    updateFeeder: (id, partial) =>
        set((state) => ({
            feeders: state.feeders.map((f) =>
                f.id === id ? { ...f, ...partial } : f
            ),
        })),
}));
