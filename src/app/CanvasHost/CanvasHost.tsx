import { useEffect, useRef, useState } from 'react';
import RendererManager from '../../renderer/RendererManager';
import GridScene from '../GridScene/GridScene';

type RendererMode = 'map' | '3d';

interface CanvasHostProps {
  mode: RendererMode;
  onReady?: () => void;
}

export default function CanvasHost({ mode, onReady }: CanvasHostProps) {
  const rendererRef = useRef<RendererManager | null>(null);
  const [ready, setReady] = useState(false);

  // Initialise the renderer manager once and keep it paused/resumed with React
  useEffect(() => {
    if (!rendererRef.current) {
      rendererRef.current = new RendererManager();
      rendererRef.current.onReady = () => {
        console.debug('canvas:visible', true);
        setReady(true);
        onReady?.();
      };
    } else {
      rendererRef.current.resume();
    }

    return () => {
      rendererRef.current?.pause();
      console.debug('canvas:visible', false);
    };
  }, [onReady]);

  // Respond to external mode changes (map ↔ 3d) without remounting the canvas
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.switchMode(mode);
  }, [mode]);

  return (
    <div className="canvas-host">
      <GridScene />
      {!ready && (
        <div className="canvas-skeleton">
          Loading map…
        </div>
      )}
    </div>
  );
}

