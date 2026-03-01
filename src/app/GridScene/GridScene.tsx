import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGridStore, type Feeder, type FeederStatus } from '../../state/gridStore';
import { useUIStore } from '../../state/uiStore';
import { useAlertStore } from '../../state/alertStore';
import { getMaxImpact, getNormalizedImpact, impactColorScale } from '../../utils/heatmapScale';
import gsap from 'gsap';
import './gridScene.css';

const STATUS_COLORS: Record<FeederStatus, string> = {
    normal: '#64748b',
    suspicious: '#b45309',
    anomaly: '#dc2626',
};

const STATUS_EMISSIVE: Record<FeederStatus, string> = {
    normal: '#e2e8f0',
    suspicious: '#b45309',
    anomaly: '#dc2626',
};

// ─── Single feeder node ──────────────────────────────────────────
function FeederNode({ feeder, feederIndex }: { feeder: Feeder; feederIndex: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const [hovered, setHovered] = useState(false);
    const animationSpeed = useUIStore((s) => s.animationSpeed);
    const focusedFeederId = useUIStore((s) => s.focusedFeederId);
    const uiState = useUIStore((s) => s.uiState);
    const heatmapMode = useUIStore((s) => s.heatmapMode);
    const simulationMode = useUIStore((s) => s.simulationMode);
    const affectedFeeders = useUIStore((s) => s.affectedFeeders);
    const replayMode = useUIStore((s) => s.replayMode);
    const replayProgress = useUIStore((s) => s.replayProgress);
    const enterInvestigation = useUIStore((s) => s.enterInvestigation);
    const setActiveAlert = useAlertStore((s) => s.setActiveAlert);
    const alerts = useAlertStore((s) => s.alerts);
    const activeAlertId = useAlertStore((s) => s.activeAlertId);

    const activeAlert = useMemo(() => alerts.find((a) => a.id === activeAlertId), [alerts, activeAlertId]);
    const isReplayFeeder = Boolean(replayMode && activeAlert?.feederId === feeder.id);
    const replayGlowIntensity = 0.1 + replayProgress * 0.7; // base 0.1 → max 0.8

    // Simulation overlay: first N feeders get subtle amber glow (no real state change)
    const isSimulatedFeeder = Boolean(simulationMode && feederIndex < affectedFeeders);
    const simulationGlowIntensity = 0.25;

    const isFocused = focusedFeederId === feeder.id;
    const isInvestigating = uiState === 'investigation';
    const isDimmed = isInvestigating && !isFocused;

    const alert = useMemo(() => alerts.find((a) => a.feederId === feeder.id), [alerts, feeder.id]);
    const maxImpact = useMemo(() => getMaxImpact(alerts), [alerts]);
    const normalizedImpact = alert ? getNormalizedImpact(alert.economicImpact, maxImpact) : 0;
    const heatColor = impactColorScale(normalizedImpact);

    const displayColor =
        isSimulatedFeeder
            ? '#b45309'
            : isReplayFeeder
                ? STATUS_COLORS[feeder.status]
                : heatmapMode
                    ? (alert ? heatColor : '#94a3b8')
                    : STATUS_COLORS[feeder.status];
    const displayEmissive =
        isSimulatedFeeder
            ? '#b45309'
            : isReplayFeeder
                ? STATUS_EMISSIVE[feeder.status]
                : heatmapMode
                    ? (alert ? heatColor : '#94a3b8')
                    : STATUS_EMISSIVE[feeder.status];
    const displayEmissiveIntensity = isSimulatedFeeder
        ? simulationGlowIntensity
        : isReplayFeeder
            ? replayGlowIntensity
            : heatmapMode
                ? (alert ? normalizedImpact * 2 : 0.02)
                : (isDimmed ? 0.02 : feeder.status === 'anomaly' ? 0.8 : feeder.status === 'suspicious' ? 0.4 : 0.05);
    const displayGlowColor = isSimulatedFeeder
        ? '#b45309'
        : isReplayFeeder
            ? STATUS_COLORS[feeder.status]
            : heatmapMode && alert
                ? heatColor
                : STATUS_COLORS[feeder.status];

    const color = new THREE.Color(displayColor);
    const emissiveColor = new THREE.Color(displayEmissive);

    // Pulse animation for suspicious/anomaly feeders (disabled in heatmap mode)
    useEffect(() => {
        if (!meshRef.current) return;
        if (heatmapMode || feeder.status === 'normal' || isDimmed) {
            gsap.killTweensOf(meshRef.current.scale);
            gsap.set(meshRef.current.scale, { x: 1, y: 1, z: 1 });
            return;
        }
        const duration = feeder.status === 'suspicious' ? 2.0 / animationSpeed : 3.0 / animationSpeed;
        const scale = feeder.status === 'suspicious' ? 1.06 : 1.1;
        const tween = gsap.to(meshRef.current.scale, {
            x: scale, y: scale, z: scale,
            duration, ease: 'sine.inOut', yoyo: true, repeat: -1,
        });
        return () => { tween.kill(); };
    }, [heatmapMode, feeder.status, animationSpeed, isDimmed]);

    // Glow: replay uses progress-based intensity; heatmap uses impact; otherwise status-based pulse
    useFrame(() => {
        if (!glowRef.current) return;
        const mat = glowRef.current.material as THREE.MeshBasicMaterial;
        if (isDimmed) {
            mat.opacity = 0;
            return;
        }
        if (isSimulatedFeeder) {
            mat.color.set(displayGlowColor);
            mat.opacity = 0.35;
            return;
        }
        if (isReplayFeeder) {
            mat.color.set(displayGlowColor);
            mat.opacity = 0.2 + replayGlowIntensity * 0.6;
            return;
        }
        if (heatmapMode) {
            if (alert) {
                mat.color.set(displayGlowColor);
                mat.opacity = 0.3 + normalizedImpact * 0.5;
            } else {
                mat.opacity = 0;
            }
            return;
        }
        if (feeder.status === 'anomaly') {
            const t = performance.now() * 0.001;
            mat.opacity = 0.4 + Math.sin(t * 0.8) * 0.3;
        } else if (feeder.status === 'suspicious') {
            const t = performance.now() * 0.001;
            mat.opacity = 0.2 + Math.sin(t * 1.2) * 0.15;
        } else {
            mat.opacity = 0;
        }
    });

    // Dim non-focused feeders during investigation
    useEffect(() => {
        if (!matRef.current) return;
        if (isDimmed) {
            gsap.to(matRef.current, { opacity: 0.15, duration: 0.8, ease: 'power2.out' });
        } else {
            gsap.to(matRef.current, { opacity: 1.0, duration: 0.6, ease: 'power2.out' });
        }
    }, [isDimmed]);

    // Hover breathe
    useEffect(() => {
        if (!meshRef.current || feeder.status !== 'normal' || isDimmed) return;
        if (hovered) {
            const tween = gsap.to(meshRef.current.scale, {
                x: 1.08, y: 1.08, z: 1.08,
                duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: -1,
            });
            return () => { tween.kill(); };
        } else {
            gsap.to(meshRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
        }
    }, [hovered, feeder.status, isDimmed]);

    const handleClick = () => {
        if (isDimmed) return; // locked during investigation
        if (uiState === 'boot') return;
        const alert = alerts.find(a => a.feederId === feeder.id);
        if (alert) {
            setActiveAlert(alert.id);
            enterInvestigation(feeder.id);
        }
    };

    return (
        <group position={[feeder.position.x, feeder.position.y, feeder.position.z]}>
            <mesh
                ref={meshRef}
                onPointerOver={() => { if (!isDimmed) { setHovered(true); document.body.style.cursor = 'pointer'; } }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
                onClick={handleClick}
            >
                <icosahedronGeometry args={[0.35, 1]} />
                <meshStandardMaterial
                    ref={matRef}
                    color={color}
                    emissive={emissiveColor}
                    emissiveIntensity={displayEmissiveIntensity}
                    roughness={0.6}
                    metalness={0.3}
                    transparent
                    opacity={1}
                />
            </mesh>

            <mesh ref={glowRef} scale={[1.8, 1.8, 1.8]}>
                <icosahedronGeometry args={[0.35, 1]} />
                <meshBasicMaterial
                    color={displayGlowColor}
                    transparent
                    opacity={0}
                    depthWrite={false}
                />
            </mesh>

            {isFocused && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.5, 0.55, 32]} />
                    <meshBasicMaterial color="#2980b9" transparent opacity={0.7} side={THREE.DoubleSide} />
                </mesh>
            )}

            <Text
                position={[0, 0.6, 0]}
                fontSize={0.18}
                color={isDimmed ? '#94a3b8' : '#1e293b'}
                anchorX="center"
                anchorY="bottom"
                font={undefined}
            >
                {feeder.name}
            </Text>

            {!isDimmed && (
                <>
                    <mesh position={[0, -0.55, 0]}>
                        <boxGeometry args={[0.6, 0.04, 0.04]} />
                        <meshBasicMaterial color="#e2e8f0" />
                    </mesh>
                    <mesh position={[-0.3 + feeder.health * 0.3, -0.55, 0]}>
                        <boxGeometry args={[0.6 * feeder.health, 0.04, 0.04]} />
                        <meshBasicMaterial color={feeder.health > 0.6 ? '#15803d' : feeder.health > 0.35 ? '#b45309' : '#dc2626'} />
                    </mesh>
                </>
            )}
        </group>
    );
}

