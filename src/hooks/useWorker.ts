import { useEffect, useRef, useState } from 'react';

export function useWorker(workerPath: string) {
    const workerRef = useRef<Worker | null>(null);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        workerRef.current = new Worker(new URL(workerPath, import.meta.url));

        workerRef.current.onmessage = (e) => {
            setResult(e.data);
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, [workerPath]);

    const postMessage = (message: any) => {
        workerRef.current?.postMessage(message);
    };

    return { result, postMessage };
}
