import { useRef, useEffect, useState } from 'react';
import { useUIStore } from '../../state/uiStore';
import { useAlertStore, type AlertResolution } from '../../state/alertStore';
import { getDisplayedConfidence } from '../../utils/replayConfidence';
import { GEO_CONFIDENCE_THRESHOLD } from '../../data/geoData';
import gsap from 'gsap';
import './investigationHeader.css';

export default function InvestigationHeader() {
    const headerRef = useRef<HTMLDivElement>(null);
    const uiState = useUIStore((s) => s.uiState);
    const exitInvestigation = useUIStore((s) => s.exitInvestigation);
    const stopReplay = useUIStore((s) => s.stopReplay);
    const replayMode = useUIStore((s) => s.replayMode);
    const replayProgress = useUIStore((s) => s.replayProgress);
    const timePosition = useUIStore((s) => s.timePosition);
    const geoContextVisible = useUIStore((s) => s.geoContextVisible);
    const showGeoContext = useUIStore((s) => s.showGeoContext);
    const hideGeoContext = useUIStore((s) => s.hideGeoContext);
    const activeAlertId = useAlertStore((s) => s.activeAlertId);
    const alerts = useAlertStore((s) => s.alerts);
    const resolveAlert = useAlertStore((s) => s.resolveAlert);

    const [confirmingAction, setConfirmingAction] = useState<AlertResolution | null>(null);

    const activeAlert = alerts.find((a) => a.id === activeAlertId);
    const isVisible = uiState === 'investigation' && activeAlert;
    const displayedConfidence = activeAlert
        ? getDisplayedConfidence(replayMode, replayProgress, timePosition, activeAlert)
        : 0;

    // Slide in/out
    useEffect(() => {
        if (!headerRef.current) return;
        if (isVisible) {
            gsap.fromTo(headerRef.current,
                { y: -60, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
            );
        } else {
            gsap.to(headerRef.current, { y: -60, opacity: 0, duration: 0.4, ease: 'power2.in' });
            setConfirmingAction(null);
        }
    }, [isVisible]);

    const handleActionClick = (action: AlertResolution) => {
        if (confirmingAction === action) {
            // Second click: resolve
            if (!activeAlertId) return;
            resolveAlert(activeAlertId, action);
            setConfirmingAction(null);
            exitInvestigation();
        } else {
            // First click: prompt
            setConfirmingAction(action);
            // Auto-reset after 3s if no confirmation
            setTimeout(() => setConfirmingAction(prev => prev === action ? null : prev), 3000);
        }
    };

    const handleExit = () => {
        if (replayMode) stopReplay();
        useAlertStore.getState().setActiveAlert(null);
        exitInvestigation();
    };

    if (!activeAlert) return null;

    return (
        <div ref={headerRef} className="investigation-header" style={{ opacity: 0, transform: 'translateY(-60px)' }}>
            <div className="investigation-header__status">
                <div className="investigation-header__pulse" />
                <span className="investigation-header__label">INVESTIGATION ACTIVE</span>
            </div>

            <div className="investigation-header__info">
                <span className="investigation-header__feeder">{activeAlert.feederName}</span>
                <span className="investigation-header__separator">|</span>
                <span className="investigation-header__confidence">Confidence: {Math.round(displayedConfidence * 100)}%</span>
            </div>

            <div className="investigation-header__actions">
                <button
                    className={`investigation-header__action investigation-header__action--false ${confirmingAction === 'false_positive' ? 'investigation-header__action--confirming' : ''}`}
                    onClick={() => handleActionClick('false_positive')}
                >
                    {confirmingAction === 'false_positive' ? 'Confirm?' : '✕ False Positive'}
                </button>
                <button
                    className={`investigation-header__action investigation-header__action--defer ${confirmingAction === 'deferred' ? 'investigation-header__action--confirming' : ''}`}
                    onClick={() => handleActionClick('deferred')}
                >
                    {confirmingAction === 'deferred' ? 'Confirm?' : '◷ Defer 24h'}
                </button>
                <button
                    className={`investigation-header__action investigation-header__action--escalate ${confirmingAction === 'escalated' ? 'investigation-header__action--confirming' : ''}`}
                    onClick={() => handleActionClick('escalated')}
                >
                    {confirmingAction === 'escalated' ? 'CONFIRM?' : '⚡ Escalate'}
                </button>

                {activeAlert.confidence >= GEO_CONFIDENCE_THRESHOLD ? (
                    <>
                        <div className="investigation-header__divider" />
                        <button
                            className={`investigation-header__geo-btn ${geoContextVisible ? 'investigation-header__geo-btn--active' : ''}`}
                            onClick={() => geoContextVisible ? hideGeoContext() : showGeoContext()}
                        >
                            {geoContextVisible ? '⊟ Hide Geographic Context' : '⊞ View Geographic Context'}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="investigation-header__divider" />
                        <button className="investigation-header__geo-btn investigation-header__geo-btn--disabled" disabled>
                            ⊞ Map Unavailable (Low Confidence)
                        </button>
                    </>
                )}

                {replayMode && (
                    <>
                        <div className="investigation-header__divider" />
                        <button
                            type="button"
                            className="investigation-header__action investigation-header__action--replay"
                            onClick={stopReplay}
                        >
                            Stop Replay
                        </button>
                    </>
                )}

                <div className="investigation-header__divider" />
                <button
                    className="investigation-header__exit"
                    onClick={handleExit}
                >
                    Exit Investigation
                </button>
            </div>
        </div>
    );
}
