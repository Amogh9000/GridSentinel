import { useEffect } from 'react';
import { useGridStore } from './state/gridStore';
import { useAlertStore } from './state/alertStore';
import { useUIStore } from './state/uiStore';
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
import MapDashboard from './app/MapDashboard/MapDashboard';
import SimulationPanel from './app/SimulationPanel/SimulationPanel';
import './App.css';

export default function App() {
  const bootComplete = useUIStore((s) => s.bootComplete);
  const uiState = useUIStore((s) => s.uiState);
  const geoContextVisible = useUIStore((s) => s.geoContextVisible);
  const viewMode = useUIStore((s) => s.viewMode);

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

  const is3D = viewMode === '3D';

  return (
    <div className={`app app--${uiState}`}>
      {/* Cinematic homepage overlay */}
      <Homepage />

      {/* System health bar */}
      <SystemHealth />

      {/* Investigation header (only visible during investigation) */}
      <InvestigationHeader />

      <div className="app__body">
        {is3D ? (
          <>
            {/* === 3D GLOBE MODE (original layout, untouched) === */}
            <div className={`app__sidebar ${!bootComplete ? 'app__sidebar--hidden' : ''}`}>
              <AlertFlow />
            </div>
            <div className={`app__main ${geoContextVisible ? 'app__main--geo-active' : ''}`}>
              <GridScene />
              <EvidencePanel />
              <GeographicContext />
            </div>
          </>
        ) : (
          <>
            {/* === MAP DASHBOARD MODE (full-width, no sidebar) === */}
            <div className="app__main app__main--full">
              <MapDashboard />
              <SimulationPanel />
            </div>
          </>
        )}
      </div>

      <div className={`app__timeline ${!bootComplete ? 'app__timeline--hidden' : ''}`}>
        <Timeline />
      </div>
    </div>
  );
}

