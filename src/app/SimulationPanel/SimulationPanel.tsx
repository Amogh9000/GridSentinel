import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '../../state/uiStore';
import { useGridStore } from '../../state/gridStore';
import { useWorker } from '../../hooks/useWorker';
import gsap from 'gsap';
import './simulationPanel.css';

export default function SimulationPanel() {
    const panelRef = useRef<HTMLDivElement>(null);
    const appMode = useUIStore((s) => s.appMode);
    const simulationMode = appMode === 'simulation';
    const deviationPercent = useUIStore((s) => s.deviationPercent);
    const persistenceDays = useUIStore((s) => s.persistenceDays);
    const affectedFeeders = useUIStore((s) => s.affectedFeeders);
    const setDeviationPercent = useUIStore((s) => s.setDeviationPercent);
    const setPersistenceDays = useUIStore((s) => s.setPersistenceDays);
    const setAffectedFeeders = useUIStore((s) => s.setAffectedFeeders);

    const feeders = useGridStore((s) => s.feeders);
    const maxFeeders = Math.max(1, feeders.length);

    const { result, postMessage } = useWorker('../workers/simulation.worker.ts');
    const [projection, setProjection] = useState<{ projectedImpact: number; projectedConfidence: number } | null>(null);

    useEffect(() => {
        postMessage({
            type: 'GET_PROJECTION',
            data: { deviationPercent, persistenceDays, affectedFeeders }
        });
    }, [deviationPercent, persistenceDays, affectedFeeders, postMessage]);

    useEffect(() => {
        if (result?.type === 'PROJECTION_RESULT') {
            setProjection(result.data);
        }
    }, [result]);

    useEffect(() => {
        if (!panelRef.current) return;
        if (simulationMode) {
            console.debug('sidebar:open', 'simulation');
            gsap.fromTo(
                panelRef.current,
                { x: -280, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
            );
        } else {
            console.debug('sidebar:close', 'simulation');
            gsap.to(panelRef.current, {
                x: -280,
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in',
            });
        }
    }, [simulationMode]);

    if (!simulationMode) return null;

    return (
        <div ref={panelRef} className="simulation-panel">
            <div className="simulation-panel__header">
                <div className="simulation-panel__badge">SIMULATION ACTIVE</div>
                <h3>Hypothetical Scenario</h3>
            </div>
            <p className="simulation-panel__desc">
                Projecting grid behavior under synthetic stress conditions.
            </p>

            <div className="simulation-panel__sliders">
                <div className="simulation-panel__slider">
                    <label className="simulation-panel__label">
                        Load Deviation %
                        <span className="simulation-panel__value">{deviationPercent}%</span>
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={50}
                        value={deviationPercent}
                        onChange={(e) => setDeviationPercent(Number(e.target.value))}
                        className="simulation-panel__input"
                    />
                </div>

                <div className="simulation-panel__slider">
                    <label className="simulation-panel__label">
                        Persistence (Days)
                        <span className="simulation-panel__value">{persistenceDays}</span>
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={14}
                        value={persistenceDays}
                        onChange={(e) => setPersistenceDays(Number(e.target.value))}
                        className="simulation-panel__input"
                    />
                </div>

                <div className="simulation-panel__slider">
                    <label className="simulation-panel__label">
                        Affected Feeders
                        <span className="simulation-panel__value">{affectedFeeders}</span>
                    </label>
                    <input
                        type="range"
                        min={1}
                        max={maxFeeders}
                        value={affectedFeeders}
                        onChange={(e) => setAffectedFeeders(Number(e.target.value))}
                        className="simulation-panel__input"
                    />
                </div>
            </div>

            <div className="simulation-panel__outcome">
                <span className="simulation-panel__outcome-title">PROJECTED OUTCOME</span>
                {projection ? (
                    <div className="simulation-panel__outcome-grid">
                        <div className="simulation-panel__outcome-item">
                            <span className="simulation-panel__outcome-label">Economic Impact</span>
                            <span className="simulation-panel__outcome-value simulation-panel__outcome-value--impact">
                                ₹{Math.round(projection.projectedImpact).toLocaleString()}
                            </span>
                        </div>
                        <div className="simulation-panel__outcome-item">
                            <span className="simulation-panel__outcome-label">AI Confidence</span>
                            <span className="simulation-panel__outcome-value">
                                {Math.round(projection.projectedConfidence * 100)}%
                            </span>
                        </div>
                        <div className="simulation-panel__outcome-item simulation-panel__outcome-item--full">
                            <span className="simulation-panel__outcome-label">Escalation Risk</span>
                            <div className="simulation-panel__risk-bar">
                                <div
                                    className="simulation-panel__risk-fill"
                                    style={{
                                        width: `${Math.min(100, projection.projectedConfidence * 120)}%`,
                                        background: projection.projectedConfidence > 0.8 ? '#dc2626'
                                            : projection.projectedConfidence > 0.5 ? '#f59e0b' : '#22c55e',
                                    }}
                                />
                            </div>
                            <span className="simulation-panel__risk-verdict" data-severity={
                                projection.projectedConfidence > 0.8 ? 'critical'
                                    : projection.projectedConfidence > 0.5 ? 'warning' : 'stable'
                            }>
                                {projection.projectedConfidence > 0.8 ? '⚠ CRITICAL — Immediate escalation likely'
                                    : projection.projectedConfidence > 0.5 ? '⚡ WARNING — Monitor closely'
                                        : '✓ STABLE — Within normal parameters'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <span className="simulation-panel__outcome-loading">Calculating projection…</span>
                )}
            </div>

            <p className="simulation-panel__hint">
                Adjust sliders to model hypothetical grid stress scenarios.
            </p>
        </div>
    );
}
