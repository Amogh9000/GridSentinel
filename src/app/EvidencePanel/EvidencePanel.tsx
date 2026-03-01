import { useEffect, useRef, useMemo, useState } from 'react';
import { useAlertStore, type ConfidencePoint, type Alert } from '../../state/alertStore';
import { useUIStore } from '../../state/uiStore';
import { getDisplayedConfidence } from '../../utils/replayConfidence';
import { computeProjection } from '../../utils/simulationProjection';
import { TIMESERIES_DATA } from '../../data/mockData';
import * as d3 from 'd3';
import gsap from 'gsap';
import FieldVerification from '../FieldVerification/FieldVerification';
import PredictionBox from './PredictionBox';
import './evidencePanel.css';

// ─── Time Series Chart (D3) ─────────────────────────────────────
function TimeSeriesChart({ feederId, timePosition }: { feederId: string; timePosition: number }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const data = TIMESERIES_DATA[feederId];

    useEffect(() => {
        if (!svgRef.current || !data) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const margin = { top: 12, right: 12, bottom: 24, left: 40 };
        const width = svgRef.current.clientWidth - margin.left - margin.right;
        const height = svgRef.current.clientHeight - margin.top - margin.bottom;
        if (width <= 0 || height <= 0) return;

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
        const x = d3.scaleLinear().domain([0, 167]).range([0, width]);
        const allValues = [...data.feederDraw, ...data.billedLoad];
        const y = d3.scaleLinear().domain([d3.min(allValues)! * 0.9, d3.max(allValues)! * 1.1]).range([height, 0]);

        // Grid
        g.append('g').selectAll('line').data(y.ticks(4)).join('line')
            .attr('x1', 0).attr('x2', width).attr('y1', d => y(d)).attr('y2', d => y(d))
            .attr('stroke', 'rgba(15, 23, 42, 0.04)').attr('stroke-dasharray', '2,4');

        // Anomaly window
        const alert = useAlertStore.getState().alerts.find(a => a.feederId === feederId);
        if (alert) {
            g.append('rect')
                .attr('x', x(alert.timeWindow.start)).attr('y', 0)
                .attr('width', x(alert.timeWindow.end) - x(alert.timeWindow.start)).attr('height', height)
                .attr('fill', 'rgba(212, 160, 57, 0.08)').attr('rx', 2);
        }

        // Lines
        const line = d3.line<number>().x((_, i) => x(i)).y(d => y(d)).curve(d3.curveMonotoneX);
        g.append('path').datum(data.billedLoad).attr('fill', 'none').attr('stroke', '#4a5568').attr('stroke-width', 1.5).attr('stroke-opacity', 0.6).attr('d', line);
        g.append('path').datum(data.feederDraw).attr('fill', 'none').attr('stroke', '#2980b9').attr('stroke-width', 2).attr('d', line);

        // Time marker
        g.append('line').attr('x1', x(timePosition)).attr('x2', x(timePosition)).attr('y1', 0).attr('y2', height)
            .attr('stroke', '#e0e0e0').attr('stroke-width', 1).attr('stroke-opacity', 0.3).attr('stroke-dasharray', '4,4');

        // Axes
        g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(7).tickFormat(d => `D${Math.floor(Number(d) / 24) + 1}`))
            .selectAll('text,line,path').attr('stroke', 'none').attr('fill', '#64748b').attr('font-family', 'var(--font-mono)').attr('font-size', '9px');
        g.append('g').call(d3.axisLeft(y).ticks(4).tickFormat(d => `${d}`))
            .selectAll('text,line,path').attr('stroke', 'none').attr('fill', '#64748b').attr('font-family', 'var(--font-mono)').attr('font-size', '9px');

        // Legend
        const legend = g.append('g').attr('transform', `translate(${width - 140}, -2)`);
        legend.append('line').attr('x1', 0).attr('x2', 14).attr('y1', 0).attr('y2', 0).attr('stroke', '#2563eb').attr('stroke-width', 2);
        legend.append('text').attr('x', 18).attr('y', 3).text('Feeder Draw').attr('fill', '#475569').attr('font-size', '9px').attr('font-family', 'var(--font-sans)');
        legend.append('line').attr('x1', 90).attr('x2', 104).attr('y1', 0).attr('y2', 0).attr('stroke', '#94a3b8').attr('stroke-width', 1.5);
        legend.append('text').attr('x', 108).attr('y', 3).text('Billed').attr('fill', '#475569').attr('font-size', '9px').attr('font-family', 'var(--font-sans)');
    }, [feederId, data, timePosition]);

    return <svg ref={svgRef} className="evidence-chart" />;
}

