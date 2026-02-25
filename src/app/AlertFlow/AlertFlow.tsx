import { useEffect, useRef, useState } from 'react';
import { useAlertStore, type Alert } from '../../state/alertStore';
import { useUIStore } from '../../state/uiStore';
import gsap from 'gsap';
import './alertFlow.css';

function AlertCard({ alert, isActive, isLocked }: { alert: Alert; isActive: boolean; isLocked: boolean }) {
    const setActiveAlert = useAlertStore((s) => s.setActiveAlert);
    const enterInvestigation = useUIStore((s) => s.enterInvestigation);

    const handleClick = () => {
        if (isLocked && !isActive) return;
        if (isActive) return; // exit is handled by InvestigationHeader
        setActiveAlert(alert.id);
        enterInvestigation(alert.feederId);
    };

    const confidencePercent = Math.round(alert.confidence * 100);
    const persistencePercent = Math.round(alert.persistenceScore * 100);
    const isResolved = alert.resolution !== 'active';

    return (
        <div
            className={`alert-card ${isActive ? 'alert-card--active' : ''} ${isLocked && !isActive ? 'alert-card--locked' : ''} ${isResolved ? 'alert-card--resolved' : ''}`}
            onClick={handleClick}
        >
            {isResolved && (
                <div className="alert-card__resolution-badge" data-resolution={alert.resolution}>
                    {alert.resolution === 'false_positive' ? 'FALSE POSITIVE' :
                        alert.resolution === 'deferred' ? 'DEFERRED 24H' : 'ESCALATED'}
                </div>
            )}

            <div className="alert-card__header">
                <div className="alert-card__priority-dot" style={{
                    background: isResolved ? '#4a5568' : alert.confidence > 0.8 ? '#c0392b' : alert.confidence > 0.6 ? '#d4a039' : '#4a5568'
                }} />
                <span className="alert-card__feeder-name">{alert.feederName}</span>
                <span className="alert-card__confidence">{confidencePercent}%</span>
            </div>

            <div className="alert-card__body">
                <div className="alert-card__metric">
                    <span className="alert-card__metric-label">Impact</span>
                    <span className="alert-card__metric-value">₹{alert.economicImpact.toLocaleString()}</span>
                </div>
                <div className="alert-card__metric">
                    <span className="alert-card__metric-label">Persistence</span>
                    <div className="alert-card__persistence-bar">
                        <div className="alert-card__persistence-fill" style={{ width: `${persistencePercent}%` }} />
                    </div>
                </div>
            </div>

            {isActive && (
                <div className="alert-card__explanation">
                    {alert.explanation.slice(0, 2).map((line, i) => (
                        <p key={i} className="alert-card__explanation-line">• {line}</p>
                    ))}
                    <p className="alert-card__more">See full evidence below ↓</p>
                </div>
            )}
        </div>
    );
}

function AuditTrail() {
    const auditTrail = useAlertStore((s) => s.auditTrail);

    if (auditTrail.length === 0) return null;

    return (
        <div className="audit-trail">
            <h3 className="audit-trail__title">AUDIT TRAIL</h3>
            {auditTrail.map((entry, i) => (
                <div key={i} className="audit-trail__entry">
                    <span className="audit-trail__action" data-resolution={entry.action}>
                        {entry.action === 'false_positive' ? 'FP' :
                            entry.action === 'deferred' ? 'DEF' : 'ESC'}
                    </span>
                    <span className="audit-trail__feeder">{entry.feederName}</span>
                    <span className="audit-trail__time">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function AlertFlow() {
    const containerRef = useRef<HTMLDivElement>(null);
    const alerts = useAlertStore((s) => s.alerts);
    const activeAlertId = useAlertStore((s) => s.activeAlertId);
    const uiState = useUIStore((s) => s.uiState);
    const bootComplete = useUIStore((s) => s.bootComplete);
    const isLocked = activeAlertId !== null;

    // Slide-in animation on boot complete
    useEffect(() => {
        if (!containerRef.current || !bootComplete) return;
        const cards = containerRef.current.querySelectorAll('.alert-card');
        gsap.fromTo(
            cards,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power2.out', delay: 0.3 }
        );
    }, [bootComplete]);

    const [suppressedExpanded, setSuppressedExpanded] = useState(false);

    const activeAlerts = alerts.filter(a => a.resolution === 'active' && a.confidence >= 0.4);
    const suppressedAlerts = alerts.filter(a => a.resolution === 'active' && a.confidence < 0.4);
    const resolvedAlerts = alerts.filter(a => a.resolution !== 'active');

    // Slide-in animation on boot complete
    useEffect(() => {
        if (!containerRef.current || !bootComplete) return;
        const cards = containerRef.current.querySelectorAll('.alert-card');
        gsap.fromTo(
            cards,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power2.out', delay: 0.3 }
        );
    }, [bootComplete]);

    return (
        <div className={`alert-flow ${!bootComplete ? 'alert-flow--hidden' : ''}`} ref={containerRef}>
            <div className="alert-flow__header">
                <h2 className="alert-flow__title">Action Queue</h2>
                <span className="alert-flow__state-badge" data-state={uiState}>{uiState}</span>
            </div>

            <div className="alert-flow__list">
                {activeAlerts.map((alert) => (
                    <AlertCard
                        key={alert.id}
                        alert={alert}
                        isActive={alert.id === activeAlertId}
                        isLocked={isLocked}
                    />
                ))}
            </div>

            {/* Suppressed (Low Confidence) alerts */}
            {suppressedAlerts.length > 0 && (
                <div className="alert-flow__suppressed">
                    <button
                        className="alert-flow__suppressed-toggle"
                        onClick={() => setSuppressedExpanded(!suppressedExpanded)}
                    >
                        <span>{suppressedExpanded ? '⊟' : '⊞'} Suppressed Signals ({suppressedAlerts.length})</span>
                    </button>

                    {suppressedExpanded && (
                        <div className="alert-flow__suppressed-list">
                            {suppressedAlerts.map((alert) => (
                                <AlertCard
                                    key={alert.id}
                                    alert={alert}
                                    isActive={alert.id === activeAlertId}
                                    isLocked={isLocked}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Resolved alerts */}
            {resolvedAlerts.length > 0 && (
                <div className="alert-flow__resolved-section">
                    <h3 className="alert-flow__resolved-title">Resolved</h3>
                    {resolvedAlerts.map((alert) => (
                        <AlertCard
                            key={alert.id}
                            alert={alert}
                            isActive={false}
                            isLocked={true}
                        />
                    ))}
                </div>
            )}

            <AuditTrail />

            {activeAlerts.length === 0 && suppressedAlerts.length === 0 && (
                <div className="alert-flow__empty">
                    <p>All alerts resolved. System nominal.</p>
                </div>
            )}
        </div>
    );
}
