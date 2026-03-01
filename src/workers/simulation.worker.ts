// simulation.worker.ts
const ctx: Worker = self as any;
import { computeProjection } from '../utils/simulationProjection';

ctx.onmessage = (e) => {
    const { type, data } = e.data;

    if (type === 'GET_PROJECTION') {
        const result = computeProjection(data);
        ctx.postMessage({ type: 'PROJECTION_RESULT', data: result });
    }
};
