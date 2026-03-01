import { useUIStore } from '../../state/uiStore';
import './viewSwitcher.css';

export default function ViewSwitcher() {
    const viewMode = useUIStore((s) => s.viewMode);
    const setViewMode = useUIStore((s) => s.setViewMode);
    const appMode = useUIStore((s) => s.appMode);
    const coreReady = useUIStore((s) => s.coreReady);
    const isSidePanelOpen = useUIStore((s) => s.isSidePanelOpen);
    const toggleSidePanel = useUIStore((s) => s.toggleSidePanel);

    const isLoading = appMode === 'loading' || !coreReady;
    if (appMode === 'idle') return null;

    return (
        <div className="view-switcher">
            <div className="view-switcher__modes">
                <button
                    className={`view-switcher__btn ${viewMode === '2D' ? 'view-switcher__btn--active' : ''}`}
                    onClick={() => {
                        console.debug('renderer:switch', 'map', Date.now());
                        setViewMode('2D');
                    }}
                    disabled={isLoading}
                >
                    <span className="view-switcher__icon">🗺️</span>
                    <span className="view-switcher__label">Map View</span>
                </button>
                <button
                    className={`view-switcher__btn ${viewMode === '3D' ? 'view-switcher__btn--active' : ''}`}
                    onClick={() => {
                        console.debug('renderer:switch', '3d', Date.now());
                        setViewMode('3D');
                    }}
                    disabled={isLoading}
                >
                    <span className="view-switcher__icon">🧊</span>
                    <span className="view-switcher__label">Spatial View</span>
                </button>
            </div>

            {viewMode === '3D' && (
                <button
                    className={`view-switcher__dual-btn ${isSidePanelOpen ? 'view-switcher__dual-btn--active' : ''}`}
                    onClick={() => {
                        console.debug(isSidePanelOpen ? 'sidebar:close' : 'sidebar:open', 'mapPreview');
                        toggleSidePanel();
                    }}
                    disabled={isLoading}
                >
                    <span className="view-switcher__icon">🧭</span>
                    <span className="view-switcher__label">{isSidePanelOpen ? 'Hide Map' : 'View Map'}</span>
                </button>
            )}
        </div>
    );
}
