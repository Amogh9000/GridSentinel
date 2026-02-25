import { useRef, useCallback } from 'react';
import { useUIStore } from '../../state/uiStore';
import { ANOMALY_BANDS } from '../../data/mockData';
import './timeline.css';

export default function Timeline() {
    const trackRef = useRef<HTMLDivElement>(null);
    const timePosition = useUIStore((s) => s.timePosition);
    const setTimePosition = useUIStore((s) => s.setTimePosition);

    const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        setTimePosition(Math.round(ratio * 167));
    }, [setTimePosition]);

    const handleDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.buttons !== 1) return;
        handleTrackClick(e);
    }, [handleTrackClick]);

    // Day labels
    const dayLabels = Array.from({ length: 7 }, (_, i) => ({
        label: `Day ${i + 1}`,
        position: ((i * 24 + 12) / 167) * 100,
    }));

    return (
        <div className="timeline">
            <div className="timeline__label">
                <span className="timeline__label-text">TEMPORAL CONTEXT</span>
                <span className="timeline__position">
                    Day {Math.floor(timePosition / 24) + 1}, {String(timePosition % 24).padStart(2, '0')}:00
                </span>
            </div>
            <div
                className="timeline__track"
                ref={trackRef}
                onClick={handleTrackClick}
                onMouseMove={handleDrag}
            >
                {/* Anomaly bands */}
                {ANOMALY_BANDS.map((band) => (
                    <div
                        key={`${band.feederId}-${band.start}`}
                        className={`timeline__anomaly-band timeline__anomaly-band--${band.severity}`}
                        style={{
                            left: `${(band.start / 167) * 100}%`,
                            width: `${((band.end - band.start) / 167) * 100}%`,
                        }}
                        title={`${band.feederId} (${band.severity})`}
                    />
                ))}

                {/* Day separators */}
                {Array.from({ length: 6 }, (_, i) => (
                    <div
                        key={i}
                        className="timeline__day-sep"
                        style={{ left: `${(((i + 1) * 24) / 167) * 100}%` }}
                    />
                ))}

                {/* Playhead */}
                <div
                    className="timeline__playhead"
                    style={{ left: `${(timePosition / 167) * 100}%` }}
                >
                    <div className="timeline__playhead-line" />
                    <div className="timeline__playhead-dot" />
                </div>

                {/* Day labels */}
                {dayLabels.map((d, i) => (
                    <span
                        key={i}
                        className="timeline__day-label"
                        style={{ left: `${d.position}%` }}
                    >
                        {d.label}
                    </span>
                ))}
            </div>
        </div>
    );
}
