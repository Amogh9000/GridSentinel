import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Text, Grid, Float } from '@react-three/drei';
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
    suspicious: '#f59e0b',
    anomaly: '#dc2626',
};

// ─── Single feeder node ──────────────────────────────────────────
function FeederNode({ feeder }: { feeder: Feeder }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const cageRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const [hovered, setHovered] = useState(false);

    const animationSpeed = useUIStore((s) => s.animationSpeed);
    const focusedFeederId = useUIStore((s) => s.focusedFeederId);
    const uiState = useUIStore((s) => s.uiState);
    const enterInvestigation = useUIStore((s) => s.enterInvestigation);
    const heatmapMode = useUIStore((s) => s.heatmapMode);
    const setActiveAlert = useAlertStore((s) => s.setActiveAlert);
    const alerts = useAlertStore((s) => s.alerts);

    const isFocused = focusedFeederId === feeder.id;
    const isInvestigating = uiState === 'investigation';
    const isDimmed = isInvestigating && !isFocused;

    // Revenue Risk coloring
    const maxImpact = useMemo(() => getMaxImpact(alerts), [alerts]);
    const feederAlert = useMemo(() => alerts.find(a => a.feederId === feeder.id), [alerts, feeder.id]);
    const normalizedImpact = feederAlert ? getNormalizedImpact(feederAlert.economicImpact, maxImpact) : 0;
    const impactHex = impactColorScale(normalizedImpact);

    const color = heatmapMode && feederAlert
        ? new THREE.Color(impactHex)
        : new THREE.Color(STATUS_COLORS[feeder.status]);
    const emissiveColor = heatmapMode && feederAlert
        ? new THREE.Color(impactHex)
        : new THREE.Color(STATUS_EMISSIVE[feeder.status]);

    // Pulse animation for suspicious/anomaly feeders
    useEffect(() => {
        if (!meshRef.current) return;
        if (feeder.status === 'normal' || isDimmed) {
            gsap.killTweensOf(meshRef.current.scale);
            gsap.set(meshRef.current.scale, { x: 1, y: 1, z: 1 });
            return;
        }
        const duration = feeder.status === 'suspicious' ? 2.0 / animationSpeed : 1.5 / animationSpeed;
        const scale = feeder.status === 'suspicious' ? 1.05 : 1.15;
        const tween = gsap.to(meshRef.current.scale, {
            x: scale, y: scale, z: scale,
            duration, ease: 'sine.inOut', yoyo: true, repeat: -1,
        });
        return () => { tween.kill(); };
    }, [feeder.status, animationSpeed, isDimmed]);

    // Constant rotation for the selection ring
    useFrame((state) => {
        if (ringRef.current && isFocused) {
            ringRef.current.rotation.y += 0.02 * animationSpeed;
            ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
        }
        if (cageRef.current) {
            cageRef.current.rotation.y += 0.005 * (isFocused ? 2 : 1);
        }
    });

    // Glow pulse logic
    useFrame(() => {
        if (!glowRef.current) return;
        const mat = glowRef.current.material as THREE.MeshBasicMaterial;
        if (isDimmed) {
            mat.opacity = 0;
            return;
        }
        const t = performance.now() * 0.001;
        if (feeder.status === 'anomaly') {
            mat.opacity = 0.4 + Math.sin(t * 3.0) * 0.2;
        } else if (feeder.status === 'suspicious') {
            mat.opacity = 0.2 + Math.sin(t * 1.5) * 0.1;
        } else {
            mat.opacity = 0.02;
        }
    });

    const handleClick = () => {
        if (isDimmed || uiState === 'boot') return;
        const alert = alerts.find(a => a.feederId === feeder.id);
        if (alert) {
            setActiveAlert(alert.id);
            enterInvestigation(feeder.id);
        }
    };

    return (
        <group position={[feeder.position.x, feeder.position.y, feeder.position.z]}>
            {/* Inner Core */}
            <mesh
                ref={meshRef}
                onPointerOver={() => { if (!isDimmed) { setHovered(true); document.body.style.cursor = 'pointer'; } }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
                onClick={handleClick}
            >
                <icosahedronGeometry args={[0.3, 1]} />
                <meshStandardMaterial
                    ref={matRef}
                    color={color}
                    emissive={emissiveColor}
                    emissiveIntensity={isDimmed ? 0.05 : (hovered ? 1.5 : (feeder.status === 'anomaly' ? 2 : 0.8))}
                    roughness={0.2}
                    metalness={0.8}
                    transparent
                    opacity={isDimmed ? 0.2 : 0.9}
                />
            </mesh>

            {/* Wireframe Cage */}
            <mesh ref={cageRef}>
                <boxGeometry args={[0.6, 0.6, 0.6]} />
                <meshBasicMaterial
                    color={color}
                    wireframe
                    transparent
                    opacity={isDimmed ? 0.05 : 0.2}
                />
            </mesh>

            {/* Atmosphere Glow */}
            <mesh ref={glowRef} scale={[1.8, 1.8, 1.8]}>
                <sphereGeometry args={[0.35, 16, 16]} />
                <meshBasicMaterial
                    color={STATUS_COLORS[feeder.status]}
                    transparent
                    opacity={0}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Selection HUD */}
            {isFocused && (
                <group ref={ringRef}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.7, 0.75, 3]} />
                        <meshBasicMaterial color="#2563eb" transparent opacity={0.6} side={THREE.DoubleSide} />
                    </mesh>
                    <mesh rotation={[Math.PI / 2, 0, Math.PI]}>
                        <ringGeometry args={[0.7, 0.75, 3]} />
                        <meshBasicMaterial color="#2563eb" transparent opacity={0.3} side={THREE.DoubleSide} />
                    </mesh>
                </group>
            )}

            <Text
                position={[0, 0.8, 0]}
                fontSize={0.2}
                color={isDimmed ? '#94a3b8' : '#0f172a'}
                anchorX="center"
                anchorY="bottom"
                font={undefined}
            >
                {feeder.name}
            </Text>

            {/* Health Bar (Physicalized) */}
            {!isDimmed && (
                <group position={[0, -0.6, 0]}>
                    <mesh>
                        <boxGeometry args={[0.8, 0.05, 0.05]} />
                        <meshBasicMaterial color="rgba(15, 23, 42, 0.1)" />
                    </mesh>
                    <mesh position={[-0.4 + (feeder.health * 0.4), 0, 0.01]}>
                        <boxGeometry args={[0.8 * feeder.health, 0.06, 0.06]} />
                        <meshStandardMaterial
                            color={feeder.health > 0.6 ? '#15803d' : feeder.health > 0.35 ? '#b45309' : '#dc2626'}
                            emissive={feeder.health > 0.6 ? '#15803d' : feeder.health > 0.35 ? '#b45309' : '#dc2626'}
                            emissiveIntensity={0.5}
                        />
                    </mesh>
                </group>
            )}
        </group>
    );
}

