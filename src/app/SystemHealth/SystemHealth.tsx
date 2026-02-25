import { useEffect, useState } from 'react';
import { SYSTEM_HEALTH } from '../../data/mockData';
import './systemHealth.css';

export default function SystemHealth() {
    const [health] = useState(SYSTEM_HEALTH);
    const [now, setNow] = useState(Date.now());

    // Tick every second for relative times
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatAgo = (ts: number) => {
        const seconds = Math.floor((now - ts) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        return `${Math.floor(seconds / 60)}m ago`;
    };

    return (
        <div className="system-health">
            <div className="system-health__section">
                <span className="system-health__label">EDGE NODES</span>
                <div className="system-health__nodes">
                    {health.edgeNodes.map((node) => (
                        <div
                            key={node.id}
                            className={`system-health__node system-health__node--${node.status}`}
                            title={`${node.id}: ${node.status} (${formatAgo(node.lastPing)})`}
                        />
                    ))}
                </div>
            </div>

            <div className="system-health__divider" />

            <div className="system-health__section">
                <span className="system-health__label">LAST INFERENCE</span>
                <span className="system-health__value">{formatAgo(health.lastInferenceTime)}</span>
            </div>

            <div className="system-health__divider" />

            <div className="system-health__section">
                <span className="system-health__label">DATA FRESHNESS</span>
                <span className="system-health__value system-health__value--fresh">
                    {Math.round(health.dataFreshness * 100)}%
                </span>
            </div>

            <div className="system-health__spacer" />

            <div className="system-health__brand">
                <span className="system-health__brand-name">GRID</span>
                <span className="system-health__brand-accent">SENTINEL</span>
            </div>
        </div>
    );
}
