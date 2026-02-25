import gsap from 'gsap';

// ─── Camera transition ──────────────────────────────────────────────
export function animateCameraToFeeder(
    cameraRef: { current: { position: { x: number; y: number; z: number } } | null },
    targetPos: { x: number; y: number; z: number },
    duration = 1.2
) {
    if (!cameraRef.current) return;
    gsap.to(cameraRef.current.position, {
        x: targetPos.x + 2,
        y: targetPos.y + 3,
        z: targetPos.z + 4,
        duration,
        ease: 'power2.inOut',
    });
}

// ─── Feeder pulse animation ─────────────────────────────────────────
export function pulseFeeder(
    meshRef: { current: { scale: { x: number; y: number; z: number } } | null },
    intensity: 'idle' | 'suspicious' | 'anomaly',
    speedMultiplier = 1.0
) {
    if (!meshRef.current) return null;

    const configs = {
        idle: { scale: 1.0, duration: 0 },
        suspicious: { scale: 1.06, duration: 2.0 / speedMultiplier },
        anomaly: { scale: 1.08, duration: 3.0 / speedMultiplier },
    };

    const cfg = configs[intensity];
    if (cfg.duration === 0) {
        gsap.set(meshRef.current.scale, { x: 1, y: 1, z: 1 });
        return null;
    }

    return gsap.to(meshRef.current.scale, {
        x: cfg.scale,
        y: cfg.scale,
        z: cfg.scale,
        duration: cfg.duration,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
    });
}

// ─── Alert slide-in ─────────────────────────────────────────────────
export function slideInAlerts(containerSelector: string) {
    gsap.fromTo(
        `${containerSelector} .alert-card`,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power2.out' }
    );
}

// ─── UI state transition ────────────────────────────────────────────
export function transitionUIState(
    saturation: number,
    animSpeed: number
) {
    gsap.to(document.documentElement, {
        '--ui-saturation': saturation,
        '--ui-anim-speed': animSpeed,
        duration: 0.8,
        ease: 'power1.inOut',
    });
}

// ─── Evidence panel slide ───────────────────────────────────────────
export function slideEvidencePanel(show: boolean) {
    gsap.to('.evidence-panel', {
        y: show ? 0 : '100%',
        opacity: show ? 1 : 0,
        duration: 0.7,
        ease: show ? 'power2.out' : 'power2.in',
    });
}

// ─── Hover breathe ──────────────────────────────────────────────────
export function breatheAnimation(
    meshRef: { current: { scale: { x: number; y: number; z: number } } | null },
    active: boolean
) {
    if (!meshRef.current) return null;
    if (!active) {
        gsap.to(meshRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
        return null;
    }
    return gsap.to(meshRef.current.scale, {
        x: 1.08,
        y: 1.08,
        z: 1.08,
        duration: 0.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
    });
}