// ─── Residual Chart (D3) ─────────────────────────────────────────
function ResidualChart({ feederId, timePosition }: { feederId: string; timePosition: number }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const data = TIMESERIES_DATA[feederId];

    useEffect(() => {
        if (!svgRef.current || !data) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const margin = { top: 12, right: 12, bottom: 24, left: 40 };
        const width = svgRef.current.clientWidth - margin.left - margin.right;
        const height = svgRef.current.clientHeight - margin.top - margin.bottom;
        if (width <= 0 || height <= 0) return;

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
        const x = d3.scaleLinear().domain([0, 167]).range([0, width]);
        const maxAbs = d3.max(data.residual.map(Math.abs))! * 1.2;
        const y = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([height, 0]);

        g.append('line').attr('x1', 0).attr('x2', width).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', 'rgba(255,255,255,0.1)');
        const threshold = maxAbs * 0.5;
        [threshold, -threshold].forEach(t => {
            g.append('line').attr('x1', 0).attr('x2', width).attr('y1', y(t)).attr('y2', y(t))
                .attr('stroke', 'rgba(192,57,43,0.3)').attr('stroke-dasharray', '4,4');
        });

        const barWidth = Math.max(1, width / 168 - 0.5);
        g.selectAll('.bar').data(data.residual).join('rect')
            .attr('x', (_, i) => x(i) - barWidth / 2)
            .attr('y', d => d > 0 ? y(d) : y(0))
            .attr('width', barWidth)
            .attr('height', d => Math.abs(y(d) - y(0)))
            .attr('fill', d => d > threshold ? '#c0392b' : d > 0 ? 'rgba(41,128,185,0.5)' : 'rgba(74,85,104,0.4)')
            .attr('rx', 0.5);

        g.append('line').attr('x1', x(timePosition)).attr('x2', x(timePosition)).attr('y1', 0).attr('y2', height)
            .attr('stroke', '#e0e0e0').attr('stroke-width', 1).attr('stroke-opacity', 0.3).attr('stroke-dasharray', '4,4');

        g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x).ticks(7).tickFormat(d => `D${Math.floor(Number(d) / 24) + 1}`))
            .selectAll('text,line,path').attr('stroke', 'none').attr('fill', '#64748b').attr('font-family', 'var(--font-mono)').attr('font-size', '9px');
        g.append('g').call(d3.axisLeft(y).ticks(4).tickFormat(d => `${d}`))
            .selectAll('text,line,path').attr('stroke', 'none').attr('fill', '#64748b').attr('font-family', 'var(--font-mono)').attr('font-size', '9px');
    }, [feederId, data, timePosition]);

    return <svg ref={svgRef} className="evidence-chart evidence-chart--residual" />;
}

// ─── Confidence Evolution Strip ──────────────────────────────────
function ConfidenceEvolution({ alert }: { alert: Alert }) {
    const history = alert.confidenceHistory;
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const width = 280;
    const height = 40;
    const threshold = 0.90;

    const { minHour, tCritical, domainWidth } = useMemo(() => {
        if (!history.length) return { minHour: 0, tCritical: 0, domainWidth: 1 };
        const minHour = history[0].hour;
        const maxHour = history[history.length - 1].hour;
        let tCritical = maxHour;
        if (alert.isEscalating && alert.estimatedTimeToThreshold && alert.estimatedTimeToThreshold > 0) {
            tCritical = maxHour + alert.estimatedTimeToThreshold;
        }
        const domainWidth = Math.max(tCritical - minHour, 1);
        return { minHour, tCritical, domainWidth };
    }, [history, alert]);

    const scaleX = (hour: number) => ((hour - minHour) / domainWidth) * width;
    const scaleY = (conf: number) => height - (conf * (height - 8)) - 4;

    const points = useMemo(() => {
        return history.map((p) => ({
            x: scaleX(p.hour),
            y: scaleY(p.confidence),
            confidence: p.confidence,
            hour: p.hour,
            trigger: p.trigger
        }));
    }, [history, scaleX, scaleY]);

    const linePath = useMemo(() => {
        if (points.length < 2) return '';
        return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    }, [points]);

    const thresholdY = scaleY(threshold);

    let extPath = '';
    const currentPoint = history[history.length - 1];
    if (alert.isEscalating && alert.estimatedTimeToThreshold && alert.estimatedTimeToThreshold > 0 && currentPoint?.confidence < threshold) {
        extPath = `M ${scaleX(currentPoint.hour)},${scaleY(currentPoint.confidence)} L ${scaleX(tCritical)},${thresholdY}`;
    }

    return (
        <div className="confidence-evolution">
            <h4 className="evidence-section-title">CONFIDENCE GROWTH</h4>
            <div className="confidence-evolution__sparkline-container">
                <svg ref={svgRef} width={width} height={height} className="confidence-evolution__svg">
                    {/* Threshold Line */}
                    <line x1={0} x2={width} y1={thresholdY} y2={thresholdY} stroke="#dc2626" strokeWidth="1" strokeDasharray="4,4" strokeOpacity={0.5} />

                    {/* Extrapolation Line */}
                    {extPath && (
                        <path d={extPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" />
                    )}

                    <path
                        d={linePath}
                        fill="none"
                        stroke="rgba(37, 99, 235, 0.4)"
                        strokeWidth="1.5"
                    />
                    {points.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={hoveredIdx === i ? 4 : 2}
                            fill={p.confidence > 0.8 ? '#dc2626' : p.confidence > 0.5 ? '#b45309' : '#64748b'}
                            className="confidence-evolution__point"
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                        />
                    ))}
                    {/* Critical point at intersection */}
                    {extPath && (
                        <circle cx={scaleX(tCritical)} cy={thresholdY} r={3} fill="#f59e0b" stroke="#0f172a" strokeWidth={1} />
                    )}
                </svg>

                {hoveredIdx !== null && points[hoveredIdx] && (
                    <div className="confidence-evolution__tooltip">
                        <span className="confidence-evolution__tooltip-time">
                            Day {Math.floor(points[hoveredIdx].hour / 24) + 1}, {String(points[hoveredIdx].hour % 24).padStart(2, '0')}:00
                        </span>
                        <div className="confidence-evolution__tooltip-row">
                            <span className="confidence-evolution__tooltip-conf">
                                {Math.round(points[hoveredIdx].confidence * 100)}%
                            </span>
                            <span className="confidence-evolution__tooltip-trigger">
                                {points[hoveredIdx].trigger}
                            </span>
                        </div>
                    </div>
                )}
            </div>
            <p className="confidence-evolution__caption">The AI waited. It did not panic.</p>
        </div>
    );
}

