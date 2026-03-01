import { useEffect, useRef } from 'react';
import { useUIStore } from '../state/uiStore';

const REPLAY_DURATION_MS = 6000;
const TIMELINE_LENGTH = 167;

/**
 * When replayMode is true, drives replayProgress 0 → 1 over REPLAY_DURATION_MS
 * and syncs timePosition to the timeline. Calls stopReplay() when complete.
 */
export function useReplayAnimation() {
    const replayMode = useUIStore((s) => s.replayMode);
    const setReplayProgress = useUIStore((s) => s.setReplayProgress);
    const setTimePosition = useUIStore((s) => s.setTimePosition);
    const stopReplay = useUIStore((s) => s.stopReplay);
    const rafRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        if (!replayMode) return;

        startTimeRef.current = performance.now();

        const tick = () => {
            const elapsed = performance.now() - startTimeRef.current;
            const progress = Math.min(1, elapsed / REPLAY_DURATION_MS);

            setReplayProgress(progress);
            setTimePosition(progress * TIMELINE_LENGTH);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                stopReplay();
            }
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [replayMode, setReplayProgress, setTimePosition, stopReplay]);
}