// ─── Connection lines ────────────────────────────────────────────
function ConnectionLines() {
    const feeders = useGridStore((s) => s.feeders);
    const focusedFeederId = useUIStore((s) => s.focusedFeederId);
    const uiState = useUIStore((s) => s.uiState);
    const isInvestigating = uiState === 'investigation';

    const lines = useMemo(() => {
        const result: { from: THREE.Vector3; to: THREE.Vector3; connected: boolean }[] = [];
        const seen = new Set<string>();
        feeders.forEach((feeder) => {
            feeder.connections.forEach((connId) => {
                const key = [feeder.id, connId].sort().join('-');
                if (seen.has(key)) return;
                seen.add(key);
                const target = feeders.find((f) => f.id === connId);
                if (!target) return;
                const connected = isInvestigating
                    ? feeder.id === focusedFeederId || connId === focusedFeederId
                    : true;
                result.push({
                    from: new THREE.Vector3(feeder.position.x, feeder.position.y, feeder.position.z),
                    to: new THREE.Vector3(target.position.x, target.position.y, target.position.z),
                    connected,
                });
            });
        });
        return result;
    }, [feeders, focusedFeederId, isInvestigating]);

    return (
        <>
            {lines.map((line, i) => (
                <Line
                    key={i}
                    points={[line.from, line.to]}
                    color={line.connected ? '#cbd5e1' : '#e2e8f0'}
                    lineWidth={line.connected ? 1 : 0.5}
                    transparent
                    opacity={line.connected ? 0.8 : 0.3}
                />
            ))}
        </>
    );
}

