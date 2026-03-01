import { useEffect, useRef, useMemo } from 'react';
import { useUIStore } from '../../state/uiStore';
import { useAlertStore } from '../../state/alertStore';
import { useGridStore } from '../../state/gridStore';
import { GEO_ZONES, BANGALORE_CENTER, BANGALORE_BOUNDS, BANGALORE_LANDMARKS } from '../../data/geoData';
import { getMaxImpact, getNormalizedImpact, impactColorScale } from '../../utils/heatmapScale';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './mapDashboard.css';

const STATUS_COLORS: Record<string, string> = {
    normal: '#cbd5e1',
    suspicious: '#b45309',
    anomaly: '#dc2626',
};

export default function MapDashboard() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const polygonsRef = useRef<Map<string, L.Polygon>>(new Map());

    const heatmapMode = useUIStore((s) => s.heatmapMode);
    const focusedFeederId = useUIStore((s) => s.focusedFeederId);
    const enterInvestigation = useUIStore((s) => s.enterInvestigation);
    const alerts = useAlertStore((s) => s.alerts);
    const feeders = useGridStore((s) => s.feeders);
    const setActiveAlert = useAlertStore((s) => s.setActiveAlert);

    const maxImpact = useMemo(() => getMaxImpact(alerts), [alerts]);

    // Get polygon color based on mode
    const getZoneColor = (feederId: string) => {
        const feeder = feeders.find((f) => f.id === feederId);
        const alert = alerts.find((a) => a.feederId === feederId);

        if (heatmapMode && alert) {
            const normalized = getNormalizedImpact(alert.economicImpact, maxImpact);
            return impactColorScale(normalized);
        }

        const status = feeder?.status ?? 'normal';
        return STATUS_COLORS[status] ?? STATUS_COLORS.normal;
    };

    // Initialize Leaflet map
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const mapContainer = containerRef.current.querySelector('.map-dashboard__map') as HTMLElement;
        if (!mapContainer) return;

        const map = L.map(mapContainer, {
            center: BANGALORE_CENTER,
            zoom: 12,
            zoomControl: true,
            attributionControl: false,
            maxBounds: L.latLngBounds(BANGALORE_BOUNDS[0], BANGALORE_BOUNDS[1]),
            minZoom: 11,
            maxZoom: 15,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
        }).addTo(map);

        // Add zone polygons
        GEO_ZONES.forEach((zone) => {
            const feeder = feeders.find((f) => f.id === zone.feederId);
            const alert = alerts.find((a) => a.feederId === zone.feederId);
            const confidence = alert?.confidence ?? feeder?.confidence ?? 0.5;
            const color = getZoneColor(zone.feederId);

            const polygon = L.polygon(zone.polygon as L.LatLngExpression[], {
                color: color,
                weight: 2,
                opacity: 0.8,
                fillColor: color,
                fillOpacity: confidence * 0.5,
                className: zone.feederId === focusedFeederId ? 'map-polygon--active' : 'map-polygon',
            }).addTo(map);

            // Rich tooltip
            const impact = alert ? `₹${alert.economicImpact.toLocaleString()}` : 'N/A';
            const conf = alert ? `${Math.round(alert.confidence * 100)}%` : 'N/A';
            const tooltipContent = `
                <div class="map-tooltip">
                    <div class="map-tooltip__name">${zone.name}</div>
                    <div class="map-tooltip__feeder">${feeder?.name ?? zone.feederId}</div>
                    <div class="map-tooltip__stats">
                        <span>Impact: <b>${impact}</b></span>
                        <span>Confidence: <b>${conf}</b></span>
                    </div>
                    ${zone.aiSummary.map((s) => `<div class="map-tooltip__line">• ${s}</div>`).join('')}
                </div>
            `;
            polygon.bindTooltip(tooltipContent, {
                className: 'map-tooltip-container',
                direction: 'top',
                sticky: true,
            });

            // Click → investigate
            polygon.on('click', () => {
                const relatedAlert = alerts.find((a) => a.feederId === zone.feederId);
                if (relatedAlert) {
                    setActiveAlert(relatedAlert.id);
                    enterInvestigation(zone.feederId);
                }
            });

            polygonsRef.current.set(zone.feederId, polygon);
        });

        // Add landmarks
        BANGALORE_LANDMARKS.forEach((lm) => {
            L.circleMarker(lm.pos as L.LatLngExpression, {
                radius: 5,
                color: '#2563eb',
                weight: 1.5,
                opacity: 0.7,
                fillColor: '#2563eb',
                fillOpacity: 0.3,
            })
                .addTo(map)
                .bindTooltip(lm.name, {
                    direction: 'top',
                    offset: [0, -5],
                    className: 'map-landmark-tooltip',
                });
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            polygonsRef.current.clear();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update polygon colors when heatmapMode or alerts change
    useEffect(() => {
        polygonsRef.current.forEach((polygon, feederId) => {
            const color = getZoneColor(feederId);
            polygon.setStyle({
                color: color,
                fillColor: color,
            });
        });
    }, [heatmapMode, alerts, feeders]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div ref={containerRef} className="map-dashboard">
            <div className="map-dashboard__map" />

            {/* Revenue Risk Legend */}
            {heatmapMode && (
                <div className="map-dashboard__legend">
                    <span className="map-dashboard__legend-title">REVENUE RISK</span>
                    <div className="map-dashboard__legend-bar">
                        <span>Low</span>
                        <div className="map-dashboard__legend-gradient" />
                        <span>High</span>
                    </div>
                </div>
            )}

            <div className="map-dashboard__info-bar">
                <span className="map-dashboard__info-label">MAP DASHBOARD</span>
                <span className="map-dashboard__info-detail">
                    Bangalore Pilot · {GEO_ZONES.length} zones · {alerts.filter(a => a.resolution === 'active').length} active alerts
                </span>
            </div>
        </div>
    );
}