// ─── Connection lines (Animated Flow) ────────────────────────────
function ConnectionLines() {
    const feeders = useGridStore((s) => s.feeders);
    const focusedFeederId = useUIStore((s) => s.focusedFeederId);
    const uiState = useUIStore((s) => s.uiState);
    const lineRef = useRef<any>(null);

    useFrame(() => {
        if (lineRef.current) {
            // Animate pulses along the lines
            lineRef.current.children.forEach((line: any) => {
                if (line.material) {
                    line.material.dashOffset -= 0.01;
                }
            });
        }
    });

    const lines = useMemo(() => {
        const result: { from: THREE.Vector3; to: THREE.Vector3; active: boolean; alert: boolean }[] = [];
        const seen = new Set<string>();
        feeders.forEach((feeder) => {
            feeder.connections.forEach((connId) => {
                const key = [feeder.id, connId].sort().join('-');
                if (seen.has(key)) return;
                seen.add(key);
                const target = feeders.find((f) => f.id === connId);
                if (!target) return;

                const isPartofFocus = feeder.id === focusedFeederId || connId === focusedFeederId;
                const active = uiState === 'investigation' ? isPartofFocus : true;
                const alert = feeder.status === 'anomaly' || target.status === 'anomaly';

                result.push({
                    from: new THREE.Vector3(feeder.position.x, feeder.position.y, feeder.position.z),
                    to: new THREE.Vector3(target.position.x, target.position.y, target.position.z),
                    active,
                    alert
                });
            });
        });
        return result;
    }, [feeders, focusedFeederId, uiState]);

    return (
        <group ref={lineRef}>
            {lines.map((line, i) => (
                <Line
                    key={i}
                    points={[line.from, line.to]}
                    color={line.alert ? '#dc2626' : line.active ? '#94a3b8' : '#e2e8f0'}
                    lineWidth={line.alert ? 1.5 : line.active ? 1 : 0.5}
                    dashed
                    dashScale={2}
                    dashSize={0.5}
                    transparent
                    opacity={line.active ? 0.6 : 0.1}
                />
            ))}
        </group>
    );
}

