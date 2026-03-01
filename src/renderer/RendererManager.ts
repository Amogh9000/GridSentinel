import { useUIStore } from '../state/uiStore';

export type RendererMode = 'map' | '3d';

export default class RendererManager {
  private inited = false;
  private canvas: HTMLCanvasElement | null = null;
  private mode: RendererMode = '3d';
  private running = false;
  private ready = false;

  // Optional hook for external readiness handshake
  onReady?: () => void;

  async init(canvas: HTMLCanvasElement) {
    if (this.inited) {
      // Guard against multiple WebGL contexts by reusing the existing canvas
      if (this.canvas && this.canvas !== canvas) {
        console.debug('webgl:contextcreated:reuse', this.canvas.id || 'main-canvas');
        this.canvas = canvas;
      }
      return;
    }

    this.canvas = canvas;
    this.inited = true;
    this.running = true;
    console.debug('renderer:init', Date.now());

    // We intentionally do not create the WebGL context here – that is owned by
    // @react-three/fiber via the <Canvas> component. Telemetry for the actual
    // context creation is emitted from inside the 3D scene once the renderer
    // is available.
  }

  setReady() {
    if (this.ready) return;
    this.ready = true;
    console.debug('renderer:ready', Date.now());
    if (this.onReady) {
      this.onReady();
    }
  }

  switchMode(mode: RendererMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    console.debug('renderer:switch', mode, Date.now());

    // Keep the global UI store in sync with the renderer mode without
    // triggering redundant updates.
    const currentView = useUIStore.getState().viewMode;
    const targetView = mode === '3d' ? '3D' : '2D';
    if (currentView !== targetView) {
      useUIStore.getState().setViewMode(targetView);
    }
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    console.debug('renderer:pause', Date.now());
  }

  resume() {
    if (this.running) return;
    this.running = true;
    console.debug('renderer:resume', Date.now());
  }

  destroy() {
    if (!this.inited) return;
    console.debug('renderer:destroy', Date.now());
    this.inited = false;
    this.running = false;
    this.canvas = null;
    this.ready = false;
  }
}

