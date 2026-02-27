import { useAlertStore } from '../../state/alertStore';
import './predictionBox.css';

export default function PredictionBox({ alertId }: { alertId: string }) {
    const alert = useAlertStore((s) => s.alerts.find(a => a.id === alertId));

    if (!alert || alert.estimatedTimeToThreshold === undefined || alert.estimatedTimeToThreshold === null) {
        return null;
    }

    const etaInHours = alert.estimatedTimeToThreshold;
    const etaInMinutes = etaInHours * 60;

    // Determine the urgency class
    let urgencyClass = 'prediction-box--monitor'; // > 30 mins
    if (etaInMinutes <= 10) {
        urgencyClass = 'prediction-box--critical';
    } else if (etaInMinutes <= 30) {
        urgencyClass = 'prediction-box--warning';
    }

    // Format the time (T-Minus Xm Ys)
    const formatETA = (hours: number) => {
        if (hours <= 0) return 'Threshold Reached';
        const totalSeconds = Math.floor(hours * 3600);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `T-Minus ${m}m ${s}s until Critical Threshold`;
    };

    return (
        <div className={`prediction-box ${urgencyClass} ${alert.isEscalating ? 'is-escalating' : ''}`}>
            <div className="prediction-box__header">
                <span className="prediction-box__icon">⏱</span>
                <span className="prediction-box__title">Escalation Forecast</span>
            </div>
            <div className="prediction-box__body">
                <div className="prediction-box__eta">
                    {formatETA(etaInHours)}
                </div>
                {alert.projectedSlope !== undefined && (
                    <div className="prediction-box__slope">
                        Confidence growing at {(alert.projectedSlope * 100).toFixed(2)}% / hour
                    </div>
                )}
            </div>
        </div>
    );
}
