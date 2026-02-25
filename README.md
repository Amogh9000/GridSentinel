# GridSentinel — Mission Control for the Modern Grid

**GridSentinel** is an AI-augmented "Mission Control" platform designed for high-inertia power grid monitoring and fraud detection. Built for the Bangalore Pilot Program (BESCOM), it bridges the gap between raw electrical sensor telemetry and operational field decision-making.

## 🚀 Vision
In the shift toward decentralized energy and smart grids, detecting "Non-Technical Losses" (energy theft) requires more than simple alerts—it requires spatial awareness and deep evidence trails. GridSentinel provides an immersive environment where AI-driven "hunches" are grounded in 3D grid physics and geographic reality.

## ✨ Core Features
- **3D Grid Intelligence**: Real-time spatial visualization of electrical nodes and flows using Three.js.
- **Signal-to-Action Queue**: An intelligent operational sidebar that filters noise, highlighting high-probability energy theft alerts.
- **Deep Evidence Audit**: High-fidelity D3.js analytics comparing Feeder-Draw vs. Billed-Load residuals.
- **Geographic Context (Bangalore Pilot)**: Full GIS integration (Leaflet) with street-level orientation landmarks (BSNL, Metro, Substations).
- **Stability-First UX**: High-visibility "Light Mode" aesthetic with zero-overlay resolution flows to ensure maximum uptime for operators.

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Visuals**: Three.js (3D Grid), D3.js (Analytics), Leaflet (GIS)
- **Animation**: GSAP (Cinematic UX transitions)
- **State Management**: Zustand (Inertial state control)
- **Theme**: Slate-White High-Contrast Mission Control

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd amd
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture
GridSentinel follows an **Inertial Operational Pattern**:
- **alertStore**: Manages signal detection and user resolutions.
- **uiStore**: Controls camera positions and UX "locking" during investigations.
- **Services**: Mock telemetry streams for the Bangalore Pilot period.

---
*Developed for the BESCOM Intelligence Pilot program.*

