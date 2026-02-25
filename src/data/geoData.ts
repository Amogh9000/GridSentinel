import type { LatLngExpression } from 'leaflet';

// ─── Bangalore pilot zone polygons ──────────────────────────────────
// Each feeder maps to a real Bangalore neighborhood — but data is simulated.
// These are NOT official utility boundaries.

export interface GeoZone {
    feederId: string;
    name: string;
    zoneType: 'residential' | 'industrial' | 'mixed';
    polygon: LatLngExpression[];
    density: 'LOW' | 'MEDIUM' | 'HIGH';
    lastInspection: string;
    aiSummary: string[];
}

export interface FieldVerificationData {
    feederId: string;
    infrastructureType: string;
    description: string;
    annotations: string[];
}

// ─── Map config ─────────────────────────────────────────────────────
export const BANGALORE_CENTER: LatLngExpression = [12.9716, 77.5946];
export const BANGALORE_BOUNDS: [LatLngExpression, LatLngExpression] = [
    [12.85, 77.45],
    [13.10, 77.75],
];

export const GEO_CONFIDENCE_THRESHOLD = 0.4;

// ─── Zone polygons ──────────────────────────────────────────────────
export const GEO_ZONES: GeoZone[] = [
    // Sector-7 feeders → Koramangala / HSR Layout area
    {
        feederId: 'F01',
        name: 'Koramangala 5th Block',
        zoneType: 'residential',
        polygon: [
            [12.9352, 77.6120], [12.9352, 77.6220],
            [12.9280, 77.6220], [12.9280, 77.6120],
        ],
        density: 'HIGH',
        lastInspection: '2024-08-14',
        aiSummary: ['Standard residential draw', 'No anomalies detected', 'High meter density area'],
    },
    {
        feederId: 'F02',
        name: 'HSR Layout Sector 2',
        zoneType: 'residential',
        polygon: [
            [12.9180, 77.6340], [12.9180, 77.6440],
            [12.9110, 77.6440], [12.9110, 77.6340],
        ],
        density: 'HIGH',
        lastInspection: '2024-07-22',
        aiSummary: ['Stable load profile', 'Dense residential cluster', 'Well-maintained infrastructure'],
    },
    {
        feederId: 'F03',
        name: 'BTM Layout 2nd Stage',
        zoneType: 'mixed',
        polygon: [
            [12.9160, 77.6100], [12.9160, 77.6210],
            [12.9080, 77.6210], [12.9080, 77.6100],
        ],
        density: 'HIGH',
        lastInspection: 'Unknown',
        aiSummary: [
            'Intermittent off-peak load spikes',
            'Mixed commercial-residential zone',
            'Meter cluster age: >8 years',
            'Weak correlation with neighbors',
        ],
    },

    // Sector-12 feeders → Jayanagar / JP Nagar area
    {
        feederId: 'F04',
        name: 'Jayanagar 4th Block',
        zoneType: 'residential',
        polygon: [
            [12.9310, 77.5780], [12.9310, 77.5890],
            [12.9230, 77.5890], [12.9230, 77.5780],
        ],
        density: 'MEDIUM',
        lastInspection: '2024-09-03',
        aiSummary: ['Consistent residential baseline', 'No anomalies', 'Regular maintenance cycle'],
    },
    {
        feederId: 'F05',
        name: 'JP Nagar 6th Phase',
        zoneType: 'residential',
        polygon: [
            [12.9050, 77.5850], [12.9050, 77.5960],
            [12.8970, 77.5960], [12.8970, 77.5850],
        ],
        density: 'MEDIUM',
        lastInspection: '2024-06-18',
        aiSummary: ['Minor late-night variance', 'Likely noise', 'Low priority'],
    },
    {
        feederId: 'F06',
        name: 'Banashankari 3rd Stage',
        zoneType: 'mixed',
        polygon: [
            [12.9200, 77.5580], [12.9200, 77.5720],
            [12.9100, 77.5720], [12.9100, 77.5580],
        ],
        density: 'HIGH',
        lastInspection: 'Unknown',
        aiSummary: [
            'Persistent feeder–meter mismatch',
            'Off-peak anomaly pattern (02:00–05:00)',
            'High residential density zone',
            'Tamper signal correlation detected',
        ],
    },

    // Sector-19 feeders → Malleshwaram / Rajajinagar
    {
        feederId: 'F07',
        name: 'Malleshwaram',
        zoneType: 'residential',
        polygon: [
            [12.9960, 77.5660], [12.9960, 77.5780],
            [12.9880, 77.5780], [12.9880, 77.5660],
        ],
        density: 'MEDIUM',
        lastInspection: '2024-08-28',
        aiSummary: ['Heritage residential area', 'Stable load', 'No concerns'],
    },
    {
        feederId: 'F08',
        name: 'Rajajinagar 4th Block',
        zoneType: 'mixed',
        polygon: [
            [12.9910, 77.5510], [12.9910, 77.5640],
            [12.9830, 77.5640], [12.9830, 77.5510],
        ],
        density: 'MEDIUM',
        lastInspection: '2024-07-15',
        aiSummary: ['Mixed use zone', 'Normal draw patterns', 'No flagged behavior'],
    },
    {
        feederId: 'F09',
        name: 'Vijayanagar',
        zoneType: 'mixed',
        polygon: [
            [12.9730, 77.5330], [12.9730, 77.5470],
            [12.9640, 77.5470], [12.9640, 77.5330],
        ],
        density: 'MEDIUM',
        lastInspection: '2024-05-10',
        aiSummary: [
            'Mild evening load elevation',
            'Inconsistent pattern — possible seasonal',
            'Monitoring recommended',
        ],
    },

    // Industrial zone feeders → Peenya / Whitefield
    {
        feederId: 'F10',
        name: 'Peenya Industrial Stage I',
        zoneType: 'industrial',
        polygon: [
            [13.0310, 77.5120], [13.0310, 77.5280],
            [13.0200, 77.5280], [13.0200, 77.5120],
        ],
        density: 'LOW',
        lastInspection: '2024-09-12',
        aiSummary: ['Industrial baseline nominal', 'Production-aligned draw', 'No anomalies'],
    },
    {
        feederId: 'F11',
        name: 'Peenya Industrial Stage II',
        zoneType: 'industrial',
        polygon: [
            [13.0340, 77.5300], [13.0340, 77.5450],
            [13.0230, 77.5450], [13.0230, 77.5300],
        ],
        density: 'LOW',
        lastInspection: '2024-08-05',
        aiSummary: ['Stable industrial zone', 'Shift-aligned consumption', 'Well-monitored area'],
    },
    {
        feederId: 'F12',
        name: 'Whitefield EPIP Zone',
        zoneType: 'industrial',
        polygon: [
            [12.9860, 77.7280], [12.9860, 77.7440],
            [12.9750, 77.7440], [12.9750, 77.7280],
        ],
        density: 'MEDIUM',
        lastInspection: 'Unknown',
        aiSummary: [
            'Load factor anomaly detected',
            'Weekend consumption exceeds weekday by 40%',
            'Potential unauthorized equipment operation',
            'Revenue gap: 18%',
        ],
    },
];

