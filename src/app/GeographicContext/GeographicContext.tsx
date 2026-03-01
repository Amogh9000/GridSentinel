import { useEffect, useRef, useMemo } from 'react';
import { useUIStore } from '../../state/uiStore';
import { useAlertStore } from '../../state/alertStore';
import { useGridStore } from '../../state/gridStore';
import { getMaxImpact, getNormalizedImpact, impactColorScale } from '../../utils/heatmapScale';
import { GEO_ZONES, BANGALORE_CENTER, BANGALORE_BOUNDS, BANGALORE_LANDMARKS } from '../../data/geoData';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import gsap from 'gsap';
import './geographicContext.css';

const STATUS_COLORS: Record<string, string> = {
    normal: '#cbd5e1',
    suspicious: '#b45309',
    anomaly: '#dc2626',
};

export default function GeographicContext() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const polygonsRef = useRef<Map<string, L.Polygon>>(new Map());
    const geoContextVisible = useUIStore((s) => s.geoContextVisible);
    const hideGeoContext = useUIStore((s) => s.hideGeoContext);
    const focusedFeederId = useUIStore((s) => s.focusedFeederId);
    const heatmapMode = useUIStore((s) => s.heatmapMode);
    const alerts = useAlertStore((s) => s.alerts);
    const feeders = useGridStore((s) => s.feeders);
    const enterInvestigation = useUIStore((s) => s.enterInvestigation);
    const setActiveAlert = useAlertStore((s) => s.setActiveAlert);

    // GSAP slide-in/out
    useEffect(() => {
        if (!containerRef.current) return;
        if (geoContextVisible) {
            gsap.fromTo(containerRef.current,
                { x: '100%', opacity: 0 },
                { x: '0%', opacity: 1, duration: 0.8, ease: 'power2.out' }
            );
        } else {
            gsap.to(containerRef.current, {
                x: '100%', opacity: 0, duration: 0.5, ease: 'power2.in',
            });
        }
    }, [geoContextVisible]);

    // Initialize Leaflet map
    useEffect(() => {
        if (!geoContextVisible || !containerRef.current) return;
        if (mapRef.current) return; // already initialized

        // Small delay to let GSAP animation start
        const timer = setTimeout(() => {
            if (!containerRef.current) return;
            const mapContainer = containerRef.current.querySelector('.geo-map__container') as HTMLElement;
            if (!mapContainer) return;

            const map = L.map(mapContainer, {
                center: BANGALORE_CENTER,
                zoom: 12,
                zoomControl: false,
                attributionControl: false,
                maxBounds: L.latLngBounds(BANGALORE_BOUNDS[0], BANGALORE_BOUNDS[1]),
                minZoom: 11,
                maxZoom: 15,
            });

            // Light muted tiles — CartoDB Positron
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                subdomains: 'abcd',
            }).addTo(map);

            const maxImpact = getMaxImpact(alerts);

            // Add zone polygons
            GEO_ZONES.forEach((zone) => {
                const feeder = feeders.find((f) => f.id === zone.feederId);
                const alert = alerts.find((a) => a.feederId === zone.feederId);
                const confidence = alert?.confidence ?? feeder?.confidence ?? 0.5;
                const status = feeder?.status ?? 'normal';

                const fillColor = heatmapMode && alert
                    ? impactColorScale(getNormalizedImpact(alert.economicImpact, maxImpact))
                    : (STATUS_COLORS[status] ?? STATUS_COLORS.normal);
                const fillOpacity = heatmapMode && alert
                    ? 0.3 + getNormalizedImpact(alert.economicImpact, maxImpact) * 0.4
                    : confidence * 0.45;

                const polygon = L.polygon(zone.polygon as L.LatLngExpression[], {
                    color: fillColor,
                    weight: 1.5,
                    opacity: 0.6,
                    fillColor,
                    fillOpacity,
                    className: zone.feederId === focusedFeederId ? 'geo-polygon--active' : 'geo-polygon',
                }).addTo(map);

                // Tooltip
                const tooltipContent = `
          <div class="geo-tooltip">
            <div class="geo-tooltip__name">${zone.name}</div>
            <div class="geo-tooltip__feeder">${feeder?.name ?? zone.feederId}</div>
            ${zone.aiSummary.map((s) => `<div class="geo-tooltip__line">• ${s}</div>`).join('')}
          </div>
        `;
                polygon.bindTooltip(tooltipContent, {
                    className: 'geo-tooltip-container',
                    direction: 'top',
                    sticky: true,
                });

                // Click → sync with grid
                polygon.on('click', () => {
                    const relatedAlert = alerts.find((a) => a.feederId === zone.feederId);
                    if (relatedAlert) {
                        setActiveAlert(relatedAlert.id);
                        enterInvestigation(zone.feederId);
                    }
                });

                polygonsRef.current.set(zone.feederId, polygon);
            });

            // Add landmarks as subtle orientation points
            BANGALORE_LANDMARKS.forEach((lm) => {
                L.circleMarker(lm.pos as L.LatLngExpression, {
                    radius: 4,
                    color: '#2563eb',
                    weight: 1,
                    opacity: 0.6,
                    fillColor: '#2563eb',
                    fillOpacity: 0.3,
                })
                    .addTo(map)
                    .bindTooltip(lm.name, {
                        direction: 'top',
                        offset: [0, -5],
                        className: 'geo-landmark-tooltip',
                    });
            });

            mapRef.current = map;

            // If a feeder is focused, pan to its zone
            if (focusedFeederId) {
                const zone = GEO_ZONES.find((z) => z.feederId === focusedFeederId);
                if (zone) {
                    const bounds = L.latLngBounds(zone.polygon as L.LatLngExpression[]);
                    map.fitBounds(bounds.pad(0.5), { animate: true, duration: 0.6 });
                }
            }
        }, 200);

        return () => {
            clearTimeout(timer);
        };
    }, [geoContextVisible, feeders, alerts, focusedFeederId, heatmapMode, enterInvestigation, setActiveAlert]);

    // Update polygon styles when focus or heatmap mode changes
    useEffect(() => {
        if (!mapRef.current || !geoContextVisible) return;

        const maxImpact = getMaxImpact(alerts);

        polygonsRef.current.forEach((polygon, feederId) => {
            const el = polygon.getElement();
            if (!el) return;

            if (feederId === focusedFeederId) {
                el.classList.add('geo-polygon--active');
                el.classList.remove('geo-polygon');
            } else {
                el.classList.remove('geo-polygon--active');
                el.classList.add('geo-polygon');
            }

            const zone = GEO_ZONES.find((z) => z.feederId === feederId);
            const feeder = feeders.find((f) => f.id === feederId);
            const alert = alerts.find((a) => a.feederId === feederId);
            const confidence = alert?.confidence ?? feeder?.confidence ?? 0.5;
            const status = feeder?.status ?? 'normal';

            if (heatmapMode && alert) {
                const norm = getNormalizedImpact(alert.economicImpact, maxImpact);
                polygon.setStyle({
                    fillColor: impactColorScale(norm),
                    fillOpacity: 0.3 + norm * 0.4,
                    color: impactColorScale(norm),
                    weight: 1.5,
                    opacity: 0.6,
                });
            } else {
                const styleColor = STATUS_COLORS[status] ?? STATUS_COLORS.normal;
                polygon.setStyle({
                    fillColor: styleColor,
                    fillOpacity: confidence * 0.45,
                    color: styleColor,
                    weight: 1.5,
                    opacity: 0.6,
                });
            }
        });

        // Pan to focused zone (gentle, no aggressive re-center)
        if (focusedFeederId && mapRef.current) {
            const zone = GEO_ZONES.find((z) => z.feederId === focusedFeederId);
            if (zone) {
                const bounds = L.latLngBounds(zone.polygon as L.LatLngExpression[]);
                const center = bounds.getCenter();
                mapRef.current.panTo(center, { animate: true, duration: 0.5 });
            }
        }
    }, [focusedFeederId, heatmapMode, alerts, feeders, geoContextVisible]);

    // Cleanup map on unmount or when hidden
    useEffect(() => {
        if (!geoContextVisible && mapRef.current) {
            const timer = setTimeout(() => {
                mapRef.current?.remove();
                mapRef.current = null;
                polygonsRef.current.clear();
            }, 600); // after slide-out animation
            return () => clearTimeout(timer);
        }
    }, [geoContextVisible]);

    // Find the active zone for the info bar
    const activeZone = useMemo(
        () => GEO_ZONES.find((z) => z.feederId === focusedFeederId) ?? null,
        [focusedFeederId]
    );

    return (
        <div ref={containerRef} className="geo-context" style={{ transform: 'translateX(100%)', opacity: 0 }}>
            <div className="geo-context__header">
                <div className="geo-context__header-left">
                    <div className="geo-context__dot" />
                    <span className="geo-context__label">GEOGRAPHIC VERIFICATION</span>
                </div>
                <button className="geo-context__close" onClick={hideGeoContext}>
                    Hide Geographic Context
                </button>
            </div>

            {activeZone && (
                <div className="geo-context__zone-bar">
                    <span className="geo-context__zone-name">{activeZone.name}</span>
                    <span className="geo-context__zone-type" data-type={activeZone.zoneType}>
                        {activeZone.zoneType}
                    </span>
                    <span className="geo-context__zone-density">
                        Density: {activeZone.density}
                    </span>
                    <span className="geo-context__zone-inspection">
                        Last inspection: {activeZone.lastInspection}
                    </span>
                </div>
            )}

            <div className="geo-map__container" />

            <div className="geo-context__footer">
                <span className="geo-context__footer-note">
                    Bangalore Pilot — Simulated utility zones. Not official BESCOM boundaries.
                </span>
            </div>
        </div>
    );
}
