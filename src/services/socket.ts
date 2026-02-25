import { useGridStore } from '../state/gridStore';
import { useUIStore } from '../state/uiStore';

// Simulated WebSocket feed — pushes feeder state updates every 5s
let intervalId: ReturnType<typeof setInterval> | null = null;

export function startWebSocket(): () => void {
    if (intervalId) return () => { };

    intervalId = setInterval(() => {
        const { feeders, updateFeeder } = useGridStore.getState();
        const { uiState } = useUIStore.getState();

        // Only drift state while monitoring or in suspicion mode
        if (uiState === 'investigation' || uiState === 'resolution' || uiState === 'boot') return;

        feeders.forEach((feeder) => {
            const healthDrift = (Math.random() - 0.5) * 0.02;
            const confDrift = (Math.random() - 0.5) * 0.015;

            const newHealth = Math.max(0, Math.min(1, feeder.health + healthDrift));
            const newConf = Math.max(0, Math.min(1, feeder.confidence + confDrift));

            let newStatus = feeder.status;
            if (newHealth < 0.35 && feeder.status === 'suspicious') {
                newStatus = 'anomaly';
            } else if (newHealth < 0.55 && feeder.status === 'normal') {
                if (Math.random() < 0.05) {
                    newStatus = 'suspicious';
                }
            }

            if (
                newHealth !== feeder.health ||
                newConf !== feeder.confidence ||
                newStatus !== feeder.status
            ) {
                updateFeeder(feeder.id, {
                    health: Math.round(newHealth * 1000) / 1000,
                    confidence: Math.round(newConf * 1000) / 1000,
                    status: newStatus,
                });
            }
        });
    }, 5000);

    return () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };
}