// ─── Comparative Context ─────────────────────────────────────────
function ComparativeContext({ context }: { context: { feedersAnalyzed: number; similarProfiles: number; flaggedByAI: number; uniquenessScore: string } }) {
    return (
        <div className="comparative-context">
            <h4 className="evidence-section-title">COMPARATIVE CONTEXT</h4>
            <div className="comparative-context__grid">
                <div className="comparative-context__item">
                    <span className="comparative-context__label">Feeders analyzed</span>
                    <span className="comparative-context__value">{context.feedersAnalyzed}</span>
                </div>
                <div className="comparative-context__item">
                    <span className="comparative-context__label">Similar load profiles</span>
                    <span className="comparative-context__value">{context.similarProfiles}</span>
                </div>
                <div className="comparative-context__item">
                    <span className="comparative-context__label">Flagged by AI</span>
                    <span className="comparative-context__value comparative-context__value--highlight">{context.flaggedByAI}</span>
                </div>
                <div className="comparative-context__item">
                    <span className="comparative-context__label">Uniqueness score</span>
                    <span className={`comparative-context__value comparative-context__value--${context.uniquenessScore.toLowerCase()}`}>
                        {context.uniquenessScore}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Projected Impact ────────────────────────────────────────────
function ProjectedImpact({ impact }: { impact: { monthlyLoss: string; patternPersistence: string; riskOfSpread: string } }) {
    return (
        <div className="projected-impact">
            <h4 className="evidence-section-title">PROJECTED IMPACT (IF UNCHECKED)</h4>
            <div className="projected-impact__grid">
                <div className="projected-impact__item">
                    <span className="projected-impact__label">Monthly loss estimate</span>
                    <span className="projected-impact__value projected-impact__value--loss">{impact.monthlyLoss}</span>
                </div>
                <div className="projected-impact__item">
                    <span className="projected-impact__label">Pattern persistence</span>
                    <span className={`projected-impact__value projected-impact__value--${impact.patternPersistence.toLowerCase()}`}>
                        {impact.patternPersistence}
                    </span>
                </div>
                <div className="projected-impact__item">
                    <span className="projected-impact__label">Risk of spread</span>
                    <span className={`projected-impact__value projected-impact__value--${impact.riskOfSpread.toLowerCase()}`}>
                        {impact.riskOfSpread}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Evidence Panel ──────────────────────────────────────────────
export default function EvidencePanel() {
    const panelRef = useRef<HTMLDivElement>(null);
    const activeAlertId = useAlertStore((s) => s.activeAlertId);
    const alerts = useAlertStore((s) => s.alerts);
    const timePosition = useUIStore((s) => s.timePosition);
    const replayProgress = useUIStore((s) => s.replayProgress);
    const appMode = useUIStore((s) => s.appMode);
    const isReplaying = appMode === 'replay';
    const isSimulating = appMode === 'simulation';
    const deviationPercent = useUIStore((s) => s.deviationPercent);
    const persistenceDays = useUIStore((s) => s.persistenceDays);
    const affectedFeeders = useUIStore((s) => s.affectedFeeders);

    const activeAlert = useMemo(
        () => alerts.find((a) => a.id === activeAlertId) ?? null,
        [alerts, activeAlertId]
    );

    const displayedConfidence = activeAlert
        ? getDisplayedConfidence(isReplaying, replayProgress, timePosition, activeAlert)
        : 0;

    const simulationProjection = useMemo(
        () =>
            isSimulating
                ? computeProjection({ deviationPercent, persistenceDays, affectedFeeders })
                : null,
        [isSimulating, deviationPercent, persistenceDays, affectedFeeders]
    );

    useEffect(() => {
        if (!panelRef.current) return;
        if (activeAlert) {
            gsap.to(panelRef.current, { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' });
        } else {
            gsap.to(panelRef.current, { y: '100%', opacity: 0, duration: 0.5, ease: 'power2.in' });
        }
    }, [activeAlert]);

    if (!activeAlert) {
        return <div ref={panelRef} className="evidence-panel" style={{ transform: 'translateY(100%)', opacity: 0 }} />;
    }

    return (
        <div ref={panelRef} className="evidence-panel" style={{ transform: 'translateY(100%)', opacity: 0 }}>
            <div className="evidence-panel__header">
                <div className="evidence-panel__title-row">
                    <h3 className="evidence-panel__title">Evidence: {activeAlert.feederName}</h3>
                    <span className="evidence-panel__confidence-badge">
                        {Math.round(displayedConfidence * 100)}% confidence
                    </span>
                </div>
                {isReplaying && (
                    <div className="evidence-panel__replay-indicator">
                        REPLAY ACTIVE · {Math.round(replayProgress * 100)}%
                    </div>
                )}
            </div>

            <div className="evidence-panel__content">
                {/* Left column: charts */}
                {isSimulating ? (
                    <div className="evidence-panel__simulation-header">
                        <span className="evidence-panel__mode-badge">SIMULATION</span>
                        <h3>Projections</h3>
                    </div>
                ) : (
                    <div className="evidence-panel__charts">
                        <div className="evidence-panel__chart-container">
                            <h4 className="evidence-panel__chart-label">Feeder Draw vs Billed Load</h4>
                            <TimeSeriesChart feederId={activeAlert.feederId} timePosition={timePosition} />
                        </div>
                        <div className="evidence-panel__chart-container">
                            <h4 className="evidence-panel__chart-label">Residual Energy Deviation</h4>
                            <ResidualChart feederId={activeAlert.feederId} timePosition={timePosition} />
                        </div>
                    </div>
                )}

                {/* Right column: insights */}
                <div className="evidence-panel__insights">
                    {/* Projected Scenario Impact (simulation mode only) */}
                    {isSimulating && simulationProjection && (
                        <div className="evidence-panel__simulation-box">
                            <h4 className="evidence-panel__simulation-title">Projected Scenario Impact</h4>
                            <div className="evidence-panel__simulation-grid">
                                <div className="evidence-panel__simulation-item">
                                    <span className="evidence-panel__simulation-label">Estimated Revenue Exposure</span>
                                    <span className="evidence-panel__simulation-value">
                                        ₹{Math.round(simulationProjection.projectedImpact).toLocaleString()}
                                    </span>
                                </div>
                                <div className="evidence-panel__simulation-item">
                                    <span className="evidence-panel__simulation-label">Projected Confidence</span>
                                    <span className="evidence-panel__simulation-value">
                                        {Math.round(simulationProjection.projectedConfidence * 100)}%
                                    </span>
                                </div>
                                <div className="evidence-panel__simulation-item">
                                    <span className="evidence-panel__simulation-label">Estimated Escalation</span>
                                    <span className="evidence-panel__simulation-value">
                                        {simulationProjection.projectedEscalationHours >= 24
                                            ? `${Math.round(simulationProjection.projectedEscalationHours / 24)} days`
                                            : `${simulationProjection.projectedEscalationHours} hours`}
                                    </span>
                                </div>
                            </div>
                            <p className="evidence-panel__simulation-note">Simulated — not real data</p>
                        </div>
                    )}

                    {/* Explanation */}
                    <div className="evidence-panel__explanation">
                        <h4 className="evidence-section-title">WHY THIS ALERT EXISTS</h4>
                        {activeAlert.explanation.map((line, i) => (
                            <p key={i} className="evidence-panel__explanation-line">• {line}</p>
                        ))}
                    </div>

                    {/* Escalation Forecast */}
                    <PredictionBox alertId={activeAlert.id} />

                    {/* Confidence evolution */}
                    <ConfidenceEvolution alert={activeAlert} />

                    {/* Comparative context */}
                    <ComparativeContext context={activeAlert.comparativeContext} />

                    {/* Projected impact */}
                    <ProjectedImpact impact={activeAlert.projectedImpact} />

                    {/* Field verification context */}
                    <FieldVerification feederId={activeAlert.feederId} />
                </div>
            </div>
        </div>
    );
}
