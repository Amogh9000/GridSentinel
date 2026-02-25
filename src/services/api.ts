import { MOCK_FEEDERS, MOCK_ALERTS, TIMESERIES_DATA, SYSTEM_HEALTH } from '../data/mockData';
import type { Feeder } from '../state/gridStore';
import type { Alert } from '../state/alertStore';

// Simulated API — returns mock data with a small delay to mimic network
function delay<T>(data: T, ms = 300): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export async function fetchInitialState(): Promise<{
    feeders: Feeder[];
    alerts: Alert[];
}> {
    return delay({ feeders: MOCK_FEEDERS, alerts: MOCK_ALERTS });
}

export async function getFeederTimeSeries(
    feederId: string
): Promise<{ feederDraw: number[]; billedLoad: number[]; residual: number[] } | null> {
    const data = TIMESERIES_DATA[feederId] ?? null;
    return delay(data);
}

export async function getSystemHealth() {
    return delay(SYSTEM_HEALTH);
}
