import { useEffect, useRef } from 'react';
import { useUIStore } from '../../state/uiStore';
import gsap from 'gsap';
import './homepage.css';

interface HomepageProps {
    forceVisible?: boolean;
}

export default function Homepage({ forceVisible = false }: HomepageProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const subtitleRef = useRef<HTMLDivElement>(null);
    const signalsRef = useRef<HTMLDivElement>(null);
    const bootComplete = useUIStore((s) => s.bootComplete);
    const setBootComplete = useUIStore((s) => s.setBootComplete);
    const isVisible = forceVisible || !bootComplete;

    useEffect(() => {
        if (bootComplete) return;

        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        // Phase 1: Title fade in
        tl.fromTo(
            titleRef.current,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 1.2 },
            0.5
        );

        // Phase 2: Subtitle
        tl.fromTo(
            subtitleRef.current,
            { opacity: 0, y: 8 },
            { opacity: 0.5, y: 0, duration: 0.8 },
            1.4
        );

        // Phase 3: Live signal indicators
        tl.fromTo(
            signalsRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.6 },
            2.4
        );

        // Phase 4: Begin dissolution — zoom into grid
        tl.to(
            titleRef.current,
            { opacity: 0, y: -20, duration: 0.8, ease: 'power2.in' },
            4.5
        );
        tl.to(
            subtitleRef.current,
            { opacity: 0, y: -12, duration: 0.6, ease: 'power2.in' },
            4.7
        );
        tl.to(
            signalsRef.current,
            { opacity: 0, duration: 0.5, ease: 'power2.in' },
            4.9
        );

        // Phase 5: Overlay dissolves
        tl.to(
            overlayRef.current,
            {
                opacity: 0,
                duration: 1.0,
                ease: 'expo.out',
                onComplete: () => {
                    setBootComplete();
                },
            },
            5.2
        );

        return () => { tl.kill(); };
    }, [bootComplete, setBootComplete]);

    if (!isVisible) return null;

    return (
        <div ref={overlayRef} className="homepage-overlay">
            <div className="homepage__content">
                <div ref={titleRef} className="homepage__title" style={{ opacity: 0 }}>
                    <span className="homepage__title-grid">GRID</span>
                    <span className="homepage__title-sentinel">SENTINEL</span>
                </div>

                <div ref={subtitleRef} className="homepage__subtitle" style={{ opacity: 0 }}>
                    Edge-AI Monitoring Active
                </div>

                <div ref={signalsRef} className="homepage__signals" style={{ opacity: 0 }}>
                    <div className="homepage__signal">
                        <div className="homepage__signal-dot homepage__signal-dot--online" />
                        <span>4 Edge Nodes Online</span>
                    </div>
                    <div className="homepage__signal">
                        <span className="homepage__signal-value">97%</span>
                        <span>Data Freshness</span>
                    </div>
                    <div className="homepage__signal">
                        <span className="homepage__signal-value">12s</span>
                        <span>Last Inference</span>
                    </div>
                </div>
            </div>

            {/* Subtle ambient scan lines */}
            <div className="homepage__scanlines" />
        </div>
    );
}