// ─── Field verification context (simulated) ─────────────────────────
export const FIELD_VERIFICATION: Record<string, FieldVerificationData> = {
    F03: {
        feederId: 'F03',
        infrastructureType: 'Meter Cluster — Pole-mounted',
        description: 'Pole-mounted meter cluster servicing mixed residential-commercial block. Several meters show signs of aging. Tamper-evident seals not visible on all units.',
        annotations: [
            'Meter cluster density: HIGH',
            'Estimated meter age: 8+ years',
            'Seal integrity: UNVERIFIED',
            'Last physical audit: UNKNOWN',
        ],
    },
    F06: {
        feederId: 'F06',
        infrastructureType: 'Distribution Transformer — Pad-mounted',
        description: 'Pad-mounted distribution transformer serving high-density residential area. Cable terminations show weathering. Load profile suggests sustained over-draw during anomaly windows.',
        annotations: [
            'High load concentration zone',
            'Cable condition: WEATHERED',
            'Transformer rating vs. draw: MISMATCH likely',
            'Last inspection: UNKNOWN',
        ],
    },
    F09: {
        feederId: 'F09',
        infrastructureType: 'Feeder Endpoint — Junction Box',
        description: 'Underground feeder junction box at the end of Sector-19 line. Mixed-use feeder with commercial and residential loads. Evening load elevation pattern observed.',
        annotations: [
            'Junction type: UNDERGROUND',
            'Connected loads: MIXED',
            'Evening peak: ELEVATED',
            'Seasonal adjustment: PENDING',
        ],
    },
    F12: {
        feederId: 'F12',
        infrastructureType: 'Industrial Feeder — HT/LT Junction',
        description: 'HT/LT junction serving EPIP industrial zone. Weekend energy consumption pattern inconsistent with declared production hours. Revenue metering shows systematic gap.',
        annotations: [
            'Industrial metering: HT/LT',
            'Weekend anomaly: CONFIRMED',
            'Production vs. consumption: MISMATCH',
            'Revenue gap: 18%',
        ],
    },
    F05: {
        feederId: 'F05',
        infrastructureType: 'Pole-mounted Transformer',
        description: 'Standard pole-mounted transformer in residential neighborhood. Minor late-night variance within noise range. Low confidence — flagged for monitoring completeness only.',
        annotations: [
            'Transformer load: NORMAL',
            'Late-night variance: MINOR',
            'Confidence: LOW',
            'Action recommended: MONITOR ONLY',
        ],
    },
};
// ─── Pilot Landmarks (simulated) ──────────────────────────────────
export const BANGALORE_LANDMARKS = [
    { name: 'BESCOM Substation — KOR', pos: [12.9360, 77.6180], type: 'utility' },
    { name: 'Koramangala BSNL Office', pos: [12.9290, 77.6150], type: 'landmark' },
    { name: 'HSR 27th Main Junction', pos: [12.9150, 77.6390], type: 'landmark' },
    { name: 'Peenya Industrial Assoc.', pos: [13.0280, 77.5250], type: 'utility' },
    { name: 'EPIP Main Reception', pos: [12.9810, 77.7350], type: 'landmark' },
    { name: 'Jayanagar Metro Station', pos: [12.9270, 77.5830], type: 'landmark' },
];