// ─── Camera controller ───────────────────────────────────────────
function CameraController() {
    const { camera } = useThree();
    const focusedFeederId = useUIStore((s) => s.focusedFeederId);
    const uiState = useUIStore((s) => s.uiState);
    const storedCameraPosition = useUIStore((s) => s.storedCameraPosition);
    const storeCameraPosition = useUIStore((s) => s.storeCameraPosition);
    const feeders = useGridStore((s) => s.feeders);

    useEffect(() => {
        if (uiState === 'boot') return; // homepage controls camera during boot

        if (!focusedFeederId) {
            // Return to stored or default position
            const target = storedCameraPosition || { x: 0, y: 8, z: 10 };
            gsap.to(camera.position, {
                x: target.x, y: target.y, z: target.z,
                duration: 1.2, ease: 'power2.inOut',
            });
            return;
        }

        // Store current camera pos before moving
        storeCameraPosition({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
        });

        const feeder = feeders.find((f) => f.id === focusedFeederId);
        if (!feeder) return;
        gsap.to(camera.position, {
            x: feeder.position.x + 2,
            y: feeder.position.y + 3,
            z: feeder.position.z + 5,
            duration: 1.2,
            ease: 'power2.inOut',
        });
    }, [focusedFeederId, feeders, camera, uiState]);

    return null;
}

// ─── Main GridScene component ────────────────────────────────────
export default function GridScene() {
    const feeders = useGridStore((s) => s.feeders);

    return (
        <div className="grid-scene">
            <Canvas camera={{ position: [0, 14, 18], fov: 50 }}>
                <color attach="background" args={['#f1f5f9']} />
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
                <pointLight position={[-10, 5, -5]} intensity={0.5} color="#b45309" />
                <fog attach="fog" args={['#f1f5f9', 14, 40]} />

                <CameraController />
                <ConnectionLines />
                {feeders.map((feeder, i) => (
                    <FeederNode key={feeder.id} feeder={feeder} feederIndex={i} />
                ))}

                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                    <planeGeometry args={[0, 0]} />
                    {/* Floor removed for cleaner light mode look, or use very subtle plane */}
                    <meshStandardMaterial color="#f1f5f9" transparent opacity={0.1} />
                </mesh>
            </Canvas>
        </div>
    );
}