// ─── Camera controller ───────────────────────────────────────────
function CameraController() {
    const { camera } = useThree();
    const focusedFeederId = useUIStore((s) => s.focusedFeederId);
    const cameraZoom = useUIStore((s) => s.cameraZoom);
    const uiState = useUIStore((s) => s.uiState);
    const storedCameraPosition = useUIStore((s) => s.storedCameraPosition);
    const storeCameraPosition = useUIStore((s) => s.storeCameraPosition);
    const feeders = useGridStore((s) => s.feeders);

    useEffect(() => {
        if (uiState === 'boot') return;

        if (!focusedFeederId) {
            const target = storedCameraPosition || { x: 0, y: 12, z: 15 };
            // Scale target distance by inverse of zoom (zoom in = smaller number)
            const zoomFactor = 1 / cameraZoom;
            gsap.to(camera.position, {
                x: target.x * zoomFactor,
                y: target.y * zoomFactor,
                z: target.z * zoomFactor,
                duration: 1.5, ease: 'expo.inOut',
            });
            return;
        }

        storeCameraPosition({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
        });

        const feeder = feeders.find((f) => f.id === focusedFeederId);
        if (!feeder) return;

        const zoomFactor = 1 / cameraZoom;
        gsap.to(camera.position, {
            x: feeder.position.x + (4 * zoomFactor),
            y: feeder.position.y + (4 * zoomFactor),
            z: feeder.position.z + (6 * zoomFactor),
            duration: 1.2,
            ease: 'expo.out',
        });
    }, [focusedFeederId, feeders, camera, uiState, cameraZoom]);

    return null;
}

// ─── Main GridScene component ────────────────────────────────────
export default function GridScene() {
    const feeders = useGridStore((s) => s.feeders);
    const { cameraZoom, setCameraZoom, heatmapMode } = useUIStore();

    const handleZoomIn = () => setCameraZoom(cameraZoom + 0.2);
    const handleZoomOut = () => setCameraZoom(cameraZoom - 0.2);
    const handleReset = () => setCameraZoom(1.0);

    return (
        <div className="grid-scene">
            <div className="grid-controls">
                <button
                    className="grid-btn"
                    onClick={handleZoomIn}
                    title="Zoom In"
                >
                    <span className="grid-btn-icon">+</span>
                </button>
                <div className="grid-zoom-label">{(cameraZoom * 100).toFixed(0)}%</div>
                <button
                    className="grid-btn"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                >
                    <span className="grid-btn-icon">−</span>
                </button>
                <button
                    className="grid-btn grid-btn--secondary"
                    onClick={handleReset}
                    title="Reset Camera"
                >
                    <span className="grid-btn-label">RESET</span>
                </button>
            </div>

            {/* Revenue Risk Legend */}
            {heatmapMode && (
                <div className="heatmap-legend">
                    <span className="heatmap-legend__title">Revenue Risk</span>
                    <div className="heatmap-legend__items">
                        <span className="heatmap-legend__item heatmap-legend__item--low">Low</span>
                        <span className="heatmap-legend__item heatmap-legend__item--medium">Medium</span>
                        <span className="heatmap-legend__item heatmap-legend__item--high">High</span>
                    </div>
                </div>
            )}
            <Canvas camera={{ position: [0, 20, 25], fov: 45 }}>
                <color attach="background" args={['#f8fafc']} />

                {/* Refined Lighting */}
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 20, 10]} intensity={1.2} color="#ffffff" castShadow />
                <pointLight position={[-10, 5, -5]} intensity={0.8} color="#2563eb" />
                <pointLight position={[0, 10, 0]} intensity={0.5} color="#b45309" />

                <fog attach="fog" args={['#f8fafc', 20, 60]} />

                {/* Ground Plane Level-Up */}
                <Grid
                    infiniteGrid
                    fadeDistance={30}
                    fadeStrength={5}
                    cellSize={1}
                    sectionSize={5}
                    sectionThickness={1.5}
                    sectionColor="#e2e8f0"
                    cellColor="#cbd5e1"
                    position={[0, -1, 0]}
                    receiveShadow
                />

                <CameraController />

                <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
                    <ConnectionLines />
                    {feeders.map((feeder) => (
                        <FeederNode key={feeder.id} feeder={feeder} />
                    ))}
                </Float>

                {/* Subtle base reflection effect */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]}>
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="#f8fafc" roughness={0.8} metalness={0.1} />
                </mesh>
            </Canvas>
        </div>
    );
}

