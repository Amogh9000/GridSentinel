import { useEffect } from 'react';
import { useGridStore } from './state/gridStore';
import { useAlertStore } from './state/alertStore';
import { useUIStore } from './state/uiStore';
import { useReplayAnimation } from './hooks/useReplayAnimation';
import { fetchInitialState } from './services/api';
import { startWebSocket } from './services/socket';
import Homepage from './app/Homepage/Homepage';
import SystemHealth from './app/SystemHealth/SystemHealth';
import AlertFlow from './app/AlertFlow/AlertFlow';
import GridScene from './app/GridScene/GridScene';
import Timeline from './app/Timeline/Timeline';
import EvidencePanel from './app/EvidencePanel/EvidencePanel';
import InvestigationHeader from './app/InvestigationHeader/InvestigationHeader';
import GeographicContext from './app/GeographicContext/GeographicContext';
import SimulationPanel from './app/SimulationPanel/SimulationPanel';
import './App.css';

export default function App() {
  const bootComplete = useUIStore((s) => s.bootComplete);
  const uiState = useUIStore((s) => s.uiState);
  const geoContextVisible = useUIStore((s) => s.geoContextVisible);
  const heatmapMode = useUIStore((s) => s.heatmapMode);
  const simulationMode = useUIStore((s) => s.simulationMode);

  useReplayAnimation();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      const { feeders, alerts } = await fetchInitialState();
      useGridStore.getState().setFeeders(feeders);
      useAlertStore.getState().setAlerts(alerts);
      cleanup = startWebSocket();
    })();
    return () => cleanup?.();
  }, []);

  return (
    <div className={`app app--${uiState}`}>
      {/* Cinematic homepage overlay */}
      <Homepage />

      {/* System health bar */}
      <SystemHealth />

      {/* Investigation header (only visible during investigation) */}
      <InvestigationHeader />

      {/* Simulation control panel (slide-in when Simulation Mode is on) */}
      {simulationMode && <SimulationPanel />}

      <div className="app__body">
        <div className={`app__sidebar ${!bootComplete ? 'app__sidebar--hidden' : ''}`}>
          <AlertFlow />
        </div>
        <div className={`app__main ${geoContextVisible ? 'app__main--geo-active' : ''}`}>
          <GridScene />
          <EvidencePanel />

          {/* Geographic verification layer — slides in from right */}
          <GeographicContext />

          {/* Revenue risk heatmap legend */}
          {heatmapMode && (
            <div className="heatmap-legend" aria-hidden>
              <span className="heatmap-legend__title">Revenue Risk</span>
              <div className="heatmap-legend__items">
                <span className="heatmap-legend__item heatmap-legend__item--low">Low</span>
                <span className="heatmap-legend__item heatmap-legend__item--medium">Medium</span>
                <span className="heatmap-legend__item heatmap-legend__item--high">High</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`app__timeline ${!bootComplete ? 'app__timeline--hidden' : ''}`}>
        <Timeline />
      </div>
    </div>
  );
}
