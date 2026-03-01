# GridSentinel

AI-augmented mission control for power grid monitoring and non-technical loss detection. Built for the Bangalore Pilot Program (BESCOM).

## Overview

GridSentinel bridges raw electrical sensor telemetry and operational field decision-making. It provides an immersive environment where AI-driven anomaly signals are grounded in 3D grid physics and geographic reality.

## Features

**Dual-View Architecture**
- 3D Globe — spatial visualization of electrical nodes, connection flows, and anomaly propagation (Three.js)
- Map Dashboard — full-width Leaflet map with zone polygons, heatmap overlays, and landmark orientation

**Revenue Risk View**
- Toggle economic impact coloring across both views (green/yellow/red gradient scale)
- Per-zone impact tooltips with AI confidence scores

**Simulation Mode**
- Three-parameter stress modelling: load deviation %, persistence days, affected feeders
- Projected outcome card with escalation risk bar and severity verdict

**Signal-to-Action Queue**
- Prioritized alert sidebar with confidence scores, economic impact, and persistence tracking
- One-click investigation flow with camera lock and evidence drill-down

**Geographic Verification**
- Bangalore zone polygons mapped to feeder IDs
- Street-level landmarks (substations, metro stations) for field orientation

**Deep Evidence Audit**
- D3.js analytics comparing feeder-draw vs. billed-load residuals
- Confidence history timeline with trigger annotations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript, Vite |
| 3D Visualization | Three.js (React Three Fiber, Drei) |
| 2D Mapping | Leaflet |
| Analytics | D3.js |
| Animation | GSAP |
| State Management | Zustand |
| Real-time | WebSocket |

## Getting Started

**Prerequisites:** Node.js v18+, npm

```bash
git clone <repository-url>
cd amd
npm install
npm run dev
```

Production build:
```bash
npm run build
```

## Architecture

```
src/
├── state/          # Zustand stores (uiStore, gridStore, alertStore)
├── app/            # UI components
│   ├── GridScene/      # 3D globe (Three.js canvas)
│   ├── MapDashboard/   # 2D map view (Leaflet)
│   ├── AlertFlow/      # Action queue sidebar
│   ├── EvidencePanel/  # Deep audit analytics
│   ├── SimulationPanel/# Stress scenario modelling
│   ├── SystemHealth/   # Top bar with view controls
│   ├── Timeline/       # Temporal context with anomaly bands
│   └── GeographicContext/ # GIS verification overlay
├── data/           # Mock telemetry and geo zone data
├── services/       # API and WebSocket clients
├── utils/          # Heatmap scales, projection math, replay logic
└── hooks/          # Custom React hooks
```

**State flow:** Components subscribe to Zustand stores. The `uiStore` drives view mode (3D/2D), investigation state, camera position, and simulation parameters. The `alertStore` manages signal detection and resolution audit trails.

---

*Developed for the BESCOM Intelligence Pilot program. Simulated data — not official utility boundaries.*
