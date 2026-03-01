import { useEffect, useRef, useMemo } from 'react';
import { useUIStore } from '../../state/uiStore';
import { useGridStore } from '../../state/gridStore';
import { computeProjection } from '../../utils/simulationProjection';
import gsap from 'gsap';
import './simulationPanel.css';

export default function SimulationPanel() {
    const panelRef = useRef<HTMLDivElement>(null);
    const simulationMode = useUIStore((s) => s.simulationMode);
    const deviationPercent = useUIStore((s) => s.deviationPercent);
    const persistenceDays = useUIStore((s) => s.persistenceDays);
    const affectedFeeders = useUIStore((s) => s.affectedFeeders);
    const setDeviationPercent = useUIStore((s) => s.setDeviationPercent);
    const setPersistenceDays = useUIStore((s) => s.setPersistenceDays);
    const setAffectedFeeders = useUIStore((s) => s.setAffectedFeeders);

    const feeders = useGridStore((s) => s.feeders);
    const maxFeeders = Math.max(1, feeders.length);

    const projection = useMemo(
        () => computeProjection({ deviationPercent, persistenceDays, affectedFeeders }),
        [deviationPercent, persistenceDays, affectedFeeders]
    );

    useEffect(() => {
        if (!panelRef.current) return;
        if (simulationMode) {
            gsap.fromTo(
                panelRef.current,
                { x: -280, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
            );
        } else {
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
                <span className="simulation-panel__title">Simulation Controls</span>
            </div>

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

            <div className="simulation-panel__preview">
                <span className="simulation-panel__preview-label">Preview</span>
                <span className="simulation-panel__preview-value">
                    ₹{Math.round(projection.projectedImpact).toLocaleString()} · {Math.round(projection.projectedConfidence * 100)}%
                </span>
            </div>

            <p className="simulation-panel__hint">
                Full projection in Evidence Panel when an alert is selected.
            </p>
        </div>
    );
}
