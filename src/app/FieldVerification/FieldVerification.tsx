import { FIELD_VERIFICATION, type FieldVerificationData } from '../../data/geoData';
import './fieldVerification.css';

interface Props {
    feederId: string;
}

export default function FieldVerification({ feederId }: Props) {
    const data: FieldVerificationData | undefined = FIELD_VERIFICATION[feederId];

    if (!data) return null;

    return (
        <div className="field-verification">
            <h4 className="evidence-section-title">FIELD VERIFICATION CONTEXT (SIMULATED)</h4>

            <div className="field-verification__card">
                {/* Infrastructure type badge */}
                <div className="field-verification__infra-badge">
                    {data.infrastructureType}
                </div>

                {/* Description */}
                <p className="field-verification__description">{data.description}</p>

                {/* Annotation overlays */}
                <div className="field-verification__annotations">
                    {data.annotations.map((annotation, i) => (
                        <div key={i} className="field-verification__annotation">
                            <span className="field-verification__annotation-dot" />
                            <span className="field-verification__annotation-text">{annotation}</span>
                        </div>
                    ))}
                </div>

                {/* Simulated label */}
                <div className="field-verification__simulated-label">
                    SIMULATED — NOT LIVE IMAGERY
                </div>
            </div>
        </div>
    );
}
